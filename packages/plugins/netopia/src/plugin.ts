import type { Extension } from "@voyantjs/core"
import { defineHonoPlugin, type HonoPlugin } from "@voyantjs/hono"
import type { HonoExtension } from "@voyantjs/hono/module"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { Hono } from "hono"

import { resolveNetopiaRuntimeOptions } from "./client.js"
import { netopiaService } from "./service.js"
import type { NetopiaRuntimeOptions } from "./types.js"
import {
  netopiaCollectBookingGuaranteeSchema,
  netopiaCollectBookingScheduleSchema,
  netopiaCollectInvoiceSchema,
  netopiaStartPaymentSessionSchema,
  netopiaWebhookPayloadSchema,
} from "./validation.js"

type Env = {
  Bindings: Record<string, unknown>
  Variables: {
    db: PostgresJsDatabase
    userId?: string
  }
}

export function createNetopiaFinanceRoutes(options: NetopiaRuntimeOptions = {}) {
  const handleNetopiaError = (message: string) => {
    if (
      message.includes("not found") ||
      message.includes("Payment schedule not found") ||
      message.includes("Booking guarantee not found") ||
      message.includes("Invoice not found")
    ) {
      return { status: 404 as const, message }
    }
    if (message.includes("not startable") || message.includes("already assigned")) {
      return { status: 409 as const, message }
    }
    if (
      message.includes("Cannot create payment session") ||
      message.includes("outstanding balance") ||
      message.includes("No recipient available")
    ) {
      return { status: 409 as const, message }
    }
    if (message.includes("Missing Netopia config")) {
      return { status: 500 as const, message }
    }
    return { status: 502 as const, message }
  }

  return new Hono<Env>()
    .post("/providers/netopia/payment-sessions/:sessionId/start", async (c) => {
      try {
        const data = netopiaStartPaymentSessionSchema.parse(await c.req.json())
        const result = await netopiaService.startPaymentSession(
          c.get("db"),
          c.req.param("sessionId"),
          data,
          options,
          undefined,
          c.env,
        )
        return c.json({ data: result }, 201)
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to start Netopia payment"
        if (message.includes("Payment session not found")) {
          return c.json({ error: message }, 404)
        }
        if (message.includes("not startable") || message.includes("already assigned")) {
          return c.json({ error: message }, 409)
        }
        if (message.includes("Missing Netopia config")) {
          return c.json({ error: message }, 500)
        }
        return c.json({ error: message }, 502)
      }
    })
    .post("/providers/netopia/bookings/:bookingId/payment-schedules/:scheduleId/collect", async (c) => {
      try {
        const data = netopiaCollectBookingScheduleSchema.parse(await c.req.json())
        const result = await netopiaService.collectBookingSchedule(
          c.get("db"),
          c.req.param("scheduleId"),
          data,
          options,
          undefined,
          undefined,
          c.env,
        )
        return c.json({ data: result }, 201)
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to collect schedule payment"
        const response = handleNetopiaError(message)
        return c.json({ error: response.message }, response.status)
      }
    })
    .post("/providers/netopia/bookings/:bookingId/guarantees/:guaranteeId/collect", async (c) => {
      try {
        const data = netopiaCollectBookingGuaranteeSchema.parse(await c.req.json())
        const result = await netopiaService.collectBookingGuarantee(
          c.get("db"),
          c.req.param("guaranteeId"),
          data,
          options,
          undefined,
          undefined,
          c.env,
        )
        return c.json({ data: result }, 201)
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to collect guarantee payment"
        const response = handleNetopiaError(message)
        return c.json({ error: response.message }, response.status)
      }
    })
    .post("/providers/netopia/invoices/:invoiceId/collect", async (c) => {
      try {
        const data = netopiaCollectInvoiceSchema.parse(await c.req.json())
        const result = await netopiaService.collectInvoice(
          c.get("db"),
          c.req.param("invoiceId"),
          data,
          options,
          undefined,
          undefined,
          c.env,
        )
        return c.json({ data: result }, 201)
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to collect invoice payment"
        const response = handleNetopiaError(message)
        return c.json({ error: response.message }, response.status)
      }
    })
    .post("/providers/netopia/callback", async (c) => {
      const payload = netopiaWebhookPayloadSchema.parse(await c.req.json())
      const result = await netopiaService.handleCallback(c.get("db"), payload, options, c.env)
      return c.json({ data: result })
    })
    .get("/providers/netopia/config", async (c) => {
      try {
        const runtime = resolveNetopiaRuntimeOptions(c.env, options)
        return c.json({
          data: {
            apiUrl: runtime.apiUrl,
            notifyUrl: runtime.notifyUrl,
            redirectUrl: runtime.redirectUrl,
            emailTemplate: runtime.emailTemplate,
            language: runtime.language,
            successStatuses: runtime.successStatuses,
            processingStatuses: runtime.processingStatuses,
          },
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : "Missing Netopia config"
        return c.json({ error: message }, 500)
      }
    })
}

const netopiaFinanceExtensionDef: Extension = {
  name: "netopia-finance",
  module: "finance",
}

export function createNetopiaFinanceExtension(options: NetopiaRuntimeOptions = {}): HonoExtension {
  return {
    extension: netopiaFinanceExtensionDef,
    routes: createNetopiaFinanceRoutes(options),
  }
}

export function netopiaHonoPlugin(options: NetopiaRuntimeOptions = {}): HonoPlugin {
  return defineHonoPlugin({
    name: "netopia",
    version: "0.1.0",
    extensions: [createNetopiaFinanceExtension(options)],
  })
}

export const netopiaFinanceExtension = createNetopiaFinanceExtension()
