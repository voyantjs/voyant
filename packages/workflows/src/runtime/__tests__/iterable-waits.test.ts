import { beforeEach, describe, expect, it } from "vitest"
import { runWorkflowForTest } from "../../testing/index.js"
import { __resetRegistry, workflow } from "../../workflow.js"

beforeEach(() => {
  __resetRegistry()
})

describe("iterable ctx.waitForEvent", () => {
  it("consumes the fixture array one iteration at a time", async () => {
    const wf = workflow<void, string[]>({
      id: "iter-event.basic",
      async run(_, ctx) {
        const collected: string[] = []
        for await (const payload of ctx.waitForEvent<{ text: string }>("chat.message")) {
          collected.push(payload.text)
        }
        return collected
      },
    })

    const result = await runWorkflowForTest(wf, undefined, {
      waitForEvent: {
        "chat.message": [{ text: "hello" }, { text: "world" }, { text: "!" }],
      },
    })

    expect(result.status).toBe("completed")
    expect(result.output).toEqual(["hello", "world", "!"])
    // Each iteration = one yield cycle: invocation #1 yields, harness
    // resolves, invocation #2 replays + yields next, etc. 3 payloads +
    // stream-end marker = 4 cycles = 5 invocations total.
    expect(result.invocations).toBe(5)
  })

  it("terminates cleanly when the consumer breaks out of the loop", async () => {
    const wf = workflow<void, number[]>({
      id: "iter-event.break",
      async run(_, ctx) {
        const collected: number[] = []
        for await (const payload of ctx.waitForEvent<{ n: number }>("count")) {
          collected.push(payload.n)
          if (payload.n >= 2) break
        }
        return collected
      },
    })

    const result = await runWorkflowForTest(wf, undefined, {
      waitForEvent: {
        count: [{ n: 1 }, { n: 2 }, { n: 3 }, { n: 4 }],
      },
    })

    expect(result.status).toBe("completed")
    // Body broke after n=2, so n=3 and n=4 never consumed.
    expect(result.output).toEqual([1, 2])
  })

  it("ends immediately when the fixture array is empty", async () => {
    const wf = workflow<void, number>({
      id: "iter-event.empty",
      async run(_, ctx) {
        let count = 0
        for await (const _p of ctx.waitForEvent("never")) {
          count += 1
        }
        return count
      },
    })

    const result = await runWorkflowForTest(wf, undefined, {
      waitForEvent: { never: [] },
    })

    expect(result.status).toBe("completed")
    expect(result.output).toBe(0)
  })

  it("allows mixing iterable and thenable forms in the same workflow", async () => {
    const wf = workflow<void, { first: string; rest: string[] }>({
      id: "iter-event.mixed",
      async run(_, ctx) {
        const first = (await ctx.waitForEvent<{ text: string }>("ping"))!.text
        const rest: string[] = []
        for await (const p of ctx.waitForEvent<{ text: string }>("chat")) {
          rest.push(p.text)
        }
        return { first, rest }
      },
    })

    const result = await runWorkflowForTest(wf, undefined, {
      waitForEvent: {
        ping: { text: "pong" },
        chat: [{ text: "a" }, { text: "b" }],
      },
    })

    expect(result.status).toBe("completed")
    expect(result.output).toEqual({ first: "pong", rest: ["a", "b"] })
  })
})

describe("iterable ctx.waitForSignal", () => {
  it("consumes sequential signal payloads", async () => {
    const wf = workflow<void, string[]>({
      id: "iter-signal.basic",
      async run(_, ctx) {
        const collected: string[] = []
        for await (const payload of ctx.waitForSignal<{ v: string }>("tick")) {
          collected.push(payload.v)
        }
        return collected
      },
    })

    const result = await runWorkflowForTest(wf, undefined, {
      waitForSignal: {
        // fixtures passed as plain value are treated as single-shot for
        // thenable but as a one-element stream for iterable.
        tick: [{ v: "a" }, { v: "b" }, { v: "c" }],
      },
    })

    expect(result.status).toBe("completed")
    expect(result.output).toEqual(["a", "b", "c"])
  })
})
