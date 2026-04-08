import { Hono } from "hono"
import { beforeAll, beforeEach, describe, expect, it } from "vitest"

import { crmRoutes } from "../../src/routes/index.js"

const DB_AVAILABLE = !!process.env.TEST_DATABASE_URL
const json = (body: Record<string, unknown>) => ({
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
})

describe.skipIf(!DB_AVAILABLE)("Opportunity routes", () => {
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

  async function seedPipelineAndStage() {
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

    return { pipeline, stage }
  }

  async function seedOpportunity() {
    const { pipeline, stage } = await seedPipelineAndStage()
    const res = await app.request("/opportunities", {
      method: "POST",
      ...json({ title: "Test Opp", pipelineId: pipeline.id, stageId: stage.id }),
    })
    const { data: opportunity } = await res.json()
    return { pipeline, stage, opportunity }
  }

  describe("Opportunities CRUD", () => {
    it("creates an opportunity", async () => {
      const { pipeline, stage } = await seedPipelineAndStage()

      const res = await app.request("/opportunities", {
        method: "POST",
        ...json({ title: "Big Deal", pipelineId: pipeline.id, stageId: stage.id }),
      })

      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.data.title).toBe("Big Deal")
      expect(body.data.status).toBe("open")
      expect(body.data.id).toBeTruthy()
    })

    it("lists opportunities", async () => {
      await seedOpportunity()

      const res = await app.request("/opportunities", { method: "GET" })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toBeInstanceOf(Array)
      expect(body.total).toBeTypeOf("number")
    })

    it("gets an opportunity by id", async () => {
      const { opportunity } = await seedOpportunity()

      const res = await app.request(`/opportunities/${opportunity.id}`, { method: "GET" })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.title).toBe("Test Opp")
    })

    it("updates an opportunity", async () => {
      const { opportunity } = await seedOpportunity()

      const res = await app.request(`/opportunities/${opportunity.id}`, {
        method: "PATCH",
        ...json({ title: "Updated Deal" }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.title).toBe("Updated Deal")
    })

    it("deletes an opportunity", async () => {
      const { opportunity } = await seedOpportunity()

      const res = await app.request(`/opportunities/${opportunity.id}`, { method: "DELETE" })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
    })

    it("returns 404 for non-existent opportunity", async () => {
      const res = await app.request("/opportunities/crm_opp_00000000000000000000000000", {
        method: "GET",
      })
      expect(res.status).toBe(404)
    })

    it("updates stageChangedAt when stageId changes", async () => {
      const { pipeline, opportunity } = await seedOpportunity()

      const stg2Res = await app.request("/stages", {
        method: "POST",
        ...json({ pipelineId: pipeline.id, name: `Stage2-${Date.now()}` }),
      })
      const { data: stage2 } = await stg2Res.json()

      const res = await app.request(`/opportunities/${opportunity.id}`, {
        method: "PATCH",
        ...json({ stageId: stage2.id }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.stageId).toBe(stage2.id)
      expect(new Date(body.data.stageChangedAt).getTime()).toBeGreaterThan(
        new Date(opportunity.stageChangedAt).getTime(),
      )
    })

    it("sets closedAt when status changes to won", async () => {
      const { opportunity } = await seedOpportunity()

      const res = await app.request(`/opportunities/${opportunity.id}`, {
        method: "PATCH",
        ...json({ status: "won" }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.status).toBe("won")
      expect(body.data.closedAt).toBeTruthy()
    })

    it("clears closedAt when status changes back to open", async () => {
      const { opportunity } = await seedOpportunity()

      await app.request(`/opportunities/${opportunity.id}`, {
        method: "PATCH",
        ...json({ status: "won" }),
      })

      const res = await app.request(`/opportunities/${opportunity.id}`, {
        method: "PATCH",
        ...json({ status: "open" }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.status).toBe("open")
      expect(body.data.closedAt).toBeNull()
    })
  })

  describe("Opportunity Participants", () => {
    it("creates and lists participants", async () => {
      const { opportunity } = await seedOpportunity()

      const personRes = await app.request("/people", {
        method: "POST",
        ...json({ firstName: "Jane", lastName: "Doe" }),
      })
      const { data: person } = await personRes.json()

      const createRes = await app.request(`/opportunities/${opportunity.id}/participants`, {
        method: "POST",
        ...json({ personId: person.id, role: "decision_maker" }),
      })

      expect(createRes.status).toBe(201)
      const createBody = await createRes.json()
      expect(createBody.data.personId).toBe(person.id)
      expect(createBody.data.role).toBe("decision_maker")

      const listRes = await app.request(`/opportunities/${opportunity.id}/participants`, {
        method: "GET",
      })

      expect(listRes.status).toBe(200)
      const listBody = await listRes.json()
      expect(listBody.data.length).toBe(1)
    })

    it("deletes a participant", async () => {
      const { opportunity } = await seedOpportunity()

      const personRes = await app.request("/people", {
        method: "POST",
        ...json({ firstName: "Del", lastName: "Part" }),
      })
      const { data: person } = await personRes.json()

      const createRes = await app.request(`/opportunities/${opportunity.id}/participants`, {
        method: "POST",
        ...json({ personId: person.id }),
      })
      const { data: participant } = await createRes.json()

      const res = await app.request(`/opportunity-participants/${participant.id}`, {
        method: "DELETE",
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
    })
  })

  describe("Opportunity Products", () => {
    it("creates and lists products", async () => {
      const { opportunity } = await seedOpportunity()

      const createRes = await app.request(`/opportunities/${opportunity.id}/products`, {
        method: "POST",
        ...json({ nameSnapshot: "Hotel Room", quantity: 2, unitPriceAmountCents: 15000 }),
      })

      expect(createRes.status).toBe(201)
      const createBody = await createRes.json()
      expect(createBody.data.nameSnapshot).toBe("Hotel Room")
      expect(createBody.data.quantity).toBe(2)

      const listRes = await app.request(`/opportunities/${opportunity.id}/products`, {
        method: "GET",
      })

      expect(listRes.status).toBe(200)
      const listBody = await listRes.json()
      expect(listBody.data.length).toBe(1)
    })

    it("updates a product", async () => {
      const { opportunity } = await seedOpportunity()

      const createRes = await app.request(`/opportunities/${opportunity.id}/products`, {
        method: "POST",
        ...json({ nameSnapshot: "Old Name" }),
      })
      const { data: product } = await createRes.json()

      const res = await app.request(`/opportunity-products/${product.id}`, {
        method: "PATCH",
        ...json({ nameSnapshot: "New Name" }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.nameSnapshot).toBe("New Name")
    })

    it("deletes a product", async () => {
      const { opportunity } = await seedOpportunity()

      const createRes = await app.request(`/opportunities/${opportunity.id}/products`, {
        method: "POST",
        ...json({ nameSnapshot: "ToDelete" }),
      })
      const { data: product } = await createRes.json()

      const res = await app.request(`/opportunity-products/${product.id}`, { method: "DELETE" })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
    })
  })
})
