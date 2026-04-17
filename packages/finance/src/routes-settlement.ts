import type { EventBus } from "@voyantjs/core"
import { parseOptionalJsonBody } from "@voyantjs/hono"
import { Hono } from "hono"

import { financeSettlementService, type InvoiceSettlementPoller } from "./service-settlement.js"
import { pollInvoiceSettlementInputSchema } from "./validation.js"

type Env = {
  Bindings: Record<string, unknown>
  Variables: {
    db: import("drizzle-orm/postgres-js").PostgresJsDatabase
    userId?: string
  }
}

export interface FinanceSettlementRouteOptions {
  invoiceSettlementPollers?: Record<string, InvoiceSettlementPoller>
  resolveInvoiceSettlementPollers?: (
    bindings: Record<string, unknown>,
  ) => Record<string, InvoiceSettlementPoller> | undefined
  eventBus?: EventBus
  resolveEventBus?: (bindings: Record<string, unknown>) => EventBus | undefined
}

function resolveInvoiceSettlementPollers(
  options: FinanceSettlementRouteOptions | undefined,
  bindings: Record<string, unknown>,
) {
  return (
    options?.resolveInvoiceSettlementPollers?.(bindings) ?? options?.invoiceSettlementPollers ?? {}
  )
}

function resolveEventBus(
  options: FinanceSettlementRouteOptions | undefined,
  bindings: Record<string, unknown>,
) {
  return options?.resolveEventBus?.(bindings) ?? options?.eventBus
}

export function createFinanceAdminSettlementRoutes(options: FinanceSettlementRouteOptions = {}) {
  return new Hono<Env>().post("/invoices/:id/poll-settlement", async (c) => {
    const result = await financeSettlementService.pollInvoiceSettlement(
      c.get("db"),
      c.req.param("id"),
      await parseOptionalJsonBody(c, pollInvoiceSettlementInputSchema),
      {
        bindings: c.env,
        invoiceSettlementPollers: resolveInvoiceSettlementPollers(options, c.env),
        eventBus: resolveEventBus(options, c.env),
      },
    )

    if ("status" in result && result.status === "not_found") {
      return c.json({ error: "Invoice not found" }, 404)
    }

    return c.json({ data: result })
  })
}

export type { InvoiceSettlementPoller } from "./service-settlement.js"
