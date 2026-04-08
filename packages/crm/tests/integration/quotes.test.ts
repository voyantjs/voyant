import { Hono } from "hono"
import { beforeAll, beforeEach, describe, expect, it } from "vitest"

import { crmRoutes } from "../../src/routes/index.js"

const DB_AVAILABLE = !!process.env.TEST_DATABASE_URL
const json = (body: Record<string, unknown>) => ({
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
})

describe.skipIf(!DB_AVAILABLE)("Quote routes", () => {
  let app: Hono

  beforeAll(async () => {
    const { createTestDb, cleanupTestDb } = await import("@voyantjs/db/test-utils")
    const db = createTestDb()
    await cleanupTestDb(db)

    app = new Hono()
    app.use("*", async (c, next) => {
      c.set("db" as never, db)
      c.set("userId" as never, "test-user-id")
      await next()
    })
    app.route("/", crmRoutes)
  })

  beforeEach(async () => {
    const { createTestDb, cleanupTestDb } = await import("@voyantjs/db/test-utils")
    await cleanupTestDb(createTestDb())
  })

  async function seedOpportunity() {
    const pipRes = await app.request("/pipelines", {
      method: "POST",
      ...json({ name: `Pipeline-${Date.now()}` }),
    })
    const { data: pipeline } = await pipRes.json()

    const stgRes = await app.request("/stages", {
      method: "POST",
      ...json({ pipelineId: pipeline.id, name: `Stage-${Date.now()}` }),
    })
    const { data: stage } = await stgRes.json()

    const oppRes = await app.request("/opportunities", {
      method: "POST",
      ...json({ title: "Test Opp", pipelineId: pipeline.id, stageId: stage.id }),
    })
    const { data: opportunity } = await oppRes.json()

    return { pipeline, stage, opportunity }
  }

  describe("Quotes CRUD", () => {
    it("creates a quote", async () => {
      const { opportunity } = await seedOpportunity()

      const res = await app.request("/quotes", {
        method: "POST",
        ...json({ opportunityId: opportunity.id, currency: "USD" }),
      })

      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.data.opportunityId).toBe(opportunity.id)
      expect(body.data.currency).toBe("USD")
      expect(body.data.status).toBe("draft")
      expect(body.data.totalAmountCents).toBe(0)
    })

    it("lists quotes filtered by opportunityId", async () => {
      const { opportunity } = await seedOpportunity()
      await app.request("/quotes", {
        method: "POST",
        ...json({ opportunityId: opportunity.id, currency: "USD" }),
      })
      await app.request("/quotes", {
        method: "POST",
        ...json({ opportunityId: opportunity.id, currency: "EUR" }),
      })

      const res = await app.request(`/quotes?opportunityId=${opportunity.id}`, { method: "GET" })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.length).toBe(2)
    })

    it("gets a quote by id", async () => {
      const { opportunity } = await seedOpportunity()
      const createRes = await app.request("/quotes", {
        method: "POST",
        ...json({ opportunityId: opportunity.id, currency: "GBP" }),
      })
      const { data: quote } = await createRes.json()

      const res = await app.request(`/quotes/${quote.id}`, { method: "GET" })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.currency).toBe("GBP")
    })

    it("updates a quote", async () => {
      const { opportunity } = await seedOpportunity()
      const createRes = await app.request("/quotes", {
        method: "POST",
        ...json({ opportunityId: opportunity.id, currency: "USD" }),
      })
      const { data: quote } = await createRes.json()

      const res = await app.request(`/quotes/${quote.id}`, {
        method: "PATCH",
        ...json({ status: "sent", totalAmountCents: 50000 }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.status).toBe("sent")
      expect(body.data.totalAmountCents).toBe(50000)
    })

    it("deletes a quote", async () => {
      const { opportunity } = await seedOpportunity()
      const createRes = await app.request("/quotes", {
        method: "POST",
        ...json({ opportunityId: opportunity.id, currency: "USD" }),
      })
      const { data: quote } = await createRes.json()

      const res = await app.request(`/quotes/${quote.id}`, { method: "DELETE" })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
    })

    it("returns 404 for non-existent quote", async () => {
      const res = await app.request("/quotes/crm_quo_00000000000000000000000000", {
        method: "GET",
      })
      expect(res.status).toBe(404)
    })
  })

  describe("Quote Lines", () => {
    async function seedQuote() {
      const { opportunity } = await seedOpportunity()
      const quoteRes = await app.request("/quotes", {
        method: "POST",
        ...json({ opportunityId: opportunity.id, currency: "USD" }),
      })
      const { data: quote } = await quoteRes.json()
      return { opportunity, quote }
    }

    it("creates a quote line", async () => {
      const { quote } = await seedQuote()

      const res = await app.request(`/quotes/${quote.id}/lines`, {
        method: "POST",
        ...json({ description: "Hotel Transfer", quantity: 1, currency: "USD" }),
      })

      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.data.description).toBe("Hotel Transfer")
      expect(body.data.quoteId).toBe(quote.id)
    })

    it("lists quote lines", async () => {
      const { quote } = await seedQuote()
      await app.request(`/quotes/${quote.id}/lines`, {
        method: "POST",
        ...json({ description: "Line A", currency: "USD" }),
      })
      await app.request(`/quotes/${quote.id}/lines`, {
        method: "POST",
        ...json({ description: "Line B", currency: "USD" }),
      })

      const res = await app.request(`/quotes/${quote.id}/lines`, { method: "GET" })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.length).toBe(2)
    })

    it("updates a quote line", async () => {
      const { quote } = await seedQuote()
      const createRes = await app.request(`/quotes/${quote.id}/lines`, {
        method: "POST",
        ...json({ description: "Old", currency: "USD" }),
      })
      const { data: line } = await createRes.json()

      const res = await app.request(`/quote-lines/${line.id}`, {
        method: "PATCH",
        ...json({ description: "Updated", quantity: 5 }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.description).toBe("Updated")
      expect(body.data.quantity).toBe(5)
    })

    it("deletes a quote line", async () => {
      const { quote } = await seedQuote()
      const createRes = await app.request(`/quotes/${quote.id}/lines`, {
        method: "POST",
        ...json({ description: "ToDelete", currency: "USD" }),
      })
      const { data: line } = await createRes.json()

      const res = await app.request(`/quote-lines/${line.id}`, { method: "DELETE" })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
    })
  })
})
