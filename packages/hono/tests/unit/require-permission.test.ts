import { Hono } from "hono"
import { afterEach, describe, expect, it, vi } from "vitest"

import { handleApiError, requestId } from "../../src/middleware/error-boundary.js"
import { requirePermission } from "../../src/middleware/require-permission.js"

afterEach(() => {
  vi.restoreAllMocks()
})

describe("requirePermission", () => {
  it("returns a structured 401 when the request has no user id", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})

    const app = new Hono()
    app.onError(handleApiError)
    app.use("*", requestId)
    app.use(
      "*",
      requirePermission(() => ({}) as never, "crm", "write", {
        auth: {
          hasPermission: vi.fn().mockResolvedValue(true),
        },
      }),
    )
    app.get("/secure", (c) => c.json({ ok: true }))

    const response = await app.fetch(
      new Request("http://example.com/secure"),
      {},
      mockExecutionCtx(),
    )

    expect(response.status).toBe(401)
    expect(await response.json()).toMatchObject({
      error: "Unauthorized",
      code: "unauthorized",
    })
  })

  it("returns a structured 403 when the permission check fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})

    const hasPermission = vi.fn().mockResolvedValue(false)

    const app = new Hono()
    app.onError(handleApiError)
    app.use("*", requestId)
    app.use("*", async (c, next) => {
      c.set("userId", "user_123")
      await next()
    })
    app.use(
      "*",
      requirePermission(() => ({}) as never, "crm", "write", {
        auth: {
          hasPermission,
        },
      }),
    )
    app.get("/secure", (c) => c.json({ ok: true }))

    const response = await app.fetch(
      new Request("http://example.com/secure"),
      {},
      mockExecutionCtx(),
    )

    expect(response.status).toBe(403)
    expect(await response.json()).toMatchObject({
      error: "Forbidden",
      code: "forbidden",
    })
    expect(hasPermission).toHaveBeenCalledTimes(1)
  })
})

function mockExecutionCtx(): ExecutionContext {
  return {
    waitUntil() {},
    passThroughOnException() {},
  }
}
