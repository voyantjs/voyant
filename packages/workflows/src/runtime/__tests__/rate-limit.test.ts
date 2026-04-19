import { beforeEach, describe, expect, it } from "vitest"
import type { RateLimiter } from "../../rate-limit/index.js"
import { runWorkflowForTest } from "../../testing/index.js"
import { __resetRegistry, getWorkflow, workflow } from "../../workflow.js"
import { executeWorkflowStep } from "../executor.js"
import { emptyJournal } from "../journal.js"

beforeEach(() => {
  __resetRegistry()
})

describe("step rateLimit", () => {
  it("fails the step with RATE_LIMITER_MISSING when no limiter is wired", async () => {
    const wf = workflow<void, string>({
      id: "rl.missing",
      async run(_, ctx) {
        return await ctx.step(
          "charge",
          {
            rateLimit: { key: "billing", limit: 1, window: "1s", onLimit: "fail" },
          },
          () => "ok",
        )
      },
    })

    const result = await runWorkflowForTest(wf, undefined)
    expect(result.status).toBe("failed")
    expect(result.error?.message).toMatch(/rateLimit.*rateLimiter wired/)
  })

  it("acquires with resolved key/limit/units and lets the step run", async () => {
    const _wf = workflow<{ tenant: string }, number>({
      id: "rl.dynamic",
      async run(_input, ctx) {
        return await ctx.step(
          "charge",
          {
            rateLimit: {
              key: (inp) => `tenant:${(inp as { tenant: string }).tenant}`,
              limit: 5,
              units: (inp) => ((inp as { tenant: string }).tenant === "big" ? 2 : 1),
              window: "1s",
              onLimit: "fail",
            },
          },
          () => 42,
        )
      },
    })

    const calls: Array<{ key: string; limit: number; units: number; windowMs: number }> = []
    const limiter: RateLimiter = {
      async acquire(a) {
        calls.push({ key: a.key, limit: a.limit, units: a.units, windowMs: a.windowMs })
      },
    }

    const def = getWorkflow("rl.dynamic")!
    const response = await executeWorkflowStep(def, {
      runId: "run_test",
      workflowId: "rl.dynamic",
      workflowVersion: "test",
      input: { tenant: "big" },
      journal: emptyJournal(),
      invocationCount: 1,
      environment: {
        run: {
          id: "run_test",
          number: 1,
          attempt: 1,
          triggeredBy: { kind: "api" },
          tags: [],
          startedAt: 0,
        },
        workflow: { id: "rl.dynamic", version: "test" },
        environment: { name: "development" },
        project: { id: "prj_xyz", slug: "xyz" },
        organization: { id: "org_1", slug: "one" },
      },
      triggeredBy: { kind: "api" },
      runStartedAt: 0,
      tags: [],
      stepRunner: async ({ stepId: _stepId, attempt, fn, stepCtx }) => {
        const out = await fn(stepCtx)
        return { attempt, status: "ok", output: out, startedAt: 0, finishedAt: 0 }
      },
      rateLimiter: limiter,
    })

    expect(response.status).toBe("completed")
    expect(calls).toEqual([{ key: "tenant:big", limit: 5, units: 2, windowMs: 1000 }])
  })

  it("surfaces RATE_LIMITED as a step failure when the limiter throws", async () => {
    const _wf = workflow<void, string>({
      id: "rl.fail",
      async run(_, ctx) {
        return await ctx.step(
          "charge",
          {
            rateLimit: { key: "k", limit: 1, window: "1s", onLimit: "fail" },
            retry: { max: 0 },
          },
          () => "ok",
        )
      },
    })

    const limiter: RateLimiter = {
      async acquire() {
        const e = new Error("rate limit exceeded")
        ;(e as Error & { code?: string }).code = "RATE_LIMITED"
        throw e
      },
    }

    const def = getWorkflow("rl.fail")!
    const response = await executeWorkflowStep(def, {
      runId: "run_test",
      workflowId: "rl.fail",
      workflowVersion: "test",
      input: undefined,
      journal: emptyJournal(),
      invocationCount: 1,
      environment: {
        run: {
          id: "run_test",
          number: 1,
          attempt: 1,
          triggeredBy: { kind: "api" },
          tags: [],
          startedAt: 0,
        },
        workflow: { id: "rl.fail", version: "test" },
        environment: { name: "development" },
        project: { id: "prj", slug: "p" },
        organization: { id: "org", slug: "o" },
      },
      triggeredBy: { kind: "api" },
      runStartedAt: 0,
      tags: [],
      stepRunner: async ({ stepId: _stepId, attempt, fn, stepCtx }) => {
        const out = await fn(stepCtx)
        return { attempt, status: "ok", output: out, startedAt: 0, finishedAt: 0 }
      },
      rateLimiter: limiter,
    })

    expect(response.status).toBe("failed")
    if (response.status === "failed") {
      expect(response.error.code).toBe("RATE_LIMITED")
    }
  })
})
