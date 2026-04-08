import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { Hono } from "hono"

import { crmService } from "../service/index.js"
import {
  insertQuoteLineSchema,
  insertQuoteSchema,
  quoteListQuerySchema,
  updateQuoteLineSchema,
  updateQuoteSchema,
} from "../validation.js"

type Env = {
  Variables: {
    db: PostgresJsDatabase
    userId?: string
  }
}

export const quoteRoutes = new Hono<Env>()
  .get("/quotes", async (c) => {
    const query = quoteListQuerySchema.parse(Object.fromEntries(new URL(c.req.url).searchParams))
    return c.json(await crmService.listQuotes(c.get("db"), query))
  })
  .post("/quotes", async (c) => {
    return c.json(
      {
        data: await crmService.createQuote(
          c.get("db"),
          insertQuoteSchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })
  .get("/quotes/:id", async (c) => {
    const row = await crmService.getQuoteById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Quote not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/quotes/:id", async (c) => {
    const row = await crmService.updateQuote(
      c.get("db"),
      c.req.param("id"),
      updateQuoteSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Quote not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/quotes/:id", async (c) => {
    const row = await crmService.deleteQuote(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Quote not found" }, 404)
    return c.json({ success: true })
  })
  .get("/quotes/:id/lines", async (c) => {
    return c.json({ data: await crmService.listQuoteLines(c.get("db"), c.req.param("id")) })
  })
  .post("/quotes/:id/lines", async (c) => {
    return c.json(
      {
        data: await crmService.createQuoteLine(
          c.get("db"),
          c.req.param("id"),
          insertQuoteLineSchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })
  .patch("/quote-lines/:id", async (c) => {
    const row = await crmService.updateQuoteLine(
      c.get("db"),
      c.req.param("id"),
      updateQuoteLineSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Quote line not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/quote-lines/:id", async (c) => {
    const row = await crmService.deleteQuoteLine(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Quote line not found" }, 404)
    return c.json({ success: true })
  })
