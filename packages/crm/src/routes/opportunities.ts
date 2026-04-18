import { parseJsonBody, parseQuery } from "@voyantjs/hono"
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
    const query = await parseQuery(c, opportunityListQuerySchema)
    return c.json(await crmService.listOpportunities(c.get("db"), query))
  })
  .post("/opportunities", async (c) => {
    return c.json(
      {
        data: await crmService.createOpportunity(
          c.get("db"),
          await parseJsonBody(c, insertOpportunitySchema),
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
      await parseJsonBody(c, updateOpportunitySchema),
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
          await parseJsonBody(c, insertOpportunityParticipantSchema),
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
          await parseJsonBody(c, insertOpportunityProductSchema),
        ),
      },
      201,
    )
  })
  .patch("/opportunity-products/:id", async (c) => {
    const row = await crmService.updateOpportunityProduct(
      c.get("db"),
      c.req.param("id"),
      await parseJsonBody(c, updateOpportunityProductSchema),
    )
    if (!row) return c.json({ error: "Opportunity product not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/opportunity-products/:id", async (c) => {
    const row = await crmService.deleteOpportunityProduct(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Opportunity product not found" }, 404)
    return c.json({ success: true })
  })
