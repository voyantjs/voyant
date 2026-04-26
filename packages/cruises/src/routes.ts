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
import { cruisesSearchService } from "./service-search.js"
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
  insertEnrichmentProgramSchema,
  replaceEnrichmentProgramsSchema,
  updateEnrichmentProgramSchema,
} from "./validation-content.js"
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

import type { CruiseAdapter, SourceRef } from "./adapters/index.js"
import { listCruiseAdapters, resolveCruiseAdapter } from "./adapters/registry.js"
import { type ParsedKey, parseUnifiedKey } from "./lib/key.js"
import { detachExternalCruise } from "./service-detach.js"

const adapterNotRegistered = (provider: string) => ({
  error: "adapter_not_registered",
  detail: `No CruiseAdapter registered for source provider '${provider}'. Register one at app startup via registerCruiseAdapter() — see docs/architecture/cruises-module.md §10.`,
})

const invalidKey = (raw: string) => ({
  error: "invalid_key",
  detail: `Unrecognized cruise key: ${raw}`,
})

/**
 * Resolve an external `<provider>:<ref>` key against the adapter registry.
 * Returns the adapter + a SourceRef constructed from the parsed key, or null
 * with a 404-equivalent error payload if the provider has no registered adapter.
 */
function resolveExternal(parsed: Extract<ParsedKey, { kind: "external" }>): {
  adapter: CruiseAdapter
  sourceRef: SourceRef
} | null {
  const adapter = resolveCruiseAdapter(parsed.provider)
  if (!adapter) return null
  return { adapter, sourceRef: { externalId: parsed.ref } }
}

