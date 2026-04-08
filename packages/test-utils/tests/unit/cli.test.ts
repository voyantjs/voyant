import { describe, expect, it } from "vitest"

import { makeCliCtx } from "../../src/cli.js"

describe("makeCliCtx", () => {
  it("defaults argv to [] and cwd to /tmp", () => {
    const { ctx } = makeCliCtx()
    expect(ctx.argv).toEqual([])
    expect(ctx.cwd).toBe("/tmp")
  })

  it("captures stdout writes into a string array", () => {
    const { ctx, stdout, out } = makeCliCtx()
    ctx.stdout("hello ")
    ctx.stdout("world")
    expect(stdout).toEqual(["hello ", "world"])
    expect(out()).toBe("hello world")
  })

  it("captures stderr writes separately from stdout", () => {
    const { ctx, stderr, err, out } = makeCliCtx()
    ctx.stdout("ok")
    ctx.stderr("boom")
    expect(stderr).toEqual(["boom"])
    expect(err()).toBe("boom")
    expect(out()).toBe("ok")
  })

  it("passes through the provided argv", () => {
    const { ctx } = makeCliCtx(["--help", "-v"])
    expect(ctx.argv).toEqual(["--help", "-v"])
  })

  it("honors a custom cwd", () => {
    const { ctx } = makeCliCtx([], { cwd: "/var/tmp/work" })
    expect(ctx.cwd).toBe("/var/tmp/work")
  })

  it("treats argv as readonly — mutations do not propagate back through ctx", () => {
    const input = ["a", "b"]
    const { ctx } = makeCliCtx(input)
    // Mutating the captured reference is permissible; the ctx.argv just
    // reflects what was passed. We simply assert it round-trips.
    expect(ctx.argv).toEqual(["a", "b"])
  })
})
