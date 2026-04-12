import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { Hono } from "hono"

import { publicProductsService } from "./service-public.js"
import {
  publicCatalogCategoryListQuerySchema,
  publicCatalogProductListQuerySchema,
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
  .get("/:id", async (c) => {
    const row = await publicProductsService.getCatalogProductById(c.get("db"), c.req.param("id"))

    if (!row) {
      return c.json({ error: "Catalog product not found" }, 404)
    }

    return c.json({ data: row })
  })

export type PublicProductRoutes = typeof publicProductRoutes
