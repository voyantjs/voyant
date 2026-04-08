import type { MiddlewareHandler } from "hono"

import type { VoyantBindings } from "../types.js"

type RateLimitWindow = "second" | "minute"

export const LIVE_LIMITS = {
  burst: 30,
  rpm: 3000,
} as const

export function rateLimit(options: {
  bucket: string
  window?: RateLimitWindow
  limitResolver?: (c: { get: (key: string) => unknown }) => number
}): MiddlewareHandler<{
  Bindings: VoyantBindings
}> {
  const windowUnit: RateLimitWindow = options.window || "minute"
  const bucket = options.bucket

  return async (c, next) => {
    if (c.req.method === "OPTIONS") return next()

    // No-op if RATE_LIMIT KV is not bound
    const kv = c.env.RATE_LIMIT
    if (!kv) return next()

    let limit: number

    if (options.limitResolver) {
      limit = options.limitResolver(c)
    } else {
      limit = windowUnit === "second" ? LIVE_LIMITS.burst : LIVE_LIMITS.rpm
    }

    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, "0")
    const base = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}`
    const windowKey = windowUnit === "second" ? `${base}${pad(now.getUTCSeconds())}` : base
    const key = `lim:${bucket}:${windowKey}`

    const raw = await kv.get(key)
    const current = raw ? Number((JSON.parse(raw) as { count: number }).count || 0) : 0
    const nextCount = current + 1
    const ttl = windowUnit === "second" ? 2 : 120
    await kv.put(key, JSON.stringify({ count: nextCount }), { expirationTtl: ttl })

    const resetIn =
      windowUnit === "second"
        ? 1000 - now.getUTCMilliseconds()
        : 60000 - (now.getUTCSeconds() * 1000 + now.getUTCMilliseconds())
    const remaining = Math.max(0, limit - nextCount)
    c.header("X-RateLimit-Limit", String(limit))
    c.header("X-RateLimit-Remaining", String(remaining))
    c.header("X-RateLimit-Reset", String(Date.now() + resetIn))

    if (nextCount > limit) {
      c.header("Retry-After", windowUnit === "second" ? "1" : "60")
      return c.json({ error: "Too Many Requests" }, 429)
    }

    return next()
  }
}
