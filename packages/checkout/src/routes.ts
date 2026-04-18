import type { Module, ModuleContainer } from "@voyantjs/core"
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
    container: ModuleContainer
    db: PostgresJsDatabase
    userId?: string
  }
}

export type CheckoutRoutesOptions = {
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
}

export type CheckoutRouteRuntime = {
  bindings: Record<string, unknown>
  providers: ReadonlyArray<NotificationProvider>
  paymentStarters: Record<string, CheckoutPaymentStarter>
  bankTransferDetails: CheckoutBankTransferDetails | null
}

export const CHECKOUT_ROUTE_RUNTIME_CONTAINER_KEY = "providers.checkout.runtime"

export function createCheckoutRoutes(options: CheckoutRoutesOptions = {}) {
  function getRuntime(
    bindings: Record<string, unknown>,
    resolveFromContainer?: (key: string) => CheckoutRouteRuntime | undefined,
  ) {
    return (
      resolveFromContainer?.(CHECKOUT_ROUTE_RUNTIME_CONTAINER_KEY) ??
      buildCheckoutRouteRuntime(bindings, options)
    )
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
        const runtime = getRuntime(c.env, (key) => c.var.container?.resolve(key))
        const dispatcher = createNotificationService(runtime.providers)
        const result = await initiateCheckoutCollection(
          c.get("db"),
          c.req.param("bookingId"),
          await parseJsonBody(c, initiateCheckoutCollectionSchema),
          options.policy,
          dispatcher,
          runtime,
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
        const runtime = getRuntime(c.env, (key) => c.var.container?.resolve(key))
        const dispatcher = createNotificationService(runtime.providers)
        const result = await bootstrapCheckoutCollection(
          c.get("db"),
          await parseJsonBody(c, bootstrapCheckoutCollectionSchema),
          options.policy,
          dispatcher,
          runtime,
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
    const query = parseQuery(c, checkoutReminderRunListQuerySchema)

    return c.json(await listBookingReminderRuns(c.get("db"), c.req.param("bookingId"), query))
  })
}

export const checkoutModule: Module = {
  name: "checkout",
}

export function createCheckoutHonoModule(options: CheckoutRoutesOptions = {}): HonoModule {
  const module: Module = {
    ...checkoutModule,
    bootstrap: ({ bindings, container }) => {
      container.register(
        CHECKOUT_ROUTE_RUNTIME_CONTAINER_KEY,
        buildCheckoutRouteRuntime(bindings as Record<string, unknown>, options),
      )
    },
  }

  return {
    module,
    routes: createCheckoutRoutes(options),
    adminRoutes: createCheckoutAdminRoutes(),
  }
}

export function buildCheckoutRouteRuntime(
  bindings: Record<string, unknown>,
  options: CheckoutRoutesOptions = {},
): CheckoutRouteRuntime {
  return {
    bindings,
    providers: options.resolveProviders?.(bindings) ?? options.providers ?? [],
    paymentStarters: options.resolvePaymentStarters?.(bindings) ?? options.paymentStarters ?? {},
    bankTransferDetails:
      options.resolveBankTransferDetails?.(bindings) ?? options.bankTransferDetails ?? null,
  }
}
