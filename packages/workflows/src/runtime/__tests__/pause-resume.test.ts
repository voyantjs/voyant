import { beforeEach, describe, expect, it } from "vitest"
import { resumeWorkflowForTest, runWorkflowForTest } from "../../testing/index.js"
import { __resetRegistry, workflow } from "../../workflow.js"

beforeEach(() => {
  __resetRegistry()
})

describe("runWorkflowForTest with pauseOnWait", () => {
  it("parks on a missing event fixture instead of throwing", async () => {
    const wf = workflow<void, unknown>({
      id: "pause.event",
      async run(_, ctx) {
        const evt = await ctx.waitForEvent<{ n: number }>("ping")
        return evt
      },
    })

    const result = await runWorkflowForTest(wf, undefined, { pauseOnWait: true })
    expect(result.status).toBe("waiting")
    expect(result.pause).toBeDefined()
    expect(result.pause!.pendingWaitpoints).toHaveLength(1)
    expect(result.pause!.pendingWaitpoints[0]!.kind).toBe("EVENT")
    expect(result.pause!.pendingWaitpoints[0]!.meta.eventType).toBe("ping")
  })

  it("parks on a missing signal fixture", async () => {
    const wf = workflow<void, unknown>({
      id: "pause.signal",
      async run(_, ctx) {
        return await ctx.waitForSignal<{ ok: boolean }>("approve")
      },
    })
    const result = await runWorkflowForTest(wf, undefined, { pauseOnWait: true })
    expect(result.status).toBe("waiting")
    expect(result.pause!.pendingWaitpoints[0]!.kind).toBe("SIGNAL")
    expect(result.pause!.pendingWaitpoints[0]!.meta.signalName).toBe("approve")
  })

  it("parks on a missing token fixture", async () => {
    const wf = workflow<void, unknown>({
      id: "pause.token",
      async run(_, ctx) {
        const t = await ctx.waitForToken<string>({ tokenId: "approval-1" })
        return await t.wait()
      },
    })
    const result = await runWorkflowForTest(wf, undefined, { pauseOnWait: true })
    expect(result.status).toBe("waiting")
    expect(result.pause!.pendingWaitpoints[0]!.kind).toBe("MANUAL")
    expect(result.pause!.pendingWaitpoints[0]!.meta.tokenId).toBe("approval-1")
  })

  it("continues through a waitpoint that does have a fixture", async () => {
    const wf = workflow<void, { first: unknown; second: unknown }>({
      id: "pause.mixed",
      async run(_, ctx) {
        const first = await ctx.waitForEvent<{ a: number }>("have-fixture")
        const second = await ctx.waitForEvent<{ b: number }>("no-fixture")
        return { first, second }
      },
    })
    const result = await runWorkflowForTest(wf, undefined, {
      pauseOnWait: true,
      waitForEvent: { "have-fixture": { a: 1 } },
    })
    expect(result.status).toBe("waiting")
    expect(result.pause!.pendingWaitpoints).toHaveLength(1)
    expect(result.pause!.pendingWaitpoints[0]!.meta.eventType).toBe("no-fixture")
  })

  it("throws as before when pauseOnWait is not set", async () => {
    const wf = workflow<void, unknown>({
      id: "pause.nofallback",
      async run(_, ctx) {
        return await ctx.waitForEvent("will-never-arrive")
      },
    })
    await expect(runWorkflowForTest(wf, undefined)).rejects.toThrow(/no fixture resolution/i)
  })
})

describe("resumeWorkflowForTest", () => {
  it("resumes a parked run when a matching event is injected", async () => {
    const wf = workflow<void, { name: string; greeting: string }>({
      id: "resume.event",
      async run(_, ctx) {
        const evt = await ctx.waitForEvent<{ name: string }>("greet")
        return { name: evt!.name, greeting: `hello ${evt!.name}` }
      },
    })

    const parked = await runWorkflowForTest(wf, undefined, { pauseOnWait: true })
    expect(parked.status).toBe("waiting")

    const resumed = await resumeWorkflowForTest(wf, undefined, {
      pause: parked.pause!,
      injection: { kind: "EVENT", eventType: "greet", payload: { name: "ada" } },
    })

    expect(resumed.status).toBe("completed")
    expect(resumed.output).toEqual({ name: "ada", greeting: "hello ada" })
  })

  it("resumes on a signal injection", async () => {
    const wf = workflow<void, { approved: boolean }>({
      id: "resume.signal",
      async run(_, ctx) {
        const payload = await ctx.waitForSignal<{ approved: boolean }>("approve")
        return payload!
      },
    })
    const parked = await runWorkflowForTest(wf, undefined, { pauseOnWait: true })
    const resumed = await resumeWorkflowForTest(wf, undefined, {
      pause: parked.pause!,
      injection: { kind: "SIGNAL", name: "approve", payload: { approved: true } },
    })
    expect(resumed.status).toBe("completed")
    expect(resumed.output).toEqual({ approved: true })
  })

  it("resumes on a token injection", async () => {
    const wf = workflow<void, string>({
      id: "resume.token",
      async run(_, ctx) {
        const t = await ctx.waitForToken<string>({ tokenId: "approval-99" })
        const p = await t.wait()
        return p ?? "no"
      },
    })
    const parked = await runWorkflowForTest(wf, undefined, { pauseOnWait: true })
    const resumed = await resumeWorkflowForTest(wf, undefined, {
      pause: parked.pause!,
      injection: { kind: "MANUAL", tokenId: "approval-99", payload: "yes" },
    })
    expect(resumed.status).toBe("completed")
    expect(resumed.output).toBe("yes")
  })

  it("parks again when the resumed body hits a new waitpoint", async () => {
    const wf = workflow<void, unknown>({
      id: "resume.chain",
      async run(_, ctx) {
        const first = await ctx.waitForEvent<{ a: number }>("first")
        const second = await ctx.waitForEvent<{ b: number }>("second")
        return { first, second }
      },
    })

    const parked = await runWorkflowForTest(wf, undefined, { pauseOnWait: true })
    expect(parked.status).toBe("waiting")
    expect(parked.pause!.pendingWaitpoints[0]!.meta.eventType).toBe("first")

    const parked2 = await resumeWorkflowForTest(wf, undefined, {
      pauseOnWait: true,
      pause: parked.pause!,
      injection: { kind: "EVENT", eventType: "first", payload: { a: 1 } },
    })
    expect(parked2.status).toBe("waiting")
    expect(parked2.pause!.pendingWaitpoints[0]!.meta.eventType).toBe("second")

    const done = await resumeWorkflowForTest(wf, undefined, {
      pause: parked2.pause!,
      injection: { kind: "EVENT", eventType: "second", payload: { b: 2 } },
    })
    expect(done.status).toBe("completed")
    expect(done.output).toEqual({ first: { a: 1 }, second: { b: 2 } })
  })

  it("throws when the injection does not match any pending waitpoint", async () => {
    const wf = workflow<void, unknown>({
      id: "resume.mismatch",
      async run(_, ctx) {
        return await ctx.waitForEvent("expected")
      },
    })
    const parked = await runWorkflowForTest(wf, undefined, { pauseOnWait: true })
    await expect(
      resumeWorkflowForTest(wf, undefined, {
        pause: parked.pause!,
        injection: { kind: "EVENT", eventType: "unexpected" },
      }),
    ).rejects.toThrow(/no pending waitpoint matches/i)
  })
})
