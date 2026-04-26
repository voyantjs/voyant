import { parseJsonBody } from "@voyantjs/hono"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { Hono } from "hono"
import { z } from "zod"

import { cruisesService } from "./service.js"
import { pricingService } from "./service-pricing.js"

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
 * Public/storefront routes for cruises.
 *
 * Phase 2 surface: enough to render a sailing detail page and quote a cabin
 * for an inquiry/booking flow. Catalog browse (list, search, filter by
 * region/date/price) is intentionally absent — it lands in phase 4 once
 * `cruise_search_index` is wired up. Calling `GET /` here returns an empty
 * list rather than fanning out to the canonical tables, because the search
 * index is the single supported read source for storefront listing per
 * docs/architecture/cruises-module.md §3.5.
 */
export const cruisePublicRoutes = new Hono<Env>()
  .get("/", (c) => {
    return c.json({
      data: [],
      total: 0,
      detail:
        "Storefront list reads from cruise_search_index; populate it (phase 4) to see results.",
    })
  })
  .get("/:slug", async (c) => {
    const slug = c.req.param("slug")
    // Basic v1 lookup against the canonical cruises table by slug.
    // Phase 4 will resolve the slug from cruise_search_index first and dispatch
    // to local DB or adapter based on the entry's source.
    const result = await cruisesService.listCruises(c.get("db"), {
      cruiseType: undefined as never,
      status: "live",
      search: undefined,
      limit: 1,
      offset: 0,
    } as never)
    const match = result.data.find((c) => c.slug === slug)
    if (!match) return c.json({ error: "not_found" }, 404)
    const detail = await cruisesService.getCruiseById(c.get("db"), match.id, {
      withSailings: true,
      withDays: true,
    })
    return c.json({ data: detail })
  })
  .get("/sailings/:key", async (c) => {
    const key = c.req.param("key")
    if (!isTypeId(key)) return c.json({ error: "invalid_key" }, 400)
    const sailing = await cruisesService.getSailingById(c.get("db"), key, {
      withPricing: true,
      withItinerary: true,
    })
    if (!sailing) return c.json({ error: "not_found" }, 404)
    return c.json({ data: sailing })
  })
  .post("/sailings/:key/quote", async (c) => {
    const key = c.req.param("key")
    if (!isTypeId(key)) return c.json({ error: "invalid_key" }, 400)
    const payload = await parseJsonBody(c, quotePayloadSchema)
    const quote = await pricingService.assembleQuote(c.get("db"), {
      sailingId: key,
      cabinCategoryId: payload.cabinCategoryId,
      occupancy: payload.occupancy,
      guestCount: payload.guestCount,
      fareCode: payload.fareCode ?? null,
    })
    return c.json({ data: quote })
  })
  .get("/ships/:key", async (c) => {
    const key = c.req.param("key")
    if (!isTypeId(key)) return c.json({ error: "invalid_key" }, 400)
    const ship = await cruisesService.getShipById(c.get("db"), key)
    if (!ship) return c.json({ error: "not_found" }, 404)
    const [decks, categories] = await Promise.all([
      cruisesService.listShipDecks(c.get("db"), key),
      cruisesService.listShipCabinCategories(c.get("db"), key),
    ])
    return c.json({ data: { ...ship, decks, categories } })
  })

export type CruisePublicRoutes = typeof cruisePublicRoutes
