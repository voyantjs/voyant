import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { Hono } from "hono"
import { parseJsonBody, parseQuery } from "@voyantjs/hono"

import { sellabilityService } from "./service.js"
import {
  insertOfferExpirationEventSchema,
  insertOfferRefreshRunSchema,
  insertSellabilityExplanationSchema,
  insertSellabilityPolicyResultSchema,
  insertSellabilityPolicySchema,
  offerExpirationEventListQuerySchema,
  offerRefreshRunListQuerySchema,
  sellabilityConstructOfferSchema,
  sellabilityExplanationListQuerySchema,
  sellabilityPersistSnapshotSchema,
  sellabilityPolicyListQuerySchema,
  sellabilityPolicyResultListQuerySchema,
  sellabilityResolveQuerySchema,
  sellabilitySnapshotItemListQuerySchema,
  sellabilitySnapshotListQuerySchema,
  updateOfferExpirationEventSchema,
  updateOfferRefreshRunSchema,
  updateSellabilityExplanationSchema,
  updateSellabilityPolicyResultSchema,
  updateSellabilityPolicySchema,
} from "./validation.js"

type Env = {
  Variables: {
    db: PostgresJsDatabase
    userId?: string
  }
}

export const sellabilityRoutes = new Hono<Env>()
  .post("/resolve", async (c) => {
    const input = await parseJsonBody(c, sellabilityResolveQuerySchema)
    return c.json(await sellabilityService.resolve(c.get("db"), input))
  })
  .post("/resolve-and-persist", async (c) => {
    const input = await parseJsonBody(c, sellabilityPersistSnapshotSchema)
    return c.json(await sellabilityService.persistSnapshot(c.get("db"), input), 201)
  })
  .post("/construct-offer", async (c) => {
    const input = await parseJsonBody(c, sellabilityConstructOfferSchema)
    const result = await sellabilityService.constructOffer(c.get("db"), input)
    if (!result) {
      return c.json({ error: "Sellable candidate not found" }, 404)
    }
    return c.json({ data: result }, 201)
  })
  .get("/snapshots", async (c) => {
    const query = parseQuery(c, sellabilitySnapshotListQuerySchema)
    return c.json(await sellabilityService.listSnapshots(c.get("db"), query))
  })
  .get("/snapshots/:id", async (c) => {
    const row = await sellabilityService.getSnapshotById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Sellability snapshot not found" }, 404)
    return c.json({ data: row })
  })
  .get("/snapshot-items", async (c) => {
    const query = parseQuery(c, sellabilitySnapshotItemListQuerySchema)
    return c.json(await sellabilityService.listSnapshotItems(c.get("db"), query))
  })
  .get("/policies", async (c) => {
    const query = parseQuery(c, sellabilityPolicyListQuerySchema)
    return c.json(await sellabilityService.listPolicies(c.get("db"), query))
  })
  .post("/policies", async (c) => {
    return c.json(
      {
        data: await sellabilityService.createPolicy(
          c.get("db"),
          await parseJsonBody(c, insertSellabilityPolicySchema),
        ),
      },
      201,
    )
  })
  .get("/policies/:id", async (c) => {
    const row = await sellabilityService.getPolicyById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Sellability policy not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/policies/:id", async (c) => {
    const row = await sellabilityService.updatePolicy(
      c.get("db"),
      c.req.param("id"),
      await parseJsonBody(c, updateSellabilityPolicySchema),
    )
    if (!row) return c.json({ error: "Sellability policy not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/policies/:id", async (c) => {
    const row = await sellabilityService.deletePolicy(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Sellability policy not found" }, 404)
    return c.json({ success: true })
  })
  .get("/policy-results", async (c) => {
    const query = parseQuery(c, sellabilityPolicyResultListQuerySchema)
    return c.json(await sellabilityService.listPolicyResults(c.get("db"), query))
  })
  .post("/policy-results", async (c) => {
    return c.json(
      {
        data: await sellabilityService.createPolicyResult(
          c.get("db"),
          await parseJsonBody(c, insertSellabilityPolicyResultSchema),
        ),
      },
      201,
    )
  })
  .get("/policy-results/:id", async (c) => {
    const row = await sellabilityService.getPolicyResultById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Sellability policy result not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/policy-results/:id", async (c) => {
    const row = await sellabilityService.updatePolicyResult(
      c.get("db"),
      c.req.param("id"),
      await parseJsonBody(c, updateSellabilityPolicyResultSchema),
    )
    if (!row) return c.json({ error: "Sellability policy result not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/policy-results/:id", async (c) => {
    const row = await sellabilityService.deletePolicyResult(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Sellability policy result not found" }, 404)
    return c.json({ success: true })
  })
  .get("/offer-refresh-runs", async (c) => {
    const query = parseQuery(c, offerRefreshRunListQuerySchema)
    return c.json(await sellabilityService.listOfferRefreshRuns(c.get("db"), query))
  })
  .post("/offer-refresh-runs", async (c) => {
    return c.json(
      {
        data: await sellabilityService.createOfferRefreshRun(
          c.get("db"),
          await parseJsonBody(c, insertOfferRefreshRunSchema),
        ),
      },
      201,
    )
  })
  .get("/offer-refresh-runs/:id", async (c) => {
    const row = await sellabilityService.getOfferRefreshRunById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Offer refresh run not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/offer-refresh-runs/:id", async (c) => {
    const row = await sellabilityService.updateOfferRefreshRun(
      c.get("db"),
      c.req.param("id"),
      await parseJsonBody(c, updateOfferRefreshRunSchema),
    )
    if (!row) return c.json({ error: "Offer refresh run not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/offer-refresh-runs/:id", async (c) => {
    const row = await sellabilityService.deleteOfferRefreshRun(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Offer refresh run not found" }, 404)
    return c.json({ success: true })
  })
  .get("/offer-expiration-events", async (c) => {
    const query = parseQuery(c, offerExpirationEventListQuerySchema)
    return c.json(await sellabilityService.listOfferExpirationEvents(c.get("db"), query))
  })
  .post("/offer-expiration-events", async (c) => {
    return c.json(
      {
        data: await sellabilityService.createOfferExpirationEvent(
          c.get("db"),
          await parseJsonBody(c, insertOfferExpirationEventSchema),
        ),
      },
      201,
    )
  })
  .get("/offer-expiration-events/:id", async (c) => {
    const row = await sellabilityService.getOfferExpirationEventById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Offer expiration event not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/offer-expiration-events/:id", async (c) => {
    const row = await sellabilityService.updateOfferExpirationEvent(
      c.get("db"),
      c.req.param("id"),
      await parseJsonBody(c, updateOfferExpirationEventSchema),
    )
    if (!row) return c.json({ error: "Offer expiration event not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/offer-expiration-events/:id", async (c) => {
    const row = await sellabilityService.deleteOfferExpirationEvent(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Offer expiration event not found" }, 404)
    return c.json({ success: true })
  })
  .get("/explanations", async (c) => {
    const query = parseQuery(c, sellabilityExplanationListQuerySchema)
    return c.json(await sellabilityService.listExplanations(c.get("db"), query))
  })
  .post("/explanations", async (c) => {
    return c.json(
      {
        data: await sellabilityService.createExplanation(
          c.get("db"),
          await parseJsonBody(c, insertSellabilityExplanationSchema),
        ),
      },
      201,
    )
  })
  .get("/explanations/:id", async (c) => {
    const row = await sellabilityService.getExplanationById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Sellability explanation not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/explanations/:id", async (c) => {
    const row = await sellabilityService.updateExplanation(
      c.get("db"),
      c.req.param("id"),
      await parseJsonBody(c, updateSellabilityExplanationSchema),
    )
    if (!row) return c.json({ error: "Sellability explanation not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/explanations/:id", async (c) => {
    const row = await sellabilityService.deleteExplanation(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Sellability explanation not found" }, 404)
    return c.json({ success: true })
  })

export type SellabilityRoutes = typeof sellabilityRoutes
