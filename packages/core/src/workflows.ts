import type { JobOptions, JobRunner } from "./orchestration.js"

/**
 * Runtime context passed to each step's run and compensate functions.
 */
export interface WorkflowContext {
  /** Name of the workflow currently executing. */
  workflowName: string
  /** JobRunner adapter — required when the workflow contains async steps. */
  jobRunner?: JobRunner
  /**
   * Accumulated results from prior steps, keyed by step name.
   * Later steps may read outputs produced by earlier steps.
   */
  results: Record<string, unknown>
}

/**
 * Run function for a step. Receives the workflow input and context;
 * returns the step's output (which is stored in `ctx.results`).
 */
export type StepRunFn<TInput = unknown, TOutput = unknown> = (
  input: TInput,
  ctx: WorkflowContext,
) => TOutput | Promise<TOutput>

/**
 * Compensation function for a step. Invoked in reverse order on
 * workflow failure. Receives the step's own output (what `run` returned).
 */
export type StepCompensateFn<TOutput = unknown> = (
  output: TOutput,
  ctx: WorkflowContext,
) => void | Promise<void>

/**
 * Internal step definition accumulated by the {@link step} builder.
 */
export interface StepDefinition {
  name: string
  runFn?: StepRunFn
  compensateFn?: StepCompensateFn
  isAsync: boolean
  jobOptions?: JobOptions
}

/**
 * Fluent builder for a workflow step. Chain `.run()`, optionally
 * `.compensate()` and `.async()`.
 */
export interface StepBuilder<TInput = unknown, TOutput = unknown> {
  /** Sets the step's run function. */
  run(fn: StepRunFn<TInput, TOutput>): StepBuilder<TInput, TOutput>
  /** Sets the step's compensation (rollback) function. */
  compensate(fn: StepCompensateFn<TOutput>): StepBuilder<TInput, TOutput>
  /**
   * Marks the step as async: when reached, the workflow enqueues a job via
   * the injected {@link JobRunner} and continues without blocking. The step
   * name becomes the job name and the workflow input is the payload.
   * Async steps do not participate in compensation.
   */
  async(options?: JobOptions): StepBuilder<TInput, TOutput>
  /** Internal definition. Do not mutate. */
  readonly definition: StepDefinition
}

/**
 * Create a step builder. Name must be unique within a workflow.
 *
 * ```ts
 * step<MyInput, MyOutput>("reserve-inventory")
 *   .run(async (input, ctx) => {  ... })
 *   .compensate(async (output, ctx) => {  ... })
 * ```
 */
export function step<TInput = unknown, TOutput = unknown>(
  name: string,
): StepBuilder<TInput, TOutput> {
  const def: StepDefinition = {
    name,
    isAsync: false,
  }
  const builder: StepBuilder<TInput, TOutput> = {
    run(fn) {
      def.runFn = fn as StepRunFn
      return builder
    },
    compensate(fn) {
      def.compensateFn = fn as StepCompensateFn
      return builder
    },
    async(options) {
      def.isAsync = true
      if (options !== undefined) def.jobOptions = options
      return builder
    },
    definition: def,
  }
  return builder
}

/**
 * Options passed to {@link WorkflowDefinition.run}.
 */
export interface WorkflowRunOptions {
  /** Initial input passed to every step's run function. */
  input?: unknown
  /** JobRunner — required when the workflow contains async steps. */
  jobRunner?: JobRunner
}

/**
 * Result of a successful workflow execution.
 */
export interface WorkflowResult {
  /** Step outputs keyed by step name. Async steps produce `{ jobId }`. */
  results: Record<string, unknown>
}

/**
 * Workflow handle returned by {@link createWorkflow}.
 */
export interface WorkflowDefinition {
  /** Workflow name. */
  readonly name: string
  /** Ordered list of step builders. */
  readonly steps: ReadonlyArray<StepBuilder>
  /** Execute the workflow. Throws on failure (after running compensations). */
  run(options?: WorkflowRunOptions): Promise<WorkflowResult>
}

/**
 * Thrown when a workflow is misconfigured (e.g. missing run function,
 * async step without a JobRunner, duplicate step names).
 */
export class WorkflowError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "WorkflowError"
  }
}

/**
 * Create an in-process workflow from a sequence of steps.
 *
 * Semantics:
 * - Steps run sequentially in array order.
 * - Each step's output is stored in `ctx.results[stepName]`.
 * - If any step's run function throws, previously-completed steps'
 *   compensation functions run in reverse order, then the error re-throws.
 * - Compensation errors are caught and logged; they do not mask the
 *   original failure.
 * - Async steps (`.async()`) enqueue via the injected `JobRunner` using
 *   the step name as the job name and the workflow input as the payload.
 *   They do not block and do not participate in compensation.
 *
 * This is NOT a durable workflow engine — execution lives entirely within
 * a single process. Durability for async work is delegated to the
 * template's `JobRunner` implementation.
 */
export function createWorkflow(
  name: string,
  steps: ReadonlyArray<StepBuilder>,
): WorkflowDefinition {
  const seen = new Set<string>()
  for (const builder of steps) {
    const stepName = builder.definition.name
    if (seen.has(stepName)) {
      throw new WorkflowError(`Workflow "${name}" has duplicate step name "${stepName}"`)
    }
    seen.add(stepName)
  }

  async function run(options: WorkflowRunOptions = {}): Promise<WorkflowResult> {
    const ctx: WorkflowContext = {
      workflowName: name,
      jobRunner: options.jobRunner,
      results: {},
    }
    const input = options.input
    const completed: Array<{ def: StepDefinition; output: unknown }> = []

    try {
      for (const builder of steps) {
        const def = builder.definition
        if (def.isAsync) {
          if (!ctx.jobRunner) {
            throw new WorkflowError(
              `Workflow "${name}" step "${def.name}" is async but no jobRunner was provided`,
            )
          }
          const jobId = await ctx.jobRunner.enqueue(def.name, input, def.jobOptions)
          const output = { jobId }
          ctx.results[def.name] = output
          continue
        }
        if (!def.runFn) {
          throw new WorkflowError(`Workflow "${name}" step "${def.name}" has no run function`)
        }
        const output = await def.runFn(input, ctx)
        ctx.results[def.name] = output
        completed.push({ def, output })
      }
      return { results: ctx.results }
    } catch (err) {
      for (let i = completed.length - 1; i >= 0; i--) {
        const entry = completed[i]
        if (!entry?.def.compensateFn) continue
        try {
          await entry.def.compensateFn(entry.output, ctx)
        } catch (compensationErr) {
          // biome-ignore lint/suspicious/noConsole: runtime diagnostics
          console.error(
            `[workflow:${name}] compensation for step "${entry.def.name}" threw:`,
            compensationErr,
          )
        }
      }
      throw err
    }
  }

  return {
    name,
    steps,
    run,
  }
}
