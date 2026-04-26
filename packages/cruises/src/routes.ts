import { parseJsonBody, parseQuery } from "@voyantjs/hono"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { Hono } from "hono"
import { z } from "zod"

import { cruisesService } from "./service.js"
import {
  type CreateCruiseBookingInput,
  type CreateCruisePartyBookingInput,
  cruisesBookingService,
} from "./service-bookings.js"
import { pricingService } from "./service-pricing.js"
import {
  insertCabinCategorySchema,
  insertCabinSchema,
  insertDeckSchema,
  insertShipSchema,
  shipListQuerySchema,
  updateCabinCategorySchema,
  updateCabinSchema,
  updateDeckSchema,
  updateShipSchema,
} from "./validation-cabins.js"
import {
  cruiseListQuerySchema,
  insertCruiseSchema,
  insertSailingSchema,
  sailingListQuerySchema,
  updateCruiseSchema,
  updateSailingSchema,
} from "./validation-core.js"
import { replaceCruiseDaysSchema, replaceSailingDaysSchema } from "./validation-itinerary.js"
import {
  insertPriceComponentSchema,
  insertPriceSchema,
  priceListQuerySchema,
  updatePriceSchema,
} from "./validation-pricing.js"

// ---------- Hono env ----------

type Env = {
  Variables: {
    db: PostgresJsDatabase
    userId?: string
  }
}

// ---------- unified key parsing ----------

import { parseUnifiedKey } from "./lib/key.js"

// Sentinel response shape for non-local keys. Caller threads through; happens to
// always be `c.json({...}, status)` but keeping the helper centralizes the messaging.
function externalNotYetSupported(provider: string) {
  return {
    error: "external_adapter_not_implemented",
    detail: `Adapter '${provider}' will be supported in phase 3 (see docs/architecture/cruises-module.md §10).`,
  }
}

const invalidKey = (raw: string) => ({
  error: "invalid_key",
  detail: `Unrecognized cruise key: ${raw}`,
})

// ---------- payload schemas for create-booking endpoints ----------

const createBookingPayloadSchema = z.object({
  sailingId: z.string(),
  cabinCategoryId: z.string(),
  cabinId: z.string().optional().nullable(),
  occupancy: z.number().int().min(1).max(8),
  fareCode: z.string().optional().nullable(),
  mode: z.enum(["inquiry", "reserve"]).optional(),
  personId: z.string().optional().nullable(),
  organizationId: z.string().optional().nullable(),
  contact: z.object({
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
  }),
  passengers: z
    .array(
      z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email().optional().nullable(),
        phone: z.string().optional().nullable(),
        travelerCategory: z
          .enum(["adult", "child", "infant", "senior", "other"])
          .optional()
          .nullable(),
        preferredLanguage: z.string().optional().nullable(),
        specialRequests: z.string().optional().nullable(),
        personId: z.string().optional().nullable(),
        isPrimary: z.boolean().optional(),
        notes: z.string().optional().nullable(),
      }),
    )
    .min(1),
  notes: z.string().optional().nullable(),
}) satisfies z.ZodType<CreateCruiseBookingInput>

const createPartyBookingPayloadSchema = z.object({
  sailingId: z.string(),
  cabins: z
    .array(
      z.object({
        cabinCategoryId: z.string(),
        cabinId: z.string().optional().nullable(),
        occupancy: z.number().int().min(1).max(8),
        fareCode: z.string().optional().nullable(),
        passengers: z
          .array(
            z.object({
              firstName: z.string().min(1),
              lastName: z.string().min(1),
              email: z.string().email().optional().nullable(),
              phone: z.string().optional().nullable(),
              travelerCategory: z
                .enum(["adult", "child", "infant", "senior", "other"])
                .optional()
                .nullable(),
              preferredLanguage: z.string().optional().nullable(),
              specialRequests: z.string().optional().nullable(),
              personId: z.string().optional().nullable(),
              isPrimary: z.boolean().optional(),
              notes: z.string().optional().nullable(),
            }),
          )
          .min(1),
        notes: z.string().optional().nullable(),
      }),
    )
    .min(2)
    .max(20),
  leadPersonId: z.string().optional().nullable(),
  organizationId: z.string().optional().nullable(),
  contact: z.object({
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
  }),
  mode: z.enum(["inquiry", "reserve"]).optional(),
  label: z.string().optional(),
  notes: z.string().optional().nullable(),
}) satisfies z.ZodType<CreateCruisePartyBookingInput>

