import type { NotificationProvider } from "@voyantjs/notifications"
import { createNotificationService } from "@voyantjs/notifications"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { Hono } from "hono"

import {
  type CheckoutPolicyOptions,
  initiateCheckoutCollection,
  previewCheckoutCollection,
} from "./service.js"
import { initiateCheckoutCollectionSchema, previewCheckoutCollectionSchema } from "./validation.js"

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
  } = {},
) {
  return new Hono<Env>()
    .post("/v1/checkout/bookings/:bookingId/collection-plan", async (c) => {
      try {
        const plan = await previewCheckoutCollection(
          c.get("db"),
          c.req.param("bookingId"),
          previewCheckoutCollectionSchema.parse(await c.req.json().catch(() => ({}))),
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
          initiateCheckoutCollectionSchema.parse(await c.req.json()),
          options.policy,
          dispatcher,
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
}
