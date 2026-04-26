import { parseJsonBody, parseQuery } from "@voyantjs/hono"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { Hono } from "hono"
import { z } from "zod"

import { resolveCruiseAdapter } from "./adapters/registry.js"
import { cruisesService } from "./service.js"
import { composeQuote, pricingService } from "./service-pricing.js"
import { cruisesSearchService } from "./service-search.js"
import { searchIndexQuerySchema } from "./validation-search.js"

type Env = {
  Variables: {
    db: PostgresJsDatabase
  }
}

const TYPEID_RE = /^[a-z]+_[0-9a-zA-Z]+$/

function isTypeId(s: string): boolean {
  return TYPEID_RE.test(s)
}

const quotePayloadSchema = z.object({
  cabinCategoryId: z.string(),
  occupancy: z.number().int().min(1).max(8),
  guestCount: z.number().int().min(1).max(8),
  fareCode: z.string().optional().nullable(),
})

/**
 * Public/storefront routes. Reads exclusively from `cruise_search_index` for
 * list and slug lookups; detail endpoints (sailing, ship, quote) resolve
 * through the appropriate source — local DB for source='local' rows, the
 * registered adapter for source='external'.
 *
 * Operators that don't run a Voyant-powered storefront leave the search index
 * empty; the list endpoint returns no rows but detail endpoints still work
 * for direct sailing/ship key lookups.
 */
export const cruisePublicRoutes = new Hono<Env>()
  .get("/", async (c) => {
    const query = parseQuery(c, searchIndexQuerySchema)
    const result = await cruisesSearchService.query(c.get("db"), query)
    return c.json(result)
  })
  .get("/:slug", async (c) => {
    const slug = c.req.param("slug")
    const indexEntry = await cruisesSearchService.getBySlug(c.get("db"), slug)
    if (!indexEntry) return c.json({ error: "not_found" }, 404)

    if (indexEntry.source === "local" && indexEntry.localCruiseId) {
      const detail = await cruisesService.getCruiseById(c.get("db"), indexEntry.localCruiseId, {
        withSailings: true,
        withDays: true,
      })
      if (!detail) return c.json({ error: "not_found" }, 404)
      return c.json({
        data: {
          source: "local" as const,
          sourceProvider: null,
          sourceRef: null,
          summary: indexEntry,
          cruise: detail,
        },
      })
    }

    if (indexEntry.source === "external" && indexEntry.sourceProvider && indexEntry.sourceRef) {
      const externalId = indexEntry.sourceRef.externalId
      if (typeof externalId !== "string" || externalId.length === 0) {
        return c.json({ error: "invalid_index_entry", detail: "sourceRef.externalId missing" }, 500)
      }
      const adapter = resolveCruiseAdapter(indexEntry.sourceProvider)
      if (!adapter) {
        return c.json(
          {
            error: "adapter_not_registered",
            detail: `Search-index entry references provider '${indexEntry.sourceProvider}' but no adapter is registered.`,
          },
          501,
        )
      }
      const adapterRef = { ...indexEntry.sourceRef, externalId }
      const cruise = await adapter.fetchCruise(adapterRef)
      if (!cruise) return c.json({ error: "not_found" }, 404)
      const sailings = await adapter.listSailingsForCruise(adapterRef)
      return c.json({
        data: {
          source: "external" as const,
          sourceProvider: adapter.name,
          sourceRef: adapterRef,
          summary: indexEntry,
          cruise,
          sailings,
        },
      })
    }

    return c.json({ error: "invalid_index_entry" }, 500)
  })
  .get("/sailings/:key", async (c) => {
    const key = c.req.param("key")
    if (isTypeId(key)) {
      const sailing = await cruisesService.getSailingById(c.get("db"), key, {
        withPricing: true,
        withItinerary: true,
      })
      if (!sailing) return c.json({ error: "not_found" }, 404)
      return c.json({ data: { source: "local", sailing } })
    }
    // External keys: <provider>:<ref>
    const colon = key.indexOf(":")
    if (colon <= 0) return c.json({ error: "invalid_key" }, 400)
    const provider = key.slice(0, colon)
    const externalId = key.slice(colon + 1)
    const adapter = resolveCruiseAdapter(provider)
    if (!adapter) return c.json({ error: "adapter_not_registered" }, 501)
    const ref = { externalId }
    const sailing = await adapter.fetchSailing(ref)
    if (!sailing) return c.json({ error: "not_found" }, 404)
    const [pricing, itinerary] = await Promise.all([
      adapter.fetchSailingPricing(ref),
      adapter.fetchSailingItinerary(ref),
    ])
    return c.json({
      data: { source: "external", sourceProvider: adapter.name, sailing, pricing, itinerary },
    })
  })
  .post("/sailings/:key/quote", async (c) => {
    const key = c.req.param("key")
    const payload = await parseJsonBody(c, quotePayloadSchema)

    if (isTypeId(key)) {
      const quote = await pricingService.assembleQuote(c.get("db"), {
        sailingId: key,
        cabinCategoryId: payload.cabinCategoryId,
        occupancy: payload.occupancy,
        guestCount: payload.guestCount,
        fareCode: payload.fareCode ?? null,
      })
      return c.json({ data: quote })
    }

    const colon = key.indexOf(":")
    if (colon <= 0) return c.json({ error: "invalid_key" }, 400)
    const provider = key.slice(0, colon)
    const externalId = key.slice(colon + 1)
    const adapter = resolveCruiseAdapter(provider)
    if (!adapter) return c.json({ error: "adapter_not_registered" }, 501)
    const prices = await adapter.fetchSailingPricing({ externalId })
    const matching = prices.find(
      (p) =>
        p.cabinCategoryRef.externalId === payload.cabinCategoryId &&
        p.occupancy === payload.occupancy &&
        (!payload.fareCode || p.fareCode === payload.fareCode),
    )
    if (!matching) return c.json({ error: "no_matching_price" }, 404)
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
  })
  .get("/ships/:key", async (c) => {
    const key = c.req.param("key")
    if (isTypeId(key)) {
      const ship = await cruisesService.getShipById(c.get("db"), key)
      if (!ship) return c.json({ error: "not_found" }, 404)
      const [decks, categories] = await Promise.all([
        cruisesService.listShipDecks(c.get("db"), key),
        cruisesService.listShipCabinCategories(c.get("db"), key),
      ])
      return c.json({ data: { ...ship, decks, categories } })
    }
    const colon = key.indexOf(":")
    if (colon <= 0) return c.json({ error: "invalid_key" }, 400)
    const provider = key.slice(0, colon)
    const externalId = key.slice(colon + 1)
    const adapter = resolveCruiseAdapter(provider)
    if (!adapter) return c.json({ error: "adapter_not_registered" }, 501)
    const ship = await adapter.fetchShip({ externalId })
    if (!ship) return c.json({ error: "not_found" }, 404)
    return c.json({ data: ship })
  })

export type CruisePublicRoutes = typeof cruisePublicRoutes
