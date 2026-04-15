import type { EventBus } from "@voyantjs/core"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { Hono } from "hono"

import { financeDocumentsService } from "./service-documents.js"
import { generateInvoiceDocumentInputSchema } from "./validation.js"

type Env = {
  Bindings: Record<string, unknown>
  Variables: {
    db: PostgresJsDatabase
    userId?: string
  }
}

export type InvoiceDocumentGenerator = Parameters<
  typeof financeDocumentsService.generateInvoiceDocument
>[3]["generator"]

export interface FinanceDocumentRouteOptions {
  invoiceDocumentGenerator?: InvoiceDocumentGenerator
  resolveInvoiceDocumentGenerator?: (
    bindings: Record<string, unknown>,
  ) => InvoiceDocumentGenerator | undefined
  eventBus?: EventBus
  resolveEventBus?: (bindings: Record<string, unknown>) => EventBus | undefined
}

function resolveInvoiceDocumentGenerator(
  options: FinanceDocumentRouteOptions | undefined,
  bindings: Record<string, unknown>,
) {
  return options?.resolveInvoiceDocumentGenerator?.(bindings) ?? options?.invoiceDocumentGenerator
}

function resolveEventBus(
  options: FinanceDocumentRouteOptions | undefined,
  bindings: Record<string, unknown>,
) {
  return options?.resolveEventBus?.(bindings) ?? options?.eventBus
}

export function createFinanceAdminDocumentRoutes(options: FinanceDocumentRouteOptions = {}) {
  return new Hono<Env>()
    .post("/invoices/:id/generate-document", async (c) => {
      const generator = resolveInvoiceDocumentGenerator(options, c.env)
      if (!generator) {
        return c.json({ error: "Invoice document generator is not configured" }, 501)
      }

      const result = await financeDocumentsService.generateInvoiceDocument(
        c.get("db"),
        c.req.param("id"),
        generateInvoiceDocumentInputSchema.parse(await c.req.json().catch(() => ({}))),
        { generator, bindings: c.env, eventBus: resolveEventBus(options, c.env) },
      )

      if (result.status === "not_found") return c.json({ error: "Invoice not found" }, 404)
      if (result.status === "generator_failed") {
        return c.json({ error: "Invoice document generation failed" }, 502)
      }

      return c.json({ data: result }, 201)
    })
    .post("/invoices/:id/regenerate-document", async (c) => {
      const generator = resolveInvoiceDocumentGenerator(options, c.env)
      if (!generator) {
        return c.json({ error: "Invoice document generator is not configured" }, 501)
      }

      const result = await financeDocumentsService.regenerateInvoiceDocument(
        c.get("db"),
        c.req.param("id"),
        generateInvoiceDocumentInputSchema.parse(await c.req.json().catch(() => ({}))),
        { generator, bindings: c.env, eventBus: resolveEventBus(options, c.env) },
      )

      if (result.status === "not_found") return c.json({ error: "Invoice not found" }, 404)
      if (result.status === "generator_failed") {
        return c.json({ error: "Invoice document generation failed" }, 502)
      }

      return c.json({ data: result })
    })
}
