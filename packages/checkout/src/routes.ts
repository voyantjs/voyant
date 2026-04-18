import type { Module } from "@voyantjs/core"
import { parseJsonBody, parseOptionalJsonBody, parseQuery } from "@voyantjs/hono"
import type { HonoModule } from "@voyantjs/hono/module"
import type { NotificationProvider } from "@voyantjs/notifications"
import { createNotificationService } from "@voyantjs/notifications"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { Hono } from "hono"

import {
  bootstrapCheckoutCollection,
  type CheckoutBankTransferDetails,
  type CheckoutPaymentStarter,
  type CheckoutPolicyOptions,
  initiateCheckoutCollection,
  listBookingReminderRuns,
  previewCheckoutCollection,
} from "./service.js"
import {
  bootstrapCheckoutCollectionSchema,
  checkoutReminderRunListQuerySchema,
  initiateCheckoutCollectionSchema,
  previewCheckoutCollectionSchema,
} from "./validation.js"

type Env = {
  Bindings: Record<string, unknown>
  Variables: {
    db: PostgresJsDatabase
    userId?: string
  }
}

export function createCheckoutRoutes(
  options: {
    policy?: CheckoutPolicyOptions
    providers?: ReadonlyArray<NotificationProvider>
    resolveProviders?: (bindings: Record<string, unknown>) => ReadonlyArray<NotificationProvider>
    paymentStarters?: Record<string, CheckoutPaymentStarter>
    resolvePaymentStarters?: (
      bindings: Record<string, unknown>,
    ) => Record<string, CheckoutPaymentStarter>
    bankTransferDetails?: CheckoutBankTransferDetails | null
    resolveBankTransferDetails?: (
      bindings: Record<string, unknown>,
    ) => CheckoutBankTransferDetails | null
  } = {},
) {
  function createCheckoutRuntime(bindings: Record<string, unknown>) {
    return {
      bindings,
      paymentStarters: options.resolvePaymentStarters?.(bindings) ?? options.paymentStarters ?? {},
      bankTransferDetails:
        options.resolveBankTransferDetails?.(bindings) ?? options.bankTransferDetails ?? null,
    }
  }

  return new Hono<Env>()
    .post("/v1/checkout/bookings/:bookingId/collection-plan", async (c) => {
      try {
        const plan = await previewCheckoutCollection(
          c.get("db"),
          c.req.param("bookingId"),
          await parseOptionalJsonBody(c, previewCheckoutCollectionSchema),
          options.policy,
        )

        if (!plan) {
          return c.json({ error: "Booking not found" }, 404)
        }

        return c.json({ data: plan })
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to preview checkout collection"
        return c.json({ error: message }, 400)
      }
    })
    .post("/v1/checkout/bookings/:bookingId/initiate-collection", async (c) => {
      try {
        const dispatcher = createNotificationService(
          options.resolveProviders?.(c.env) ?? options.providers ?? [],
        )
        const result = await initiateCheckoutCollection(
          c.get("db"),
          c.req.param("bookingId"),
          await parseJsonBody(c, initiateCheckoutCollectionSchema),
          options.policy,
          dispatcher,
          createCheckoutRuntime(c.env),
        )

        if (!result) {
          return c.json({ error: "Booking not found" }, 404)
        }

        return c.json({ data: result }, 201)
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to initiate checkout collection"
        if (message.includes("Booking not found")) {
          return c.json({ error: message }, 404)
        }
        return c.json({ error: message }, 409)
      }
    })
    .post("/v1/checkout/collections/bootstrap", async (c) => {
      try {
        const dispatcher = createNotificationService(
          options.resolveProviders?.(c.env) ?? options.providers ?? [],
        )
        const result = await bootstrapCheckoutCollection(
          c.get("db"),
          await parseJsonBody(c, bootstrapCheckoutCollectionSchema),
          options.policy,
          dispatcher,
          createCheckoutRuntime(c.env),
        )

        if (!result) {
          return c.json({ error: "Booking session not found" }, 404)
        }

        return c.json({ data: result }, 201)
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to bootstrap checkout collection"
        if (message.includes("Booking not found")) {
          return c.json({ error: message }, 404)
        }
        return c.json({ error: message }, 409)
      }
    })
}

export function createCheckoutAdminRoutes() {
  return new Hono<Env>().get("/bookings/:bookingId/reminder-runs", async (c) => {
    const query = await parseQuery(c, checkoutReminderRunListQuerySchema)

    return c.json(await listBookingReminderRuns(c.get("db"), c.req.param("bookingId"), query))
  })
}

export const checkoutModule: Module = {
  name: "checkout",
}

export function createCheckoutHonoModule(
  options?: Parameters<typeof createCheckoutRoutes>[0],
): HonoModule {
  return {
    module: checkoutModule,
    routes: createCheckoutRoutes(options),
    adminRoutes: createCheckoutAdminRoutes(),
  }
}
