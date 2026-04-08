import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { Hono } from "hono"

import { crmService } from "../service/index.js"
import {
  insertOpportunityParticipantSchema,
  insertOpportunityProductSchema,
  insertOpportunitySchema,
  opportunityListQuerySchema,
  updateOpportunityProductSchema,
  updateOpportunitySchema,
} from "../validation.js"

type Env = {
  Variables: {
    db: PostgresJsDatabase
    userId?: string
  }
}

export const opportunityRoutes = new Hono<Env>()
  .get("/opportunities", async (c) => {
    const query = opportunityListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await crmService.listOpportunities(c.get("db"), query))
  })
  .post("/opportunities", async (c) => {
    return c.json(
      {
        data: await crmService.createOpportunity(
          c.get("db"),
          insertOpportunitySchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })
  .get("/opportunities/:id", async (c) => {
    const row = await crmService.getOpportunityById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Opportunity not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/opportunities/:id", async (c) => {
    const row = await crmService.updateOpportunity(
      c.get("db"),
      c.req.param("id"),
      updateOpportunitySchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Opportunity not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/opportunities/:id", async (c) => {
    const row = await crmService.deleteOpportunity(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Opportunity not found" }, 404)
    return c.json({ success: true })
  })
  .get("/opportunities/:id/participants", async (c) => {
    return c.json({
      data: await crmService.listOpportunityParticipants(c.get("db"), c.req.param("id")),
    })
  })
  .post("/opportunities/:id/participants", async (c) => {
    return c.json(
      {
        data: await crmService.createOpportunityParticipant(
          c.get("db"),
          c.req.param("id"),
          insertOpportunityParticipantSchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })
  .delete("/opportunity-participants/:id", async (c) => {
    const row = await crmService.deleteOpportunityParticipant(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Opportunity participant not found" }, 404)
    return c.json({ success: true })
  })
  .get("/opportunities/:id/products", async (c) => {
    return c.json({
      data: await crmService.listOpportunityProducts(c.get("db"), c.req.param("id")),
    })
  })
  .post("/opportunities/:id/products", async (c) => {
    return c.json(
      {
        data: await crmService.createOpportunityProduct(
          c.get("db"),
          c.req.param("id"),
          insertOpportunityProductSchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })
  .patch("/opportunity-products/:id", async (c) => {
    const row = await crmService.updateOpportunityProduct(
      c.get("db"),
      c.req.param("id"),
      updateOpportunityProductSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Opportunity product not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/opportunity-products/:id", async (c) => {
    const row = await crmService.deleteOpportunityProduct(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Opportunity product not found" }, 404)
    return c.json({ success: true })
  })
