import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { Hono } from "hono"

import { publicProductsService } from "./service-public.js"
import {
  publicCatalogCategoryListQuerySchema,
  publicCatalogDestinationListQuerySchema,
  publicCatalogProductListQuerySchema,
  publicCatalogProductLookupBySlugQuerySchema,
  publicCatalogTagListQuerySchema,
} from "./validation-public.js"

type Env = {
  Variables: {
    db: PostgresJsDatabase
    userId?: string
  }
}

export const publicProductRoutes = new Hono<Env>()
  .get("/", async (c) => {
    const query = publicCatalogProductListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await publicProductsService.listCatalogProducts(c.get("db"), query))
  })
  .get("/slug/:slug", async (c) => {
    const query = publicCatalogProductLookupBySlugQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    const row = await publicProductsService.getCatalogProductBySlug(
      c.get("db"),
      c.req.param("slug"),
      query,
    )

    if (!row) {
      return c.json({ error: "Catalog product not found" }, 404)
    }

    return c.json({ data: row })
  })
  .get("/categories", async (c) => {
    const query = publicCatalogCategoryListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await publicProductsService.listCatalogCategories(c.get("db"), query))
  })
  .get("/tags", async (c) => {
    const query = publicCatalogTagListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await publicProductsService.listCatalogTags(c.get("db"), query))
  })
  .get("/destinations", async (c) => {
    const query = publicCatalogDestinationListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await publicProductsService.listCatalogDestinations(c.get("db"), query))
  })
  .get("/:id", async (c) => {
    const query = publicCatalogProductLookupBySlugQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    const row = await publicProductsService.getCatalogProductById(
      c.get("db"),
      c.req.param("id"),
      query,
    )

    if (!row) {
      return c.json({ error: "Catalog product not found" }, 404)
    }

    return c.json({ data: row })
  })
  .get("/:id/brochure", async (c) => {
    const query = publicCatalogProductLookupBySlugQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    const row = await publicProductsService.getCatalogProductBrochure(
      c.get("db"),
      c.req.param("id"),
      query,
    )

    if (!row) {
      return c.json({ error: "Catalog product brochure not found" }, 404)
    }

    return c.json({ data: row })
  })

export type PublicProductRoutes = typeof publicProductRoutes
