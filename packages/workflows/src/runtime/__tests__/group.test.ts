import { beforeEach, describe, expect, it } from "vitest"
import { runWorkflowForTest } from "../../testing/index.js"
import { __resetRegistry, workflow } from "../../workflow.js"

beforeEach(() => {
  __resetRegistry()
})

describe("ctx.group — scoped compensation", () => {
  it("rolls back only the group's compensables when the group body throws", async () => {
    const compensated: string[] = []

    const wf = workflow<void, string>({
      id: "group.rollback-scope",
      async run(_, ctx) {
        await ctx.step(
          "outer-reserve",
          {
            compensate: async () => {
              compensated.push("outer-undo")
            },
          },
          async () => "outer",
        )
        try {
          await ctx.group("inner", async (scope) => {
            await scope.step(
              "inner-a",
              {
                compensate: async () => {
                  compensated.push("undo-inner-a")
                },
              },
              async () => "a",
            )
            await scope.step(
              "inner-b",
              {
                compensate: async () => {
                  compensated.push("undo-inner-b")
                },
              },
              async () => "b",
            )
            throw new Error("scope failed")
          })
        } catch (e) {
          return `caught: ${(e as Error).message}`
        }
        return "unreached"
      },
    })

    const result = await runWorkflowForTest(wf, undefined)

    expect(result.status).toBe("completed")
    expect(result.output).toBe("caught: scope failed")
    // Only the two inner compensations ran, in reverse order. The outer
    // step's compensation is NOT triggered — it's still in the outer list
    // and only fires if the enclosing body itself throws uncaught.
    expect(compensated).toEqual(["undo-inner-b", "undo-inner-a"])
  })

  it("explicit scope.compensate() rolls back the scope and propagates to outer", async () => {
    const compensated: string[] = []

    const wf = workflow<void, void>({
      id: "group.explicit",
      async run(_, ctx) {
        await ctx.step(
          "outer",
          {
            compensate: async () => {
              compensated.push("outer-undo")
            },
          },
          async () => "outer",
        )
        await ctx.group("txn", async (scope) => {
          await scope.step(
            "inner",
            {
              compensate: async () => {
                compensated.push("inner-undo")
              },
            },
            async () => "inner",
          )
          await scope.compensate()
        })
        // Unreachable — scope.compensate throws CompensateRequestedSignal.
      },
    })

    const result = await runWorkflowForTest(wf, undefined)

    // scope.compensate propagated the signal to the executor, which
    // then ran the outer compensation too.
    expect(result.status).toBe("compensated")
    expect(compensated).toEqual(["inner-undo", "outer-undo"])
  })

  it("preserves outer-list compensables when the scope completes successfully", async () => {
    const compensated: string[] = []

    const wf = workflow<void, void>({
      id: "group.success-then-outer-fails",
      async run(_, ctx) {
        await ctx.group("setup", async (scope) => {
          await scope.step(
            "reserve",
            {
              compensate: async () => {
                compensated.push("release-reservation")
              },
            },
            async () => "reserved",
          )
          // scope completes successfully; "reserve" compensation stays
          // in the outer list.
        })
        // Enclosing body now throws — "reserve" compensation should run.
        await ctx.step("charge", async () => {
          throw new Error("declined")
        })
      },
    })

    const result = await runWorkflowForTest(wf, undefined)

    expect(result.status).toBe("compensated")
    expect(compensated).toEqual(["release-reservation"])
    expect(result.error?.message).toBe("declined")
  })

  it("does not run scoped compensations when scope's fn returns normally", async () => {
    const compensated: string[] = []

    const wf = workflow<void, string>({
      id: "group.normal-return",
      async run(_, ctx) {
        const value = await ctx.group("compute", async (scope) => {
          const v = await scope.step(
            "get",
            {
              compensate: async () => {
                compensated.push("undo-get")
              },
            },
            async () => "answer",
          )
          return v
        })
        return value
      },
    })

    const result = await runWorkflowForTest(wf, undefined)

    expect(result.status).toBe("completed")
    expect(result.output).toBe("answer")
    expect(compensated).toEqual([])
  })

  it("scoped rollback honors LIFO order within the group only", async () => {
    const compensated: string[] = []

    const wf = workflow<void, string>({
      id: "group.lifo-scope",
      async run(_, ctx) {
        try {
          await ctx.group("txn", async (scope) => {
            await scope.step(
              "a",
              {
                compensate: async () => {
                  compensated.push("a")
                },
              },
              async () => "A",
            )
            await scope.step(
              "b",
              {
                compensate: async () => {
                  compensated.push("b")
                },
              },
              async () => "B",
            )
            await scope.step(
              "c",
              {
                compensate: async () => {
                  compensated.push("c")
                },
              },
              async () => "C",
            )
            throw new Error("bail")
          })
        } catch (e) {
          return (e as Error).message
        }
        return "unreached"
      },
    })

    const result = await runWorkflowForTest(wf, undefined)

    expect(result.status).toBe("completed")
    expect(result.output).toBe("bail")
    expect(compensated).toEqual(["c", "b", "a"])
  })
})