const quotePayloadSchema = z.object({
  cabinCategoryId: z.string(),
  occupancy: z.number().int().min(1).max(8),
  guestCount: z.number().int().min(1).max(8),
  fareCode: z.string().optional().nullable(),
})

// ---------- routes ----------

export const cruiseAdminRoutes = new Hono<Env>()
  // --- list / unified detail ---
  .get("/", async (c) => {
    const query = parseQuery(c, cruiseListQuerySchema)
    const result = await cruisesService.listCruises(c.get("db"), query)
    return c.json(result)
  })
  .post("/", async (c) => {
    const data = await parseJsonBody(c, insertCruiseSchema)
    const row = await cruisesService.createCruise(c.get("db"), data)
    return c.json({ data: row }, 201)
  })
  // --- per-cruise (parses unified key, dispatches local or external) ---
  .get("/:key", async (c) => {
    const parsed = parseUnifiedKey(c.req.param("key"))
    if (parsed.kind === "external") return c.json(externalNotYetSupported(parsed.provider), 501)
    if (parsed.kind === "invalid") return c.json(invalidKey(parsed.raw), 400)
    const includeRaw = c.req.query("include") ?? ""
    const includes = new Set(
      includeRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    )
    const row = await cruisesService.getCruiseById(c.get("db"), parsed.id, {
      withSailings: includes.has("sailings"),
      withDays: includes.has("days"),
    })
    if (!row) return c.json({ error: "not_found" }, 404)
    return c.json({ data: row })
  })
  .put("/:key", async (c) => {
    const parsed = parseUnifiedKey(c.req.param("key"))
    if (parsed.kind === "external") return c.json(externalNotYetSupported(parsed.provider), 409)
    if (parsed.kind === "invalid") return c.json(invalidKey(parsed.raw), 400)
    const data = await parseJsonBody(c, updateCruiseSchema)
    const row = await cruisesService.updateCruise(c.get("db"), parsed.id, data)
    if (!row) return c.json({ error: "not_found" }, 404)
    return c.json({ data: row })
  })
  .delete("/:key", async (c) => {
    const parsed = parseUnifiedKey(c.req.param("key"))
    if (parsed.kind === "external") return c.json(externalNotYetSupported(parsed.provider), 409)
    if (parsed.kind === "invalid") return c.json(invalidKey(parsed.raw), 400)
    const row = await cruisesService.archiveCruise(c.get("db"), parsed.id)
    if (!row) return c.json({ error: "not_found" }, 404)
    return c.json({ data: row })
  })
  .post("/:key/aggregates/recompute", async (c) => {
    const parsed = parseUnifiedKey(c.req.param("key"))
    if (parsed.kind === "external") return c.json(externalNotYetSupported(parsed.provider), 409)
    if (parsed.kind === "invalid") return c.json(invalidKey(parsed.raw), 400)
    const row = await cruisesService.recomputeCruiseAggregates(c.get("db"), parsed.id)
    if (!row) return c.json({ error: "not_found" }, 404)
    return c.json({ data: row })
  })
  .get("/:key/sailings", async (c) => {
    const parsed = parseUnifiedKey(c.req.param("key"))
    if (parsed.kind === "external") return c.json(externalNotYetSupported(parsed.provider), 501)
    if (parsed.kind === "invalid") return c.json(invalidKey(parsed.raw), 400)
    const result = await cruisesService.listSailings(c.get("db"), {
      cruiseId: parsed.id,
      limit: 100,
      offset: 0,
    })
    return c.json(result)
  })
  .put("/:key/days/bulk", async (c) => {
    const parsed = parseUnifiedKey(c.req.param("key"))
    if (parsed.kind === "external") return c.json(externalNotYetSupported(parsed.provider), 409)
    if (parsed.kind === "invalid") return c.json(invalidKey(parsed.raw), 400)
    const payload = await parseJsonBody(c, replaceCruiseDaysSchema.omit({ cruiseId: true }))
    const days = await cruisesService.replaceCruiseDays(c.get("db"), {
      cruiseId: parsed.id,
      days: payload.days,
    })
    return c.json({ data: days })
  })
  // --- external-only stubs (phase 3) ---
  .post("/:key/refresh", async (c) => {
    const parsed = parseUnifiedKey(c.req.param("key"))
    if (parsed.kind !== "external") return c.json({ error: "local_cruise_no_refresh" }, 400)
    return c.json(externalNotYetSupported(parsed.provider), 501)
  })
  .post("/:key/detach", async (c) => {
    const parsed = parseUnifiedKey(c.req.param("key"))
    if (parsed.kind !== "external") return c.json({ error: "local_cruise_no_detach" }, 400)
    return c.json(externalNotYetSupported(parsed.provider), 501)
  })
  // --- sailings ---
  .get("/sailings", async (c) => {
    const query = parseQuery(c, sailingListQuerySchema)
    const result = await cruisesService.listSailings(c.get("db"), query)
    return c.json(result)
  })
  .get("/sailings/:key", async (c) => {
    const parsed = parseUnifiedKey(c.req.param("key"))
    if (parsed.kind === "external") return c.json(externalNotYetSupported(parsed.provider), 501)
    if (parsed.kind === "invalid") return c.json(invalidKey(parsed.raw), 400)
    const includeRaw = c.req.query("include") ?? ""
    const includes = new Set(
      includeRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    )
    const row = await cruisesService.getSailingById(c.get("db"), parsed.id, {
      withPricing: includes.has("pricing"),
      withItinerary: includes.has("itinerary"),
    })
    if (!row) return c.json({ error: "not_found" }, 404)
    return c.json({ data: row })
  })
  .post("/sailings", async (c) => {
    const data = await parseJsonBody(c, insertSailingSchema)
    const row = await cruisesService.upsertSailing(c.get("db"), data)
    return c.json({ data: row }, 201)
  })
  .put("/sailings/:key", async (c) => {
    const parsed = parseUnifiedKey(c.req.param("key"))
    if (parsed.kind === "external") return c.json(externalNotYetSupported(parsed.provider), 409)
    if (parsed.kind === "invalid") return c.json(invalidKey(parsed.raw), 400)
    const data = await parseJsonBody(c, updateSailingSchema)
    const row = await cruisesService.updateSailing(c.get("db"), parsed.id, data)
    if (!row) return c.json({ error: "not_found" }, 404)
    return c.json({ data: row })
  })
  .get("/sailings/:key/itinerary", async (c) => {
    const parsed = parseUnifiedKey(c.req.param("key"))
    if (parsed.kind === "external") return c.json(externalNotYetSupported(parsed.provider), 501)
    if (parsed.kind === "invalid") return c.json(invalidKey(parsed.raw), 400)
    const days = await cruisesService.getEffectiveItinerary(c.get("db"), parsed.id)
    return c.json({ data: days })
  })
  .put("/sailings/:key/days/bulk", async (c) => {
    const parsed = parseUnifiedKey(c.req.param("key"))
    if (parsed.kind === "external") return c.json(externalNotYetSupported(parsed.provider), 409)
    if (parsed.kind === "invalid") return c.json(invalidKey(parsed.raw), 400)
    const payload = await parseJsonBody(c, replaceSailingDaysSchema.omit({ sailingId: true }))
    const days = await cruisesService.replaceSailingDays(c.get("db"), {
      sailingId: parsed.id,
      days: payload.days,
    })
    return c.json({ data: days })
  })
  .put("/sailings/:key/pricing/bulk", async (c) => {
    const parsed = parseUnifiedKey(c.req.param("key"))
    if (parsed.kind === "external") return c.json(externalNotYetSupported(parsed.provider), 409)
    if (parsed.kind === "invalid") return c.json(invalidKey(parsed.raw), 400)
    const payload = await parseJsonBody(
      c,
      z.object({
        prices: z.array(
          insertPriceSchema.extend({
            components: z.array(insertPriceComponentSchema.omit({ priceId: true })).optional(),
          }),
        ),
      }),
    )
    const data = await cruisesService.replaceSailingPricing(c.get("db"), parsed.id, payload)
    return c.json({ data })
  })
  .post("/sailings/:key/quote", async (c) => {
    const parsed = parseUnifiedKey(c.req.param("key"))
    if (parsed.kind === "external") return c.json(externalNotYetSupported(parsed.provider), 501)
    if (parsed.kind === "invalid") return c.json(invalidKey(parsed.raw), 400)
    const payload = await parseJsonBody(c, quotePayloadSchema)
    const quote = await pricingService.assembleQuote(c.get("db"), {
      sailingId: parsed.id,
      cabinCategoryId: payload.cabinCategoryId,
      occupancy: payload.occupancy,
      guestCount: payload.guestCount,
      fareCode: payload.fareCode ?? null,
    })
    return c.json({ data: quote })
  })
  // --- bookings (single + party) ---
  .post("/sailings/:key/bookings", async (c) => {
    const parsed = parseUnifiedKey(c.req.param("key"))
    if (parsed.kind === "external") return c.json(externalNotYetSupported(parsed.provider), 501)
    if (parsed.kind === "invalid") return c.json(invalidKey(parsed.raw), 400)
    const payload = await parseJsonBody(c, createBookingPayloadSchema)
    if (payload.sailingId !== parsed.id) {
      return c.json(
        { error: "sailing_id_mismatch", detail: "URL key and payload sailingId must match" },
        400,
      )
    }
    const result = await cruisesBookingService.createCruiseBooking(
      c.get("db"),
      payload,
      c.get("userId"),
    )
    return c.json({ data: result }, 201)
  })
  .post("/sailings/:key/party-bookings", async (c) => {
    const parsed = parseUnifiedKey(c.req.param("key"))
    if (parsed.kind === "external") return c.json(externalNotYetSupported(parsed.provider), 501)
    if (parsed.kind === "invalid") return c.json(invalidKey(parsed.raw), 400)
    const payload = await parseJsonBody(c, createPartyBookingPayloadSchema)
    if (payload.sailingId !== parsed.id) {
      return c.json(
        { error: "sailing_id_mismatch", detail: "URL key and payload sailingId must match" },
        400,
      )
    }
    const result = await cruisesBookingService.createCruisePartyBooking(
      c.get("db"),
      payload,
      c.get("userId"),
    )
    return c.json({ data: result }, 201)
  })
  // --- prices (read endpoints; mutations go through bulk replace on the sailing) ---
  .get("/prices", async (c) => {
    const query = parseQuery(c, priceListQuerySchema)
    const result = await cruisesService.listPrices(c.get("db"), query)
    return c.json(result)
  })
  .post("/prices", async (c) => {
    const data = await parseJsonBody(c, insertPriceSchema)
    const row = await cruisesService.createPrice(c.get("db"), data)
    return c.json({ data: row }, 201)
  })
  .put("/prices/:priceId", async (c) => {
    const data = await parseJsonBody(c, updatePriceSchema)
    const row = await cruisesService.updatePrice(c.get("db"), c.req.param("priceId"), data)
    if (!row) return c.json({ error: "not_found" }, 404)
    return c.json({ data: row })
  })
  // --- ships ---
  .get("/ships", async (c) => {
    const query = parseQuery(c, shipListQuerySchema)
    const result = await cruisesService.listShips(c.get("db"), query)
    return c.json(result)
  })
  .post("/ships", async (c) => {
    const data = await parseJsonBody(c, insertShipSchema)
    const row = await cruisesService.createShip(c.get("db"), data)
    return c.json({ data: row }, 201)
  })
  .get("/ships/:key", async (c) => {
    const parsed = parseUnifiedKey(c.req.param("key"))
    if (parsed.kind === "external") return c.json(externalNotYetSupported(parsed.provider), 501)
    if (parsed.kind === "invalid") return c.json(invalidKey(parsed.raw), 400)
    const row = await cruisesService.getShipById(c.get("db"), parsed.id)
    if (!row) return c.json({ error: "not_found" }, 404)
    return c.json({ data: row })
  })
  .put("/ships/:key", async (c) => {
    const parsed = parseUnifiedKey(c.req.param("key"))
    if (parsed.kind === "external") return c.json(externalNotYetSupported(parsed.provider), 409)
    if (parsed.kind === "invalid") return c.json(invalidKey(parsed.raw), 400)
    const data = await parseJsonBody(c, updateShipSchema)
    const row = await cruisesService.updateShip(c.get("db"), parsed.id, data)
    if (!row) return c.json({ error: "not_found" }, 404)
    return c.json({ data: row })
  })
  .get("/ships/:key/decks", async (c) => {
    const parsed = parseUnifiedKey(c.req.param("key"))
    if (parsed.kind === "external") return c.json(externalNotYetSupported(parsed.provider), 501)
    if (parsed.kind === "invalid") return c.json(invalidKey(parsed.raw), 400)
    const decks = await cruisesService.listShipDecks(c.get("db"), parsed.id)
    return c.json({ data: decks })
  })
  .post("/ships/:key/decks", async (c) => {
    const parsed = parseUnifiedKey(c.req.param("key"))
    if (parsed.kind === "external") return c.json(externalNotYetSupported(parsed.provider), 409)
    if (parsed.kind === "invalid") return c.json(invalidKey(parsed.raw), 400)
    const data = await parseJsonBody(c, insertDeckSchema.omit({ shipId: true }))
    const row = await cruisesService.upsertDeck(c.get("db"), { ...data, shipId: parsed.id })
    return c.json({ data: row }, 201)
  })
  .put("/decks/:deckId", async (c) => {
    const data = await parseJsonBody(c, updateDeckSchema)
    const row = await cruisesService.updateDeck(c.get("db"), c.req.param("deckId"), data)
    if (!row) return c.json({ error: "not_found" }, 404)
    return c.json({ data: row })
  })
  .get("/ships/:key/categories", async (c) => {
    const parsed = parseUnifiedKey(c.req.param("key"))
    if (parsed.kind === "external") return c.json(externalNotYetSupported(parsed.provider), 501)
    if (parsed.kind === "invalid") return c.json(invalidKey(parsed.raw), 400)
    const categories = await cruisesService.listShipCabinCategories(c.get("db"), parsed.id)
    return c.json({ data: categories })
  })
  .put("/ships/:key/categories/bulk", async (c) => {
    const parsed = parseUnifiedKey(c.req.param("key"))
    if (parsed.kind === "external") return c.json(externalNotYetSupported(parsed.provider), 409)
    if (parsed.kind === "invalid") return c.json(invalidKey(parsed.raw), 400)
    const payload = await parseJsonBody(
      c,
      z.object({ categories: z.array(insertCabinCategorySchema) }),
    )
    const out: Awaited<ReturnType<typeof cruisesService.upsertCabinCategory>>[] = []
    for (const cat of payload.categories) {
      const row = await cruisesService.upsertCabinCategory(c.get("db"), {
        ...cat,
        shipId: parsed.id,
      })
      out.push(row)
    }
    return c.json({ data: out })
  })
  .put("/categories/:categoryId", async (c) => {
    const data = await parseJsonBody(c, updateCabinCategorySchema)
    const row = await cruisesService.updateCabinCategory(
      c.get("db"),
      c.req.param("categoryId"),
      data,
    )
    if (!row) return c.json({ error: "not_found" }, 404)
    return c.json({ data: row })
  })
  .get("/categories/:categoryId/cabins", async (c) => {
    const cabins = await cruisesService.listCabinsByCategory(c.get("db"), c.req.param("categoryId"))
    return c.json({ data: cabins })
  })
  .put("/categories/:categoryId/cabins/bulk", async (c) => {
    const categoryId = c.req.param("categoryId")
    const payload = await parseJsonBody(
      c,
      z.object({ cabins: z.array(insertCabinSchema.omit({ categoryId: true })) }),
    )
    const out: Awaited<ReturnType<typeof cruisesService.upsertCabin>>[] = []
    for (const cabin of payload.cabins) {
      const row = await cruisesService.upsertCabin(c.get("db"), { ...cabin, categoryId })
      out.push(row)
    }
    return c.json({ data: out })
  })
  .put("/cabins/:cabinId", async (c) => {
    const data = await parseJsonBody(c, updateCabinSchema)
    const row = await cruisesService.updateCabin(c.get("db"), c.req.param("cabinId"), data)
    if (!row) return c.json({ error: "not_found" }, 404)
    return c.json({ data: row })
  })
  // --- search-index management (phase 4 functionality stubbed for shape) ---
  .put("/search-index/bulk", (c) => {
    return c.json(
      { error: "not_implemented", detail: "Search index population lands in phase 4" },
      501,
    )
  })
  .delete("/search-index/:crsiId", (c) => {
    return c.json(
      { error: "not_implemented", detail: "Search index population lands in phase 4" },
      501,
    )
  })
  .post("/search-index/rebuild", (c) => {
    return c.json(
      { error: "not_implemented", detail: "Search index population lands in phase 4" },
      501,
    )
  })

export type CruiseAdminRoutes = typeof cruiseAdminRoutes
