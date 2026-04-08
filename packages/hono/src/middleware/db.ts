import type { MiddlewareHandler } from "hono"

import type { DbFactory, VoyantBindings, VoyantDb } from "../types.js"

export function db<TBindings extends VoyantBindings>(
  factory: DbFactory<TBindings>,
): MiddlewareHandler<{
  Bindings: TBindings
  Variables: { db: VoyantDb }
}> {
  return async (c, next) => {
    c.set("db", factory(c.env))
    await next()
  }
}
