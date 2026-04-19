import { beforeEach, describe, expect, it } from "vitest"
import { runWorkflowForTest } from "../../testing/index.js"
import { __resetRegistry, workflow } from "../../workflow.js"

beforeEach(() => {
  __resetRegistry()
})

describe("ctx.stream.text", () => {
  it("collects string chunks in order and emits a final marker", async () => {
    const wf = workflow<void, void>({
      id: "stream.text",
      async run(_, ctx) {
        await ctx.stream.text(
          "contract-text",
          (async function* () {
            yield "Once "
            yield "upon "
            yield "a time."
          })(),
        )
      },
    })

    const result = await runWorkflowForTest(wf, undefined)

    expect(result.status).toBe("completed")
    const chunks = result.streams["contract-text"]
    expect(chunks).toBeDefined()
    expect(chunks!).toHaveLength(4) // 3 content + 1 final
    expect(chunks!.slice(0, 3).map((c) => c.chunk)).toEqual(["Once ", "upon ", "a time."])
    expect(chunks!.slice(0, 3).every((c) => c.encoding === "text")).toBe(true)
    expect(chunks![3]!.final).toBe(true)
    expect(chunks![3]!.chunk).toBeNull()
    // Sequence numbers are monotonic per stream.
    expect(chunks!.map((c) => c.seq)).toEqual([1, 2, 3, 4])
  })
})

describe("ctx.stream.json", () => {
  it("passes JSON-serializable values through unchanged", async () => {
    const wf = workflow<void, void>({
      id: "stream.json",
      async run(_, ctx) {
        await ctx.stream.json(
          "progress",
          (async function* () {
            yield { pct: 0, phase: "start" }
            yield { pct: 50, phase: "midway" }
            yield { pct: 100, phase: "done" }
          })(),
        )
      },
    })

    const result = await runWorkflowForTest(wf, undefined)

    expect(result.status).toBe("completed")
    const chunks = result.streams.progress!
    expect(chunks.filter((c) => !c.final).map((c) => c.chunk)).toEqual([
      { pct: 0, phase: "start" },
      { pct: 50, phase: "midway" },
      { pct: 100, phase: "done" },
    ])
    expect(chunks.every((c) => c.encoding === "json")).toBe(true)
  })
})

describe("ctx.stream.bytes", () => {
  it("base64-encodes Uint8Array chunks", async () => {
    const wf = workflow<void, void>({
      id: "stream.bytes",
      async run(_, ctx) {
        await ctx.stream.bytes(
          "audio",
          (async function* () {
            yield new Uint8Array([72, 105]) // "Hi"
            yield new Uint8Array([33]) // "!"
          })(),
        )
      },
    })

    const result = await runWorkflowForTest(wf, undefined)

    expect(result.status).toBe("completed")
    const chunks = result.streams.audio!
    const contentChunks = chunks.filter((c) => !c.final)
    expect(contentChunks.map((c) => c.chunk)).toEqual(["SGk=", "IQ=="])
    expect(contentChunks.every((c) => c.encoding === "base64")).toBe(true)
  })

  it("rejects non-Uint8Array chunks with a clear error", async () => {
    const wf = workflow<void, void>({
      id: "stream.bytes-bad",
      async run(_, ctx) {
        await ctx.stream.bytes(
          "wrong",
          (async function* () {
            // @ts-expect-error — intentional bad input to test validation.
            yield "this is a string"
          })(),
        )
      },
    })

    const result = await runWorkflowForTest(wf, undefined)

    expect(result.status).toBe("failed")
    expect(result.error?.message).toMatch(/expected Uint8Array/i)
  })
})

describe("multiple independent streams in one run", () => {
  it("tracks each stream under its own streamId", async () => {
    const wf = workflow<void, void>({
      id: "stream.multi",
      async run(_, ctx) {
        await ctx.stream.text(
          "a",
          (async function* () {
            yield "alpha"
          })(),
        )
        await ctx.stream.text(
          "b",
          (async function* () {
            yield "beta"
            yield "gamma"
          })(),
        )
      },
    })

    const result = await runWorkflowForTest(wf, undefined)

    expect(result.status).toBe("completed")
    expect(Object.keys(result.streams).sort()).toEqual(["a", "b"])
    expect(result.streams.a!.filter((c) => !c.final).map((c) => c.chunk)).toEqual(["alpha"])
    expect(result.streams.b!.filter((c) => !c.final).map((c) => c.chunk)).toEqual(["beta", "gamma"])
  })

  it("throws on duplicate stream ids within the same run", async () => {
    const wf = workflow<void, void>({
      id: "stream.duplicate",
      async run(_, ctx) {
        await ctx.stream.text(
          "twin",
          (async function* () {
            yield "first"
          })(),
        )
        await ctx.stream.text(
          "twin",
          (async function* () {
            yield "second"
          })(),
        )
      },
    })

    const result = await runWorkflowForTest(wf, undefined)

    expect(result.status).toBe("failed")
    expect(result.error?.message).toMatch(/duplicate streamId/i)
  })
})

describe("generic ctx.stream (function form)", () => {
  it("defaults to json encoding for arbitrary yielded values", async () => {
    const wf = workflow<void, void>({
      id: "stream.generic",
      async run(_, ctx) {
        await ctx.stream("events", async function* () {
          yield { kind: "hello", id: 1 }
          yield { kind: "world", id: 2 }
        })
      },
    })

    const result = await runWorkflowForTest(wf, undefined)

    expect(result.status).toBe("completed")
    const chunks = result.streams.events!
    expect(chunks.filter((c) => !c.final).map((c) => c.chunk)).toEqual([
      { kind: "hello", id: 1 },
      { kind: "world", id: 2 },
    ])
    expect(chunks.every((c) => c.encoding === "json")).toBe(true)
  })
})
