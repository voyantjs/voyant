import type { EventBus } from "@voyantjs/core"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { Hono } from "hono"

import { financeDocumentsService } from "./service-documents.js"
import { financeService } from "./service.js"
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
  resolveDocumentDownloadUrl?: (
    bindings: unknown,
    storageKey: string,
  ) => Promise<string | null> | string | null
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
