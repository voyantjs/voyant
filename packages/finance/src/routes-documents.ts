import type { EventBus, ModuleContainer } from "@voyantjs/core"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { Hono } from "hono"

import {
  buildFinanceRouteRuntime,
  FINANCE_ROUTE_RUNTIME_CONTAINER_KEY,
  type FinanceRouteRuntime,
} from "./route-runtime.js"
import { financeService } from "./service.js"
import { financeDocumentsService } from "./service-documents.js"
import { generateInvoiceDocumentInputSchema } from "./validation.js"

type Env = {
  Bindings: Record<string, unknown>
  Variables: {
    container: ModuleContainer
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
  resolveDocumentDownloadUrl?: (
    bindings: unknown,
    storageKey: string,
  ) => Promise<string | null> | string | null
  eventBus?: EventBus
  resolveEventBus?: (bindings: Record<string, unknown>) => EventBus | undefined
}

function getRuntime(
  options: FinanceDocumentRouteOptions | undefined,
  bindings: Record<string, unknown>,
  resolveFromContainer?: (key: string) => FinanceRouteRuntime | undefined,
) {
  return (
    resolveFromContainer?.(FINANCE_ROUTE_RUNTIME_CONTAINER_KEY) ??
    buildFinanceRouteRuntime(bindings, options)
  )
}

function getMetadataRecord(metadata: unknown) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null
  }

  return metadata as Record<string, unknown>
}

function maybeUrl(value: unknown) {
  return typeof value === "string" && /^https?:\/\//i.test(value) ? value : null
}

function getFallbackDownloadUrl(metadata: unknown) {
  const record = getMetadataRecord(metadata)
  if (!record) {
    return null
  }

  for (const key of ["url", "publicUrl", "downloadUrl", "download_url", "signedUrl"]) {
    const value = maybeUrl(record[key])
    if (value) {
      return value
    }
  }

  return null
}

export function createFinanceAdminDocumentRoutes(options: FinanceDocumentRouteOptions = {}) {
  return new Hono<Env>()
    .post("/invoices/:id/generate-document", async (c) => {
      const runtime = getRuntime(options, c.env, (key) => c.var.container?.resolve(key))
      const generator = runtime.invoiceDocumentGenerator
      if (!generator) {
        return c.json({ error: "Invoice document generator is not configured" }, 501)
      }

      const result = await financeDocumentsService.generateInvoiceDocument(
        c.get("db"),
        c.req.param("id"),
        generateInvoiceDocumentInputSchema.parse(await c.req.json().catch(() => ({}))),
        { generator, bindings: c.env, eventBus: runtime.eventBus },
      )

      if (result.status === "not_found") return c.json({ error: "Invoice not found" }, 404)
      if (result.status === "generator_failed") {
        return c.json({ error: "Invoice document generation failed" }, 502)
      }

      return c.json({ data: result }, 201)
    })
    .post("/invoices/:id/regenerate-document", async (c) => {
      const runtime = getRuntime(options, c.env, (key) => c.var.container?.resolve(key))
      const generator = runtime.invoiceDocumentGenerator
      if (!generator) {
        return c.json({ error: "Invoice document generator is not configured" }, 501)
      }

      const result = await financeDocumentsService.regenerateInvoiceDocument(
        c.get("db"),
        c.req.param("id"),
        generateInvoiceDocumentInputSchema.parse(await c.req.json().catch(() => ({}))),
        { generator, bindings: c.env, eventBus: runtime.eventBus },
      )

      if (result.status === "not_found") return c.json({ error: "Invoice not found" }, 404)
      if (result.status === "generator_failed") {
        return c.json({ error: "Invoice document generation failed" }, 502)
      }

      return c.json({ data: result })
    })
    .get("/invoice-renditions/:id/download", async (c) => {
      const rendition = await financeService.getInvoiceRenditionById(c.get("db"), c.req.param("id"))
      if (!rendition) {
        return c.json({ error: "Invoice rendition not found" }, 404)
      }

      let location: string | null = null
      if (rendition.storageKey) {
        if (!options.resolveDocumentDownloadUrl) {
          return c.json({ error: "Document download resolver is not configured" }, 501)
        }
        location = await options.resolveDocumentDownloadUrl(c.env, rendition.storageKey)
      }

      location ??= getFallbackDownloadUrl(rendition.metadata)
      if (!location) {
        return c.json({ error: "Invoice document is not available" }, 404)
      }

      return c.redirect(location, 302)
    })
}
