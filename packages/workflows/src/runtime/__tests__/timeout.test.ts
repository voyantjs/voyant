import { beforeEach, describe, expect, it } from "vitest"
import { runWorkflowForTest } from "../../testing/index.js"
import { __resetRegistry, workflow } from "../../workflow.js"

beforeEach(() => {
  __resetRegistry()
})

describe("step-level timeouts", () => {
  it("enforces a hard timeout on an async-uncooperative step (never resolves)", async () => {
    const wf = workflow<void, unknown>({
      id: "timeout.hard",
      async run(_i, ctx) {
        return await ctx.step(
          "never",
          { timeout: "50ms" },
          async () =>
            await new Promise(() => {
              /* never resolves */
            }),
        )
      },
    })
    const result = await runWorkflowForTest(wf, undefined)
    expect(result.status).toBe("failed")
    expect(result.error?.message).toMatch(/timed out after 50ms/)
    expect(result.error?.code).toBe("TIMEOUT")
  })

  it("surfaces timeout via stepCtx.signal for cooperative bodies (returns early)", async () => {
    let wasAborted = false
    const wf = workflow<void, unknown>({
      id: "timeout.coop",
      async run(_i, ctx) {
        return await ctx.step("cooperative", { timeout: "50ms" }, async (stepCtx) => {
          await new Promise<void>((resolve, reject) => {
            const t = setTimeout(resolve, 10_000)
            stepCtx.signal.addEventListener("abort", () => {
              clearTimeout(t)
              wasAborted = true
              reject(new Error("observed signal.abort"))
            })
          })
        })
      },
    })
    const result = await runWorkflowForTest(wf, undefined)
    expect(result.status).toBe("failed")
    expect(wasAborted).toBe(true)
  })

  it("does not fire when the step completes within the timeout window", async () => {
    const wf = workflow<void, number>({
      id: "timeout.fast",
      async run(_i, ctx) {
        return await ctx.step("quick", { timeout: "1s" }, async () => 42)
      },
    })
    const result = await runWorkflowForTest(wf, undefined)
    expect(result.status).toBe("completed")
    expect(result.output).toBe(42)
  })

  it("retries respect timeout per-attempt (not cumulative)", async () => {
    let attempts = 0
    const wf = workflow<void, number>({
      id: "timeout.retry",
      async run(_i, ctx) {
        return await ctx.step(
          "flaky-slow",
          { timeout: "50ms", retry: { max: 3, backoff: "fixed", initial: 1 } },
          async () => {
            attempts += 1
            if (attempts < 3) {
              // Timeout on first two attempts (async uncooperative).
              await new Promise(() => {})
            }
            return attempts
          },
        )
      },
    })
    const result = await runWorkflowForTest(wf, undefined)
    expect(result.status).toBe("completed")
    expect(result.output).toBe(3)
    expect(attempts).toBe(3)
  })

  it("does not timeout when no `timeout` option is set, even for slow steps", async () => {
    const wf = workflow<void, "done">({
      id: "no-timeout",
      async run(_i, ctx) {
        return await ctx.step("slow-no-limit", async () => {
          await new Promise((r) => setTimeout(r, 30))
          return "done"
        })
      },
    })
    const result = await runWorkflowForTest(wf, undefined)
    expect(result.status).toBe("completed")
    expect(result.output).toBe("done")
  })
})
