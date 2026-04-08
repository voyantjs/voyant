/**
 * HTTP helpers for testing Hono routes without wiring up auth/db middleware
 * in every test file.
 */

import type { Context, Env, Next } from "hono"
import { Hono } from "hono"

/**
 * Builds a `RequestInit` fragment for a JSON body. Spread into
 * `app.request(url, { method, ...json(body) })`.
 */
export function json(body: Record<string, unknown> | unknown[]): RequestInit {
  return {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }
}

export interface TestAppOptions {
  /** DB instance to inject via `c.set("db", ...)` */
  db?: unknown
  /** User id to inject via `c.set("userId", ...)` */
  userId?: string
  /** Actor type to inject via `c.set("actor", ...)` (defaults to "staff"). */
  actor?: "staff" | "customer" | "partner" | "supplier"
  /** Additional context vars to set before the route runs. */
  vars?: Record<string, unknown>
  /** Path prefix to mount routes under. Defaults to "/". */
  basePath?: string
}

/**
 * Mounts a Hono sub-app (the `routes` param) behind a middleware that injects
 * the test db, a user id, an actor, and any extra context vars.
 *
 * This captures the boilerplate present in most module integration tests:
 *
 *     app = new Hono()
 *     app.use("*", async (c, next) => {
 *       c.set("db" as never, db)
 *       c.set("userId" as never, "test-user-id")
 *       await next()
 *     })
 *     app.route("/", moduleRoutes)
 *
 * @example
 * const app = mountTestApp(bookingRoutes, { db, userId: "u1" })
 * const res = await app.request("/", { method: "GET" })
 */
export function mountTestApp<E extends Env = Env>(
  routes: Hono<E>,
  options: TestAppOptions = {},
): Hono<E> {
  const { db, userId = "test-user-id", actor = "staff", vars = {}, basePath = "/" } = options

  const app = new Hono<E>()
  app.use("*", async (c: Context, next: Next) => {
    if (db !== undefined) c.set("db" as never, db as never)
    c.set("userId" as never, userId as never)
    c.set("actor" as never, actor as never)
    for (const [key, value] of Object.entries(vars)) {
      c.set(key as never, value as never)
    }
    await next()
  })
  app.route(basePath, routes)
  return app
}

/**
 * Convenience: sends an HTTP request with a JSON body. Returns the raw
 * `Response`. Callers still `await res.json()` themselves.
 */
export async function jsonRequest(
  app: Hono,
  method: string,
  path: string,
  body?: Record<string, unknown> | unknown[],
): Promise<Response> {
  const init: RequestInit = { method }
  if (body !== undefined) {
    init.headers = { "Content-Type": "application/json" }
    init.body = JSON.stringify(body)
  }
  return app.request(path, init)
}
