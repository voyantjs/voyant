import { describe, expect, it, vi } from "vitest"

import { executeQuery, isDatabaseError, safeDbOperation } from "../../src/helpers.js"

describe("isDatabaseError", () => {
  it("returns true for Error instances", () => {
    expect(isDatabaseError(new Error("fail"))).toBe(true)
  })

  it("returns true for subclassed errors", () => {
    expect(isDatabaseError(new TypeError("type fail"))).toBe(true)
  })

  it("returns false for plain strings", () => {
    expect(isDatabaseError("something")).toBe(false)
  })

  it("returns false for null", () => {
    expect(isDatabaseError(null)).toBe(false)
  })

  it("returns false for undefined", () => {
    expect(isDatabaseError(undefined)).toBe(false)
  })

  it("returns false for plain objects", () => {
    expect(isDatabaseError({ message: "fail" })).toBe(false)
  })
})

describe("executeQuery", () => {
  it("returns the resolved value on success", async () => {
    const result = await executeQuery(Promise.resolve({ id: "1" }))
    expect(result).toEqual({ id: "1" })
  })

  it("re-throws the error on failure", async () => {
    const error = new Error("query failed")
    await expect(executeQuery(Promise.reject(error))).rejects.toThrow("query failed")
  })

  it("logs the error message on failure", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    try {
      await executeQuery(Promise.reject(new Error("db error")))
    } catch {
      // expected
    }
    expect(spy).toHaveBeenCalledWith("Database query error:", "db error")
    spy.mockRestore()
  })

  it("does not log for non-Error rejections", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    try {
      await executeQuery(Promise.reject("string error"))
    } catch {
      // expected
    }
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})

describe("safeDbOperation", () => {
  it("returns the result on success", async () => {
    const result = await safeDbOperation(() => Promise.resolve(42))
    expect(result).toBe(42)
  })

  it("returns null on failure by default", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    const result = await safeDbOperation(() => Promise.reject(new Error("fail")))
    expect(result).toBeNull()
    spy.mockRestore()
  })

  it("returns the fallback value on failure", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    const result = await safeDbOperation(() => Promise.reject(new Error("fail")), "fallback")
    expect(result).toBe("fallback")
    spy.mockRestore()
  })

  it("logs error messages for Error rejections", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    await safeDbOperation(() => Promise.reject(new Error("oops")))
    expect(spy).toHaveBeenCalledWith("Database operation error:", "oops")
    spy.mockRestore()
  })

  it("does not log for non-Error rejections", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    await safeDbOperation(() => Promise.reject("string"))
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
