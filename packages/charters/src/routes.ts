import { parseJsonBody, parseQuery } from "@voyantjs/hono"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { Hono } from "hono"
import { z } from "zod"

import { parseUnifiedKey } from "./lib/key.js"
import { chartersService } from "./service.js"
import {
  type CreatePerSuiteBookingInput,
  type CreateWholeYachtBookingInput,
  chartersBookingService,
} from "./service-bookings.js"
import { type CharterContractsService, mybaService } from "./service-myba.js"
import { pricingService } from "./service-pricing.js"
import {
  insertProductSchema,
  insertVoyageSchema,
  productListQuerySchema,
  updateProductSchema,
  updateVoyageSchema,
  voyageListQuerySchema,
} from "./validation-core.js"
import { replaceVoyageScheduleSchema } from "./validation-itinerary.js"
import { replaceVoyageSuitesSchema } from "./validation-pricing.js"
import { firstClassCurrencySchema } from "./validation-shared.js"
import { insertYachtSchema, updateYachtSchema, yachtListQuerySchema } from "./validation-yachts.js"

// ---------- Hono env ----------

type Env = {
  Variables: {
    db: PostgresJsDatabase
    userId?: string
    /**
     * Optional injection of `@voyantjs/legal`'s contractsService — set by
     * the template at app boot so MYBA generation routes can run without
     * charters taking a hard dep on legal. When unset, the
     * `/voyages/:key/bookings/whole-yacht/:bookingId/myba` endpoint
     * returns 501.
     */
    chartersContractsService?: CharterContractsService
  }
}

const externalNotSupported = (provider: string) => ({
  error: "external_not_supported_yet",
  detail: `External provider '${provider}' will ship in phase 3 once the CharterAdapter contract lands. Use a local TypeID for now.`,
})

const invalidKey = (raw: string) => ({ error: "invalid_key", detail: `Unrecognized key: ${raw}` })

// ---------- payload schemas ----------

const guestSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  travelerCategory: z.enum(["adult", "child", "infant", "senior", "other"]).optional().nullable(),
  preferredLanguage: z.string().optional().nullable(),
  specialRequests: z.string().optional().nullable(),
  personId: z.string().optional().nullable(),
  isPrimary: z.boolean().optional(),
  notes: z.string().optional().nullable(),
})

const contactSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  language: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
})

const createPerSuiteBookingPayload = z.object({
  voyageId: z.string(),
  suiteId: z.string(),
  currency: firstClassCurrencySchema,
  personId: z.string().optional().nullable(),
  organizationId: z.string().optional().nullable(),
  contact: contactSchema,
  guests: z.array(guestSchema).min(1),
  notes: z.string().optional().nullable(),
}) satisfies z.ZodType<CreatePerSuiteBookingInput>

const createWholeYachtBookingPayload = z.object({
  voyageId: z.string(),
  currency: firstClassCurrencySchema,
  personId: z.string().optional().nullable(),
  organizationId: z.string().optional().nullable(),
  contact: contactSchema,
  guests: z.array(guestSchema).optional(),
  notes: z.string().optional().nullable(),
}) satisfies z.ZodType<CreateWholeYachtBookingInput>

const generateMybaPayload = z.object({
  templateIdOverride: z.string().optional().nullable(),
  language: z.string().optional(),
  extraVariables: z.record(z.string(), z.unknown()).optional(),
  title: z.string().optional(),
})

const perSuiteQuotePayload = z.object({
  suiteId: z.string(),
  currency: firstClassCurrencySchema,
})

const wholeYachtQuotePayload = z.object({
  currency: firstClassCurrencySchema,
})

// ---------- routes ----------

