import { apiErrorSchema } from "@voyantjs/types"
import type { MiddlewareHandler } from "hono"

function generateRequestId(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

export const requestId: MiddlewareHandler = async (c, next) => {
  const existing = c.req.header("x-request-id")
  const id = existing?.trim() || generateRequestId()
  c.res.headers.set("X-Request-Id", id)
  await next()
}

const REDACT_HEADERS = new Set(["authorization", "x-api-key"])

export const errorBoundary: MiddlewareHandler = async (c, next) => {
  try {
    await next()
  } catch (err: unknown) {
    const id = c.res.headers.get("X-Request-Id") || generateRequestId()
    const errRecord = err instanceof Object ? (err as Record<string, unknown>) : {}
    const code = typeof errRecord.code === "string" ? errRecord.code : undefined
    const status = typeof errRecord.status === "number" ? errRecord.status : 500

    try {
      const headers: Record<string, string> = {}
      c.req.raw.headers.forEach((value, key) => {
        const lowerKey = key.toLowerCase()
        headers[lowerKey] = REDACT_HEADERS.has(lowerKey) ? "[redacted]" : value
      })

      console.error("[API:error]", {
        id,
        status,
        code,
        path: c.req.path,
        method: c.req.method,
        headers,
        err: err instanceof Error ? err.message : String(err),
      })
    } catch {
      /* ignore logging errors */
    }

    const statusCode = (status >= 100 && status <= 599 ? status : 500) as 500
    return c.json(
      apiErrorSchema.parse({ error: "Internal Server Error", code, requestId: id }),
      statusCode,
    )
  }
}
