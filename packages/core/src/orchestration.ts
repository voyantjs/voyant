/**
 * Options for enqueueing a background job.
 */
export interface JobOptions {
  /** Delay before the job becomes runnable (milliseconds). */
  delayMs?: number
  /** Number of retry attempts on failure. */
  maxAttempts?: number
  /** Optional idempotency key for dedupe. */
  idempotencyKey?: string
  /** Runner-specific options passed through opaquely. */
  runnerOptions?: Record<string, unknown>
}

/**
 * Abstract durable job runner interface. Implementations live in templates
 * or adapter packages; core never reaches for a specific runtime.
 *
 * Voyant uses Hatchet (`@hatchet-dev/typescript-sdk`) as the durable job
 * engine. This interface remains for the in-process `createWorkflow` async
 * step delegation — a Hatchet adapter can bridge enqueue/schedule calls to
 * the Hatchet API.
 *
 * Templates wire their chosen adapter into the container as `"jobs"`.
 * Framework code that needs to kick off async work does so via
 * `container.resolve<JobRunner>("jobs").enqueue(...)`.
 */
export interface JobRunner {
  /** Enqueue a job for durable execution. Returns a runner-assigned job id. */
  enqueue(jobName: string, payload: unknown, options?: JobOptions): Promise<string>

  /** Schedule a recurring job by cron expression. */
  schedule(jobName: string, cron: string, payload: unknown): Promise<void>
}