export const chartersAdminRoutes = new Hono<Env>()
  // --- products ---
  .get("/products", async (c) => {
    const query = parseQuery(c, productListQuerySchema)
    const result = await chartersService.listProducts(c.get("db"), query)
    return c.json(result)
  })
  .post("/products", async (c) => {
    const data = await parseJsonBody(c, insertProductSchema)
    const row = await chartersService.createProduct(c.get("db"), data)
    return c.json({ data: row }, 201)
  })
  .get("/products/:key", async (c) => {
    const parsed = parseUnifiedKey(c.req.param("key"))
    if (parsed.kind === "invalid") return c.json(invalidKey(parsed.raw), 400)
    if (parsed.kind === "external") return c.json(externalNotSupported(parsed.provider), 501)
    const includeRaw = c.req.query("include") ?? ""
    const includes = new Set(
      includeRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    )
    const row = await chartersService.getProductById(c.get("db"), parsed.id, {
      withVoyages: includes.has("voyages"),
      withYacht: includes.has("yacht"),
    })
    if (!row) return c.json({ error: "not_found" }, 404)
    return c.json({ data: row })
  })
  .put("/products/:key", async (c) => {
    const parsed = parseUnifiedKey(c.req.param("key"))
    if (parsed.kind === "invalid") return c.json(invalidKey(parsed.raw), 400)
    if (parsed.kind === "external") return c.json(externalNotSupported(parsed.provider), 501)
    const data = await parseJsonBody(c, updateProductSchema)
    const row = await chartersService.updateProduct(c.get("db"), parsed.id, data)
    if (!row) return c.json({ error: "not_found" }, 404)
    return c.json({ data: row })
  })
  .delete("/products/:key", async (c) => {
    const parsed = parseUnifiedKey(c.req.param("key"))
    if (parsed.kind === "invalid") return c.json(invalidKey(parsed.raw), 400)
    if (parsed.kind === "external") return c.json(externalNotSupported(parsed.provider), 501)
    const row = await chartersService.archiveProduct(c.get("db"), parsed.id)
    if (!row) return c.json({ error: "not_found" }, 404)
    return c.json({ data: row })
  })
  .post("/products/:key/aggregates/recompute", async (c) => {
    const parsed = parseUnifiedKey(c.req.param("key"))
    if (parsed.kind === "invalid") return c.json(invalidKey(parsed.raw), 400)
    if (parsed.kind === "external") return c.json(externalNotSupported(parsed.provider), 501)
    const row = await chartersService.recomputeProductAggregates(c.get("db"), parsed.id)
    if (!row) return c.json({ error: "not_found" }, 404)
    return c.json({ data: row })
  })
  // --- voyages ---
  .get("/voyages", async (c) => {
    const query = parseQuery(c, voyageListQuerySchema)
    const result = await chartersService.listVoyages(c.get("db"), query)
    return c.json(result)
  })
  .post("/voyages", async (c) => {
    const data = await parseJsonBody(c, insertVoyageSchema)
    const row = await chartersService.upsertVoyage(c.get("db"), data)
    return c.json({ data: row }, 201)
  })
  .get("/voyages/:key", async (c) => {
    const parsed = parseUnifiedKey(c.req.param("key"))
    if (parsed.kind === "invalid") return c.json(invalidKey(parsed.raw), 400)
    if (parsed.kind === "external") return c.json(externalNotSupported(parsed.provider), 501)
    const includeRaw = c.req.query("include") ?? ""
    const includes = new Set(
      includeRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    )
    const row = await chartersService.getVoyageById(c.get("db"), parsed.id, {
      withSuites: includes.has("suites"),
      withSchedule: includes.has("schedule"),
    })
    if (!row) return c.json({ error: "not_found" }, 404)
    return c.json({ data: row })
  })
  .put("/voyages/:key", async (c) => {
    const parsed = parseUnifiedKey(c.req.param("key"))
    if (parsed.kind === "invalid") return c.json(invalidKey(parsed.raw), 400)
    if (parsed.kind === "external") return c.json(externalNotSupported(parsed.provider), 501)
    const data = await parseJsonBody(c, updateVoyageSchema)
    const row = await chartersService.updateVoyage(c.get("db"), parsed.id, data)
    if (!row) return c.json({ error: "not_found" }, 404)
    return c.json({ data: row })
  })
  .put("/voyages/:key/suites/bulk", async (c) => {
    const parsed = parseUnifiedKey(c.req.param("key"))
    if (parsed.kind === "invalid") return c.json(invalidKey(parsed.raw), 400)
    if (parsed.kind === "external") return c.json(externalNotSupported(parsed.provider), 501)
    const payload = await parseJsonBody(c, replaceVoyageSuitesSchema.omit({ voyageId: true }))
    const rows = await chartersService.replaceVoyageSuites(c.get("db"), {
      voyageId: parsed.id,
      suites: payload.suites,
    })
    return c.json({ data: rows })
  })
  .put("/voyages/:key/schedule/bulk", async (c) => {
    const parsed = parseUnifiedKey(c.req.param("key"))
    if (parsed.kind === "invalid") return c.json(invalidKey(parsed.raw), 400)
    if (parsed.kind === "external") return c.json(externalNotSupported(parsed.provider), 501)
    const payload = await parseJsonBody(c, replaceVoyageScheduleSchema.omit({ voyageId: true }))
    const rows = await chartersService.replaceVoyageSchedule(c.get("db"), {
      voyageId: parsed.id,
      days: payload.days,
    })
    return c.json({ data: rows })
  })
  // --- per-suite quote + bookings ---
  .post("/voyages/:key/quote/per-suite", async (c) => {
    const parsed = parseUnifiedKey(c.req.param("key"))
    if (parsed.kind === "invalid") return c.json(invalidKey(parsed.raw), 400)
    if (parsed.kind === "external") return c.json(externalNotSupported(parsed.provider), 501)
    const payload = await parseJsonBody(c, perSuiteQuotePayload)
    const quote = await pricingService.quotePerSuite(c.get("db"), {
      suiteId: payload.suiteId,
      currency: payload.currency,
    })
    return c.json({ data: quote })
  })
  .post("/voyages/:key/bookings/per-suite", async (c) => {
    const parsed = parseUnifiedKey(c.req.param("key"))
    if (parsed.kind === "invalid") return c.json(invalidKey(parsed.raw), 400)
    if (parsed.kind === "external") return c.json(externalNotSupported(parsed.provider), 501)
    const payload = await parseJsonBody(c, createPerSuiteBookingPayload)
    if (payload.voyageId !== parsed.id) {
      return c.json(
        { error: "voyage_id_mismatch", detail: "URL key and payload voyageId must match" },
        400,
      )
    }
    const result = await chartersBookingService.createPerSuiteBooking(
      c.get("db"),
      payload,
      c.get("userId"),
    )
    return c.json({ data: result }, 201)
  })
  // --- whole-yacht quote + bookings ---
  .post("/voyages/:key/quote/whole-yacht", async (c) => {
    const parsed = parseUnifiedKey(c.req.param("key"))
    if (parsed.kind === "invalid") return c.json(invalidKey(parsed.raw), 400)
    if (parsed.kind === "external") return c.json(externalNotSupported(parsed.provider), 501)
    const payload = await parseJsonBody(c, wholeYachtQuotePayload)
    const quote = await pricingService.quoteWholeYacht(c.get("db"), {
      voyageId: parsed.id,
      currency: payload.currency,
    })
    return c.json({ data: quote })
  })
  .post("/voyages/:key/bookings/whole-yacht", async (c) => {
    const parsed = parseUnifiedKey(c.req.param("key"))
    if (parsed.kind === "invalid") return c.json(invalidKey(parsed.raw), 400)
    if (parsed.kind === "external") return c.json(externalNotSupported(parsed.provider), 501)
    const payload = await parseJsonBody(c, createWholeYachtBookingPayload)
    if (payload.voyageId !== parsed.id) {
      return c.json(
        { error: "voyage_id_mismatch", detail: "URL key and payload voyageId must match" },
        400,
      )
    }
    const result = await chartersBookingService.createWholeYachtBooking(
      c.get("db"),
      payload,
      c.get("userId"),
    )
    return c.json({ data: result }, 201)
  })
  .post("/bookings/:bookingId/myba", async (c) => {
    const contractsService = c.get("chartersContractsService")
    if (!contractsService) {
      return c.json(
        {
          error: "contracts_service_unavailable",
          detail:
            "MYBA generation requires the legal/contracts service to be wired into Hono context as `chartersContractsService` at app boot.",
        },
        501,
      )
    }
    const payload = await parseJsonBody(c, generateMybaPayload)
    const result = await mybaService.generateContract(c.get("db"), contractsService, {
      bookingId: c.req.param("bookingId"),
      templateIdOverride: payload.templateIdOverride ?? null,
      language: payload.language,
      extraVariables: payload.extraVariables,
      title: payload.title,
    })
    if (result.status === "not_found") return c.json({ error: result.status }, 404)
    if (result.status === "wrong_mode") return c.json({ error: result.status, ...result }, 409)
    if (result.status === "no_template") return c.json({ error: result.status }, 412)
    if (result.status === "template_not_found")
      return c.json({ error: result.status, ...result }, 404)
    if (result.status === "contract_create_failed") return c.json({ error: result.status }, 500)
    return c.json({
      data: { contractId: result.contractId, charterDetails: result.detail },
    })
  })
  // --- yachts ---
  .get("/yachts", async (c) => {
    const query = parseQuery(c, yachtListQuerySchema)
    const result = await chartersService.listYachts(c.get("db"), query)
    return c.json(result)
  })
  .post("/yachts", async (c) => {
    const data = await parseJsonBody(c, insertYachtSchema)
    const row = await chartersService.createYacht(c.get("db"), data)
    return c.json({ data: row }, 201)
  })
  .get("/yachts/:key", async (c) => {
    const parsed = parseUnifiedKey(c.req.param("key"))
    if (parsed.kind === "invalid") return c.json(invalidKey(parsed.raw), 400)
    if (parsed.kind === "external") return c.json(externalNotSupported(parsed.provider), 501)
    const row = await chartersService.getYachtById(c.get("db"), parsed.id)
    if (!row) return c.json({ error: "not_found" }, 404)
    return c.json({ data: row })
  })
  .put("/yachts/:key", async (c) => {
    const parsed = parseUnifiedKey(c.req.param("key"))
    if (parsed.kind === "invalid") return c.json(invalidKey(parsed.raw), 400)
    if (parsed.kind === "external") return c.json(externalNotSupported(parsed.provider), 501)
    const data = await parseJsonBody(c, updateYachtSchema)
    const row = await chartersService.updateYacht(c.get("db"), parsed.id, data)
    if (!row) return c.json({ error: "not_found" }, 404)
    return c.json({ data: row })
  })

export type ChartersAdminRoutes = typeof chartersAdminRoutes
