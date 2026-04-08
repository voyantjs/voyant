import type { Actor } from "@voyantjs/core"
import type { MiddlewareHandler } from "hono"

import type { VoyantBindings, VoyantVariables } from "../types.js"

/**
 * Guards a route surface by actor type.
 *
 * Voyant exposes two API surfaces:
 * - `/v1/admin/*` — operator staff (`"staff"`)
 * - `/v1/public/*` — customers, partners, suppliers
 *
 * Requests carry an `actor` on `c.var`, typically set by `requireAuth` or a
 * custom `auth.resolve` integration. Internal requests
 * (`isInternalRequest === true`) bypass the check.
 *
 * When the caller has no explicit actor, this middleware treats them as
 * `"staff"` to preserve backwards compatibility with existing deployments
 * that predate the actor concept.
 *
 * @example
 * app.use("/v1/admin/*", requireActor("staff"))
 * app.use("/v1/public/*", requireActor("customer", "partner", "supplier"))
 */
export function requireActor<TBindings extends VoyantBindings = VoyantBindings>(
  ...allowed: Actor[]
): MiddlewareHandler<{
  Bindings: TBindings
  Variables: VoyantVariables
}> {
  if (allowed.length === 0) {
    throw new Error("requireActor: must specify at least one allowed actor")
  }
  const allowSet = new Set<Actor>(allowed)

  return async (c, next) => {
    if (c.req.method === "OPTIONS") return next()

    if (c.get("isInternalRequest")) {
      return next()
    }

    const actor: Actor = c.get("actor") ?? "staff"
    if (!allowSet.has(actor)) {
      return c.json({ error: "Forbidden: actor not permitted on this surface" }, 403)
    }

    return next()
  }
}
