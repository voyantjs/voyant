import { describe, expect, it, vi } from "vitest"

import { timeOperation } from "../../src/utils.js"

describe("timeOperation", () => {
  it("returns the resolved value", async () => {
    const result = await timeOperation("test", Promise.resolve("ok"))
    expect(result).toBe("ok")
  })

  it("re-throws on failure", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    await expect(timeOperation("test", Promise.reject(new Error("boom")))).rejects.toThrow("boom")
    spy.mockRestore()
  })

  it("does not warn for fast operations", async () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {})
    await timeOperation("fast", Promise.resolve("ok"))
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  it("warns when operation exceeds threshold", async () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {})
    const slow = new Promise<string>((r) => setTimeout(() => r("ok"), 50))
    await timeOperation("slow-op", slow, 10)
    expect(spy).toHaveBeenCalledOnce()
    expect(spy.mock.calls[0]![0]).toMatch(/slow operation.*slow-op/)
    spy.mockRestore()
  })

  it("logs error with label on failure", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    try {
      await timeOperation("failing-op", Promise.reject(new Error("db down")))
    } catch {
      // expected
    }
    expect(spy).toHaveBeenCalledOnce()
    expect(spy.mock.calls[0]![0]).toMatch(/failed operation.*failing-op/)
    spy.mockRestore()
  })
})