function makeExternalKey(adapter: CruiseAdapter, ref: SourceRef): string {
  return `${adapter.name}:${ref.externalId}`
}

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
    const local = await cruisesService.listCruises(c.get("db"), query)
    const localItems = local.data.map((c) => ({
      source: "local" as const,
      sourceProvider: null,
      sourceRef: null,
      key: c.id,
      cruise: c,
    }))
    // Fan out to every registered adapter in parallel via Promise.allSettled —
    // one slow or failing adapter doesn't block the rest. Each adapter's call
    // is independent so there's no concurrency-control concern at this layer
    // (adapters that need rate limiting handle it inside their own implementation).
    const adapters = listCruiseAdapters()
    const settled = await Promise.allSettled(
      adapters.map((adapter) =>
        adapter
          .listEntries({ limit: query.limit })
          .then((result) => ({ adapter, result }) as const),
      ),
    )
    const adapterItems: Array<{
      source: "external"
      sourceProvider: string
      sourceRef: SourceRef
      key: string
      cruise: unknown
    }> = []
    const adapterErrors: Array<{ adapter: string; error: string }> = []
    for (let i = 0; i < settled.length; i++) {
      const outcome = settled[i]
      const adapter = adapters[i]
      if (!outcome || !adapter) continue
      if (outcome.status === "rejected") {
        adapterErrors.push({
          adapter: adapter.name,
          error: outcome.reason instanceof Error ? outcome.reason.message : String(outcome.reason),
        })
        continue
      }
      for (const entry of outcome.value.result.entries) {
        adapterItems.push({
          source: "external",
          sourceProvider: adapter.name,
          sourceRef: entry.sourceRef,
          key: makeExternalKey(adapter, entry.sourceRef),
          cruise: entry,
        })
      }
    }
    return c.json({
      data: [...localItems, ...adapterItems],
      total: local.total + adapterItems.length,
      localTotal: local.total,
      adapterCount: adapters.length,
      adapterErrors,
      limit: local.limit,
      offset: local.offset,
    })
  })
  .post("/", async (c) => {
    const data = await parseJsonBody(c, insertCruiseSchema)
    const row = await cruisesService.createCruise(c.get("db"), data)
    return c.json({ data: row }, 201)
  })
  // --- per-cruise (parses unified key, dispatches local or external) ---
  .get("/:key", async (c) => {
    const parsed = parseUnifiedKey(c.req.param("key"))
    if (parsed.kind === "invalid") return c.json(invalidKey(parsed.raw), 400)
    if (parsed.kind === "external") {
      const ext = resolveExternal(parsed)
      if (!ext) return c.json(adapterNotRegistered(parsed.provider), 501)
      const cruise = await ext.adapter.fetchCruise(ext.sourceRef)
      if (!cruise) return c.json({ error: "not_found" }, 404)
      return c.json({
        data: {
          source: "external",
          sourceProvider: ext.adapter.name,
          sourceRef: cruise.sourceRef,
          cruise,
        },
      })
    }
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
    return c.json({
      data: {
        source: "local",
        sourceProvider: null,
        sourceRef: null,
        cruise: row,
      },
    })
  })
  .put("/:key", async (c) => {
    const parsed = parseUnifiedKey(c.req.param("key"))
    if (parsed.kind === "external") {
      return c.json(
        {
          error: "external_cruise_read_only",
          detail: `External cruise from '${parsed.provider}' cannot be edited locally. Edit at the upstream system, or POST /:key/detach to convert to a local cruise first.`,
        },
        409,
      )
    }
    if (parsed.kind === "invalid") return c.json(invalidKey(parsed.raw), 400)
    const data = await parseJsonBody(c, updateCruiseSchema)
    const row = await cruisesService.updateCruise(c.get("db"), parsed.id, data)
    if (!row) return c.json({ error: "not_found" }, 404)
    return c.json({ data: row })
  })
  .delete("/:key", async (c) => {
    const parsed = parseUnifiedKey(c.req.param("key"))
    if (parsed.kind === "external") {
      return c.json(
        {
          error: "external_cruise_read_only",
          detail: "External cruises can't be deleted locally.",
        },
        409,
      )
    }
    if (parsed.kind === "invalid") return c.json(invalidKey(parsed.raw), 400)
    const row = await cruisesService.archiveCruise(c.get("db"), parsed.id)
    if (!row) return c.json({ error: "not_found" }, 404)
    return c.json({ data: row })
  })
  .post("/:key/aggregates/recompute", async (c) => {
    const parsed = parseUnifiedKey(c.req.param("key"))
    if (parsed.kind === "external") {
      return c.json(
        { error: "external_cruise_read_only", detail: "Aggregates only apply to local cruises." },
        409,
      )
    }
    if (parsed.kind === "invalid") return c.json(invalidKey(parsed.raw), 400)
    const row = await cruisesService.recomputeCruiseAggregates(c.get("db"), parsed.id)
    if (!row) return c.json({ error: "not_found" }, 404)
    return c.json({ data: row })
  })
  .get("/:key/sailings", async (c) => {
    const parsed = parseUnifiedKey(c.req.param("key"))
    if (parsed.kind === "invalid") return c.json(invalidKey(parsed.raw), 400)
    if (parsed.kind === "external") {
      const ext = resolveExternal(parsed)
      if (!ext) return c.json(adapterNotRegistered(parsed.provider), 501)
      const sailings = await ext.adapter.listSailingsForCruise(ext.sourceRef)
      return c.json({
        data: sailings.map((s) => ({
          source: "external",
          sourceProvider: ext.adapter.name,
          key: makeExternalKey(ext.adapter, s.sourceRef),
          sailing: s,
        })),
        total: sailings.length,
      })
    }
    const result = await cruisesService.listSailings(c.get("db"), {
      cruiseId: parsed.id,
      limit: 100,
      offset: 0,
    })
    return c.json(result)
  })
  .put("/:key/days/bulk", async (c) => {
    const parsed = parseUnifiedKey(c.req.param("key"))
    if (parsed.kind === "external") {
      return c.json({ error: "external_cruise_read_only" }, 409)
    }
    if (parsed.kind === "invalid") return c.json(invalidKey(parsed.raw), 400)
    const payload = await parseJsonBody(c, replaceCruiseDaysSchema.omit({ cruiseId: true }))
    const days = await cruisesService.replaceCruiseDays(c.get("db"), {
      cruiseId: parsed.id,
      days: payload.days,
    })
    return c.json({ data: days })
  })
  // --- external-only operations (now real, phase 3) ---
  .post("/:key/refresh", async (c) => {
    const parsed = parseUnifiedKey(c.req.param("key"))
    if (parsed.kind !== "external") return c.json({ error: "local_cruise_no_refresh" }, 400)
    const ext = resolveExternal(parsed)
    if (!ext) return c.json(adapterNotRegistered(parsed.provider), 501)
    const cruise = await ext.adapter.fetchCruise(ext.sourceRef)
    if (!cruise) return c.json({ error: "not_found" }, 404)
    return c.json({
      data: {
        source: "external",
        sourceProvider: ext.adapter.name,
        sourceRef: cruise.sourceRef,
        cruise,
        refreshedAt: new Date().toISOString(),
      },
    })
  })
  .post("/:key/detach", async (c) => {
    const parsed = parseUnifiedKey(c.req.param("key"))
    if (parsed.kind !== "external") return c.json({ error: "local_cruise_no_detach" }, 400)
    const ext = resolveExternal(parsed)
    if (!ext) return c.json(adapterNotRegistered(parsed.provider), 501)
    const cruise = await detachExternalCruise(c.get("db"), ext.adapter, ext.sourceRef)
    return c.json({ data: cruise }, 201)
  })
  // --- enrichment programs (expedition-focused; local cruises only) ---
  .get("/:key/enrichment", async (c) => {
    const parsed = parseUnifiedKey(c.req.param("key"))
    if (parsed.kind === "external") {
      const ext = resolveExternal(parsed)
      if (!ext) return c.json(adapterNotRegistered(parsed.provider), 501)
      // Adapters surface enrichment via the rich cruise detail; we return an
      // empty list here for shape compatibility. Templates that need richer
      // external enrichment should read from adapter.fetchCruise() directly.
      return c.json({ data: [] })
    }
    if (parsed.kind === "invalid") return c.json(invalidKey(parsed.raw), 400)
    const programs = await cruisesService.listEnrichmentPrograms(c.get("db"), parsed.id)
    return c.json({ data: programs })
  })
  .post("/:key/enrichment", async (c) => {
    const parsed = parseUnifiedKey(c.req.param("key"))
    if (parsed.kind === "external") return c.json({ error: "external_cruise_read_only" }, 409)
    if (parsed.kind === "invalid") return c.json(invalidKey(parsed.raw), 400)
    const data = await parseJsonBody(c, insertEnrichmentProgramSchema.omit({ cruiseId: true }))
    const row = await cruisesService.createEnrichmentProgram(c.get("db"), {
      ...data,
      cruiseId: parsed.id,
    })
    return c.json({ data: row }, 201)
  })
  .put("/:key/enrichment/bulk", async (c) => {
    const parsed = parseUnifiedKey(c.req.param("key"))
    if (parsed.kind === "external") return c.json({ error: "external_cruise_read_only" }, 409)
    if (parsed.kind === "invalid") return c.json(invalidKey(parsed.raw), 400)
    const payload = await parseJsonBody(c, replaceEnrichmentProgramsSchema.omit({ cruiseId: true }))
    const rows = await cruisesService.replaceEnrichmentPrograms(c.get("db"), {
      cruiseId: parsed.id,
      programs: payload.programs,
    })
    return c.json({ data: rows })
  })
  .put("/enrichment/:programId", async (c) => {
    const data = await parseJsonBody(c, updateEnrichmentProgramSchema)
    const row = await cruisesService.updateEnrichmentProgram(
      c.get("db"),
      c.req.param("programId"),
      data,
    )
    if (!row) return c.json({ error: "not_found" }, 404)
    return c.json({ data: row })
  })
  .delete("/enrichment/:programId", async (c) => {
    const ok = await cruisesService.deleteEnrichmentProgram(c.get("db"), c.req.param("programId"))
    if (!ok) return c.json({ error: "not_found" }, 404)
    return c.body(null, 204)
  })
  // --- sailings ---
  .get("/sailings", async (c) => {
    const query = parseQuery(c, sailingListQuerySchema)
    const result = await cruisesService.listSailings(c.get("db"), query)
    return c.json(result)
  })
  .get("/sailings/:key", async (c) => {
    const parsed = parseUnifiedKey(c.req.param("key"))
    if (parsed.kind === "invalid") return c.json(invalidKey(parsed.raw), 400)
    if (parsed.kind === "external") {
      const ext = resolveExternal(parsed)
      if (!ext) return c.json(adapterNotRegistered(parsed.provider), 501)
      const sailing = await ext.adapter.fetchSailing(ext.sourceRef)
      if (!sailing) return c.json({ error: "not_found" }, 404)
      const includeRaw = c.req.query("include") ?? ""
      const includes = new Set(
        includeRaw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      )
      const enriched: Record<string, unknown> = {
        source: "external",
        sourceProvider: ext.adapter.name,
        sourceRef: sailing.sourceRef,
        sailing,
      }
      if (includes.has("pricing")) {
        enriched.pricing = await ext.adapter.fetchSailingPricing(ext.sourceRef)
      }
      if (includes.has("itinerary")) {
        enriched.itinerary = await ext.adapter.fetchSailingItinerary(ext.sourceRef)
      }
      return c.json({ data: enriched })
    }
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
    if (parsed.kind === "external") return c.json({ error: "external_cruise_read_only" }, 409)
    if (parsed.kind === "invalid") return c.json(invalidKey(parsed.raw), 400)
    const data = await parseJsonBody(c, updateSailingSchema)
    const row = await cruisesService.updateSailing(c.get("db"), parsed.id, data)
    if (!row) return c.json({ error: "not_found" }, 404)
    return c.json({ data: row })
  })
  .get("/sailings/:key/itinerary", async (c) => {
    const parsed = parseUnifiedKey(c.req.param("key"))
    if (parsed.kind === "invalid") return c.json(invalidKey(parsed.raw), 400)
    if (parsed.kind === "external") {
      const ext = resolveExternal(parsed)
      if (!ext) return c.json(adapterNotRegistered(parsed.provider), 501)
      const days = await ext.adapter.fetchSailingItinerary(ext.sourceRef)
      return c.json({ data: days })
    }
    const days = await cruisesService.getEffectiveItinerary(c.get("db"), parsed.id)
    return c.json({ data: days })
  })
  .put("/sailings/:key/days/bulk", async (c) => {
    const parsed = parseUnifiedKey(c.req.param("key"))
    if (parsed.kind === "external") return c.json({ error: "external_cruise_read_only" }, 409)
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
    if (parsed.kind === "external") return c.json({ error: "external_cruise_read_only" }, 409)
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
    if (parsed.kind === "invalid") return c.json(invalidKey(parsed.raw), 400)
    const payload = await parseJsonBody(c, quotePayloadSchema)
    if (parsed.kind === "external") {
      const ext = resolveExternal(parsed)
      if (!ext) return c.json(adapterNotRegistered(parsed.provider), 501)
      // Fetch upstream pricing then compose locally — the cabinCategoryId in
      // the payload is interpreted as the upstream cabin category externalId.
      const prices = await ext.adapter.fetchSailingPricing(ext.sourceRef)
      const matching = prices.find(
        (p) =>
          p.cabinCategoryRef.externalId === payload.cabinCategoryId &&
          p.occupancy === payload.occupancy &&
          (!payload.fareCode || p.fareCode === payload.fareCode),
      )
      if (!matching) return c.json({ error: "no_matching_price" }, 404)
      const { composeQuote } = await import("./service-pricing.js")
      const quote = composeQuote({
        price: {
          pricePerPerson: matching.pricePerPerson,
          secondGuestPricePerPerson: matching.secondGuestPricePerPerson ?? null,
          singleSupplementPercent: matching.singleSupplementPercent ?? null,
          currency: matching.currency,
          fareCode: matching.fareCode ?? null,
          fareCodeName: matching.fareCodeName ?? null,
        },
        components: (matching.components ?? []).map((c) => ({
          kind: c.kind,
          label: c.label ?? null,
          amount: c.amount,
          currency: c.currency,
          direction: c.direction,
          perPerson: c.perPerson,
        })),
        occupancy: payload.occupancy,
        guestCount: payload.guestCount,
      })
      return c.json({ data: quote })
    }
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
    if (parsed.kind === "invalid") return c.json(invalidKey(parsed.raw), 400)
    if (parsed.kind === "external") {
      const ext = resolveExternal(parsed)
      if (!ext) return c.json(adapterNotRegistered(parsed.provider), 501)
      const payload = await parseJsonBody(c, createBookingPayloadSchema)
      const result = await cruisesBookingService.createExternalCruiseBooking(
        c.get("db"),
        {
          adapter: ext.adapter,
          sailingRef: ext.sourceRef,
          cabinCategoryRef: { externalId: payload.cabinCategoryId },
          cabinId: payload.cabinId ?? null,
          occupancy: payload.occupancy,
          fareCode: payload.fareCode ?? null,
          mode: payload.mode,
          personId: payload.personId ?? null,
          organizationId: payload.organizationId ?? null,
          contact: payload.contact,
          passengers: payload.passengers,
          notes: payload.notes ?? null,
        },
        c.get("userId"),
      )
      return c.json({ data: result }, 201)
    }
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
    if (parsed.kind === "invalid") return c.json(invalidKey(parsed.raw), 400)
    if (parsed.kind === "external") {
      // External party bookings deferred — most cruise lines don't expose a
      // multi-cabin atomic upstream commit; we'd have to implement the group
      // semantics by serial bookings + rollback. Out of v1 scope.
      return c.json(
        {
          error: "external_party_booking_not_supported",
          detail:
            "Multi-cabin party bookings against external adapters are not yet supported. Submit each cabin individually via POST /sailings/:key/bookings.",
        },
        501,
      )
    }
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
    if (parsed.kind === "invalid") return c.json(invalidKey(parsed.raw), 400)
    if (parsed.kind === "external") {
      const ext = resolveExternal(parsed)
      if (!ext) return c.json(adapterNotRegistered(parsed.provider), 501)
      const ship = await ext.adapter.fetchShip(ext.sourceRef)
      if (!ship) return c.json({ error: "not_found" }, 404)
      return c.json({
        data: {
          source: "external",
          sourceProvider: ext.adapter.name,
          sourceRef: ship.sourceRef,
          ship,
        },
      })
    }
    const row = await cruisesService.getShipById(c.get("db"), parsed.id)
    if (!row) return c.json({ error: "not_found" }, 404)
    return c.json({ data: row })
  })
  .put("/ships/:key", async (c) => {
    const parsed = parseUnifiedKey(c.req.param("key"))
    if (parsed.kind === "external") return c.json({ error: "external_cruise_read_only" }, 409)
    if (parsed.kind === "invalid") return c.json(invalidKey(parsed.raw), 400)
    const data = await parseJsonBody(c, updateShipSchema)
    const row = await cruisesService.updateShip(c.get("db"), parsed.id, data)
    if (!row) return c.json({ error: "not_found" }, 404)
    return c.json({ data: row })
  })
  .get("/ships/:key/decks", async (c) => {
    const parsed = parseUnifiedKey(c.req.param("key"))
    if (parsed.kind === "invalid") return c.json(invalidKey(parsed.raw), 400)
    if (parsed.kind === "external") {
      const ext = resolveExternal(parsed)
      if (!ext) return c.json(adapterNotRegistered(parsed.provider), 501)
      const ship = await ext.adapter.fetchShip(ext.sourceRef)
      return c.json({ data: ship?.decks ?? [] })
    }
    const decks = await cruisesService.listShipDecks(c.get("db"), parsed.id)
    return c.json({ data: decks })
  })
  .post("/ships/:key/decks", async (c) => {
    const parsed = parseUnifiedKey(c.req.param("key"))
    if (parsed.kind === "external") return c.json({ error: "external_cruise_read_only" }, 409)
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
    if (parsed.kind === "invalid") return c.json(invalidKey(parsed.raw), 400)
    if (parsed.kind === "external") {
      const ext = resolveExternal(parsed)
      if (!ext) return c.json(adapterNotRegistered(parsed.provider), 501)
      const ship = await ext.adapter.fetchShip(ext.sourceRef)
      return c.json({ data: ship?.categories ?? [] })
    }
    const categories = await cruisesService.listShipCabinCategories(c.get("db"), parsed.id)
    return c.json({ data: categories })
  })
  .put("/ships/:key/categories/bulk", async (c) => {
    const parsed = parseUnifiedKey(c.req.param("key"))
    if (parsed.kind === "external") return c.json({ error: "external_cruise_read_only" }, 409)
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
  // --- search-index management ---
  .put("/search-index/bulk", async (c) => {
    const payload = await parseJsonBody(
      c,
      z.object({
        entries: z.array(
          z.object({
            source: z.enum(["local", "external"]),
            sourceProvider: z.string().optional().nullable(),
            sourceRef: z.record(z.string(), z.unknown()).optional().nullable(),
            localCruiseId: z.string().optional().nullable(),
            slug: z.string().min(1),
            name: z.string().min(1),
            cruiseType: z.enum(["ocean", "river", "expedition", "coastal"]),
            lineName: z.string().min(1),
            shipName: z.string().min(1),
            nights: z.number().int().positive(),
            embarkPortName: z.string().optional().nullable(),
            disembarkPortName: z.string().optional().nullable(),
            regions: z.array(z.string()).optional(),
            themes: z.array(z.string()).optional(),
            earliestDeparture: z.string().optional().nullable(),
            latestDeparture: z.string().optional().nullable(),
            lowestPrice: z.string().optional().nullable(),
            lowestPriceCurrency: z.string().optional().nullable(),
            salesStatus: z.string().optional().nullable(),
            heroImageUrl: z.string().optional().nullable(),
          }),
        ),
      }),
    )
    const result = await cruisesSearchService.bulkUpsert(c.get("db"), payload.entries as never)
    return c.json({ data: result })
  })
  .delete("/search-index/:crsiId", async (c) => {
    const ok = await cruisesSearchService.removeEntry(c.get("db"), c.req.param("crsiId"))
    if (!ok) return c.json({ error: "not_found" }, 404)
    return c.body(null, 204)
  })
  .post("/search-index/rebuild", async (c) => {
    const result = await cruisesSearchService.rebuildAll(c.get("db"))
    return c.json({ data: result })
  })

export type CruiseAdminRoutes = typeof cruiseAdminRoutes
