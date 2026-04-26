import { parseJsonBody, parseQuery } from "@voyantjs/hono"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { Hono } from "hono"
import { z } from "zod"

import { chartersService } from "./service.js"
import { pricingService } from "./service-pricing.js"
import { productListQuerySchema, voyageListQuerySchema } from "./validation-core.js"
import { firstClassCurrencySchema } from "./validation-shared.js"

type Env = {
  Variables: {
    db: PostgresJsDatabase
  }
}

const TYPEID_RE = /^[a-z]+_[0-9a-zA-Z]+$/
function isTypeId(s: string): boolean {
  return TYPEID_RE.test(s)
}

const perSuiteQuotePayload = z.object({
  suiteId: z.string(),
  currency: firstClassCurrencySchema,
})
const wholeYachtQuotePayload = z.object({
  currency: firstClassCurrencySchema,
})

/**
 * Public-facing charter routes. Unlike cruises, charters does NOT have a
 * dedicated search index — the operator universe is small (six brands)
 * and product-level browsing is plenty for the storefront. Lists go
 * directly against `charter_products` (live status only) and detail
 * routes resolve voyages + suites + schedule on the fly.
 *
 * Phase 2 doesn't expose external (`<provider>:<ref>`) keys; phase 3
 * extends these endpoints to dispatch to a CharterAdapter when an
 * external key arrives.
 */
export const chartersPublicRoutes = new Hono<Env>()
  .get("/", async (c) => {
    // Public listing forces status='live' regardless of incoming query
    // to prevent leaking drafts.
    const query = parseQuery(c, productListQuerySchema)
    const result = await chartersService.listProducts(c.get("db"), { ...query, status: "live" })
    return c.json(result)
  })
  .get("/products/:slug", async (c) => {
    const slug = c.req.param("slug")
    if (!isTypeId(slug)) {
      // Treat as slug — the public surface uses slugs since URLs are
      // shared with end customers. The admin surface uses TypeIDs.
      const result = await chartersService.listProducts(c.get("db"), {
        status: "live",
        limit: 1,
        offset: 0,
      })
      const match = result.data.find((p) => p.slug === slug)
      if (!match) return c.json({ error: "not_found" }, 404)
      const detail = await chartersService.getProductById(c.get("db"), match.id, {
        withVoyages: true,
        withYacht: true,
      })
      if (!detail || detail.status !== "live") return c.json({ error: "not_found" }, 404)
      return c.json({ data: detail })
    }
    const detail = await chartersService.getProductById(c.get("db"), slug, {
      withVoyages: true,
      withYacht: true,
    })
    if (!detail || detail.status !== "live") return c.json({ error: "not_found" }, 404)
    return c.json({ data: detail })
  })
  .get("/voyages", async (c) => {
    const query = parseQuery(c, voyageListQuerySchema)
    const result = await chartersService.listVoyages(c.get("db"), query)
    return c.json(result)
  })
  .get("/voyages/:id", async (c) => {
    const id = c.req.param("id")
    if (!isTypeId(id)) return c.json({ error: "invalid_key" }, 400)
    const row = await chartersService.getVoyageById(c.get("db"), id, {
      withSuites: true,
      withSchedule: true,
    })
    if (!row) return c.json({ error: "not_found" }, 404)
    return c.json({ data: row })
  })
  .post("/voyages/:id/quote/per-suite", async (c) => {
    const id = c.req.param("id")
    if (!isTypeId(id)) return c.json({ error: "invalid_key" }, 400)
    const payload = await parseJsonBody(c, perSuiteQuotePayload)
    const quote = await pricingService.quotePerSuite(c.get("db"), {
      suiteId: payload.suiteId,
      currency: payload.currency,
    })
    return c.json({ data: quote })
  })
  .post("/voyages/:id/quote/whole-yacht", async (c) => {
    const id = c.req.param("id")
    if (!isTypeId(id)) return c.json({ error: "invalid_key" }, 400)
    const payload = await parseJsonBody(c, wholeYachtQuotePayload)
    const quote = await pricingService.quoteWholeYacht(c.get("db"), {
      voyageId: id,
      currency: payload.currency,
    })
    return c.json({ data: quote })
  })
  .get("/yachts/:id", async (c) => {
    const id = c.req.param("id")
    if (!isTypeId(id)) return c.json({ error: "invalid_key" }, 400)
    const row = await chartersService.getYachtById(c.get("db"), id)
    if (!row) return c.json({ error: "not_found" }, 404)
    return c.json({ data: row })
  })

export type ChartersPublicRoutes = typeof chartersPublicRoutes
