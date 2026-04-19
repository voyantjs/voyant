import { beforeEach, describe, expect, it } from "vitest"
import { runWorkflowForTest } from "../../testing/index.js"
import { __resetRegistry, workflow } from "../../workflow.js"

beforeEach(() => {
  __resetRegistry()
})

describe("ctx.parallel", () => {
  it("returns results in input order", async () => {
    const wf = workflow<void, number[]>({
      id: "parallel.order",
      async run(_, ctx) {
        return ctx.parallel([10, 20, 30, 40], async (n, _i) => n * 2)
      },
    })

    const result = await runWorkflowForTest(wf, undefined)

    expect(result.status).toBe("completed")
    expect(result.output).toEqual([20, 40, 60, 80])
  })

  it("bounds concurrent in-flight iterations to `concurrency`", async () => {
    let inFlight = 0
    let maxInFlight = 0

    const wf = workflow<void, void>({
      id: "parallel.concurrency",
      async run(_, ctx) {
        await ctx.parallel(
          Array.from({ length: 10 }, (_, i) => i),
          async () => {
            inFlight += 1
            maxInFlight = Math.max(maxInFlight, inFlight)
            await new Promise((resolve) => setTimeout(resolve, 5))
            inFlight -= 1
          },
          { concurrency: 3 },
        )
      },
    })

    const result = await runWorkflowForTest(wf, undefined)

    expect(result.status).toBe("completed")
    expect(maxInFlight).toBeLessThanOrEqual(3)
    // Should have actually run some in parallel (not purely serial).
    expect(maxInFlight).toBeGreaterThanOrEqual(2)
  })

  it("short-circuits on first error when settle is false (default)", async () => {
    let ranAfterFailure = 0

    const wf = workflow<void, void>({
      id: "parallel.short-circuit",
      async run(_, ctx) {
        try {
          await ctx.parallel(
            [1, 2, 3, 4, 5],
            async (n) => {
              if (n === 2) throw new Error(`item ${n} failed`)
              await new Promise((r) => setTimeout(r, 5))
              ranAfterFailure += 1
            },
            { concurrency: 1 },
          )
        } catch (e) {
          // With concurrency 1 serialization is strict: items 1 and 2
          // ran, 3/4/5 were skipped after the failure.
          expect((e as Error).message).toBe("item 2 failed")
        }
      },
    })

    const result = await runWorkflowForTest(wf, undefined)

    expect(result.status).toBe("completed")
    expect(ranAfterFailure).toBe(1) // only item 1 ran before item 2 failed
  })

  it("collects all results when settle is true and throws AggregateError if any failed", async () => {
    const wf = workflow<void, { aggregate: boolean; failedIndices?: number[] }>({
      id: "parallel.settle",
      async run(_, ctx) {
        try {
          await ctx.parallel(
            [1, 2, 3, 4],
            async (n) => {
              if (n % 2 === 0) throw new Error(`even: ${n}`)
              return n
            },
            { concurrency: 2, settle: true },
          )
          return { aggregate: false }
        } catch (e) {
          const ag = e as AggregateError & { failedIndices?: number[] }
          return { aggregate: ag instanceof AggregateError, failedIndices: ag.failedIndices }
        }
      },
    })

    const result = await runWorkflowForTest(wf, undefined)

    expect(result.status).toBe("completed")
    expect(result.output).toEqual({ aggregate: true, failedIndices: [1, 3] })
  })

  it("handles empty input by returning []", async () => {
    const wf = workflow<void, number[]>({
      id: "parallel.empty",
      async run(_, ctx) {
        return ctx.parallel<number, number>([], async () => 0)
      },
    })

    const result = await runWorkflowForTest(wf, undefined)

    expect(result.status).toBe("completed")
    expect(result.output).toEqual([])
  })

  it("defaults concurrency to total items (no artificial serialization)", async () => {
    const order: number[] = []

    const wf = workflow<void, number[]>({
      id: "parallel.unbounded",
      async run(_, ctx) {
        return ctx.parallel([0, 1, 2, 3, 4], async (n) => {
          // Return in reverse-completion order: longer items finish first
          // would imply real concurrency; with concurrency undefined we
          // let them all run together.
          await new Promise((r) => setTimeout(r, (5 - n) * 2))
          order.push(n)
          return n
        })
      },
    })

    const result = await runWorkflowForTest(wf, undefined)

    expect(result.status).toBe("completed")
    // Results are in input order regardless of completion order.
    expect(result.output).toEqual([0, 1, 2, 3, 4])
    // Completion order is reverse because later items sleep less.
    expect(order).toEqual([4, 3, 2, 1, 0])
  })
})
