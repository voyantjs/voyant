import type { MiddlewareHandler } from "hono"

import type { VoyantBindings } from "../types.js"

function parseAllowlist(env: VoyantBindings): string[] {
  const raw = env.CORS_ALLOWLIST
  if (!raw) return []
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}

export function cors(): MiddlewareHandler<{ Bindings: VoyantBindings }> {
  return async (c, next) => {
    const origin = c.req.header("origin") || ""
    const allowlist = parseAllowlist(c.env)
    const allowed = allowlist.length === 0 ? false : allowlist.includes(origin)

    if (origin && !allowed) {
      console.warn("[CORS] Origin not in allowlist - CORS headers will NOT be set", {
        origin,
        allowlist,
        path: c.req.path,
        method: c.req.method,
      })
    }

    if (c.req.method === "OPTIONS") {
      if (allowed) {
        c.header("Access-Control-Allow-Origin", origin)
        c.header("Vary", "Origin")
        c.header("Access-Control-Allow-Credentials", "true")
        c.header(
          "Access-Control-Allow-Headers",
          c.req.header("access-control-request-headers") || "content-type, authorization",
        )
        c.header(
          "Access-Control-Allow-Methods",
          c.req.header("access-control-request-method") || "GET,POST,PUT,PATCH,DELETE,OPTIONS",
        )
      }
      return new Response(null, { status: 204 })
    }

    await next()

    if (allowed) {
      c.header("Access-Control-Allow-Origin", origin)
      c.header("Vary", "Origin")
      c.header("Access-Control-Allow-Credentials", "true")
    }
  }
}
