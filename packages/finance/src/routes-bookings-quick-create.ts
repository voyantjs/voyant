import type { Extension } from "@voyantjs/core"
import { parseJsonBody } from "@voyantjs/hono"
import type { HonoExtension } from "@voyantjs/hono/module"
import { Hono } from "hono"

import { FINANCE_ROUTE_RUNTIME_CONTAINER_KEY, type FinanceRouteRuntime } from "./route-runtime.js"
import { quickCreateBooking, quickCreateBookingSchema } from "./service-bookings-quick-create.js"

function resolveRuntime(container: { resolve: <T>(key: string) => T }): FinanceRouteRuntime | null {
  try {
    return container.resolve<FinanceRouteRuntime>(FINANCE_ROUTE_RUNTIME_CONTAINER_KEY)
  } catch {
    return null
  }
}

/**
 * Mounted under `/v1/admin/bookings/*` via the extension's `module` target, so
 * the endpoint's public-facing path lands at `POST /v1/admin/bookings/quick-create`
 * even though the code lives in `@voyantjs/finance`. See the header comment in
 * service-bookings-quick-create.ts for why finance owns this orchestration.
 */
const quickCreateRoutes = new Hono<{
  Variables: {
    db: import("drizzle-orm/postgres-js").PostgresJsDatabase
    userId?: string
    container: { resolve: <T>(key: string) => T }
  }
}>().post("/quick-create", async (c) => {
  const input = await parseJsonBody(c, quickCreateBookingSchema)
  const runtime = resolveRuntime(c.var.container)

  const outcome = await quickCreateBooking(c.get("db"), input, {
    userId: c.get("userId"),
    runtime: runtime ? { eventBus: runtime.eventBus } : undefined,
  })

  switch (outcome.status) {
    case "ok":
      return c.json({ data: outcome.result }, 201)
    case "product_not_found":
      return c.json({ error: "Product not found or unavailable" }, 404)
    case "voucher_not_found":
      return c.json({ error: "Voucher not found" }, 404)
    case "voucher_inactive":
      return c.json({ error: "Voucher is not active" }, 409)
    case "voucher_expired":
      return c.json({ error: "Voucher has expired" }, 409)
    case "voucher_insufficient_balance":
      return c.json({ error: "Voucher does not have enough balance" }, 409)
    case "group_not_found":
      return c.json({ error: "Booking group not found" }, 404)
    case "booking_already_in_group":
      return c.json(
        {
          error: "Booking is already a member of a group",
          currentGroupId: outcome.currentGroupId,
        },
        409,
      )
  }
})

const bookingsQuickCreateExtensionDef: Extension = {
  name: "bookings-quick-create",
  module: "bookings",
}

export const bookingsQuickCreateExtension: HonoExtension = {
  extension: bookingsQuickCreateExtensionDef,
  adminRoutes: quickCreateRoutes,
}
