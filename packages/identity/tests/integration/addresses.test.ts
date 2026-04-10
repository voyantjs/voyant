import { describe, expect, it } from "vitest"

import {
  createIdentityTestContext,
  DB_AVAILABLE,
  ENTITY_ID,
  ENTITY_ID_2,
  ENTITY_TYPE,
  ENTITY_TYPE_2,
  newId,
} from "./test-helpers"

describe.skipIf(!DB_AVAILABLE)("identity address routes", () => {
  const ctx = createIdentityTestContext()

  describe("addresses", () => {
    it("creates an address", async () => {
      const res = await ctx.req("POST", "/addresses", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        label: "primary",
        line1: "123 Main St",
        city: "Paris",
        country: "FR",
        postalCode: "75001",
        isPrimary: true,
      })
      expect(res.status).toBe(201)
      const json = (await res.json()) as {
        data: { label: string; city: string; country: string; isPrimary: boolean }
      }
      expect(json.data.label).toBe("primary")
      expect(json.data.city).toBe("Paris")
      expect(json.data.country).toBe("FR")
      expect(json.data.isPrimary).toBe(true)
    })

    it("lists addresses", async () => {
      await ctx.req("POST", "/addresses", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        line1: "1 Rue Test",
        city: "Lyon",
      })
      const res = await ctx.req("GET", "/addresses")
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: unknown[]; total: number }
      expect(json.total).toBeGreaterThanOrEqual(1)
    })

    it("filters addresses by entityType and entityId", async () => {
      await ctx.req("POST", "/addresses", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        line1: "A",
      })
      await ctx.req("POST", "/addresses", {
        entityType: ENTITY_TYPE_2,
        entityId: ENTITY_ID_2,
        line1: "B",
      })
      const res = await ctx.req("GET", `/addresses?entityType=${ENTITY_TYPE}&entityId=${ENTITY_ID}`)
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: unknown[]; total: number }
      expect(json.total).toBe(1)
    })

    it("filters addresses by label", async () => {
      await ctx.req("POST", "/addresses", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        label: "billing",
        line1: "Billing addr",
      })
      await ctx.req("POST", "/addresses", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        label: "shipping",
        line1: "Shipping addr",
      })
      const res = await ctx.req("GET", "/addresses?label=billing")
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: unknown[]; total: number }
      expect(json.total).toBe(1)
    })

    it("gets address by id", async () => {
      const createRes = await ctx.req("POST", "/addresses", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        line1: "Test",
      })
      const { data } = (await createRes.json()) as { data: { id: string } }
      const res = await ctx.req("GET", `/addresses/${data.id}`)
      expect(res.status).toBe(200)
    })

    it("returns 404 for unknown address", async () => {
      const res = await ctx.req("GET", `/addresses/${newId("identity_addresses")}`)
      expect(res.status).toBe(404)
    })

    it("updates an address", async () => {
      const createRes = await ctx.req("POST", "/addresses", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        line1: "Old St",
        city: "Old City",
      })
      const { data } = (await createRes.json()) as { data: { id: string } }
      const res = await ctx.req("PATCH", `/addresses/${data.id}`, {
        line1: "New St",
        city: "New City",
        postalCode: "10001",
      })
      expect(res.status).toBe(200)
      const json = (await res.json()) as {
        data: { line1: string; city: string; postalCode: string }
      }
      expect(json.data.line1).toBe("New St")
      expect(json.data.city).toBe("New City")
      expect(json.data.postalCode).toBe("10001")
    })

    it("returns 404 when updating unknown address", async () => {
      const res = await ctx.req("PATCH", `/addresses/${newId("identity_addresses")}`, {
        city: "Nowhere",
      })
      expect(res.status).toBe(404)
    })

    it("deletes an address", async () => {
      const createRes = await ctx.req("POST", "/addresses", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        line1: "Delete me",
      })
      const { data } = (await createRes.json()) as { data: { id: string } }
      const res = await ctx.req("DELETE", `/addresses/${data.id}`)
      expect(res.status).toBe(200)
      const get = await ctx.req("GET", `/addresses/${data.id}`)
      expect(get.status).toBe(404)
    })

    it("returns 404 when deleting unknown address", async () => {
      const res = await ctx.req("DELETE", `/addresses/${newId("identity_addresses")}`)
      expect(res.status).toBe(404)
    })

    it("enforces isPrimary uniqueness per entity", async () => {
      const firstRes = await ctx.req("POST", "/addresses", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        line1: "First",
        isPrimary: true,
      })
      const { data: first } = (await firstRes.json()) as { data: { id: string } }

      await ctx.req("POST", "/addresses", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        line1: "Second",
        isPrimary: true,
      })

      const getFirst = await ctx.req("GET", `/addresses/${first.id}`)
      const firstJson = (await getFirst.json()) as { data: { isPrimary: boolean } }
      expect(firstJson.data.isPrimary).toBe(false)
    })

    it("enforces isPrimary on update", async () => {
      const firstRes = await ctx.req("POST", "/addresses", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        line1: "First",
        isPrimary: true,
      })
      const { data: first } = (await firstRes.json()) as { data: { id: string } }

      const secondRes = await ctx.req("POST", "/addresses", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        line1: "Second",
      })
      const { data: second } = (await secondRes.json()) as { data: { id: string } }

      await ctx.req("PATCH", `/addresses/${second.id}`, { isPrimary: true })

      const getFirst = await ctx.req("GET", `/addresses/${first.id}`)
      const firstJson = (await getFirst.json()) as { data: { isPrimary: boolean } }
      expect(firstJson.data.isPrimary).toBe(false)

      const getSecond = await ctx.req("GET", `/addresses/${second.id}`)
      const secondJson = (await getSecond.json()) as { data: { isPrimary: boolean } }
      expect(secondJson.data.isPrimary).toBe(true)
    })

    it("stores coordinates", async () => {
      const res = await ctx.req("POST", "/addresses", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        line1: "Eiffel Tower",
        latitude: 48.8584,
        longitude: 2.2945,
        timezone: "Europe/Paris",
      })
      expect(res.status).toBe(201)
      const json = (await res.json()) as {
        data: { latitude: number; longitude: number; timezone: string }
      }
      expect(json.data.latitude).toBeCloseTo(48.8584)
      expect(json.data.longitude).toBeCloseTo(2.2945)
      expect(json.data.timezone).toBe("Europe/Paris")
    })
  })
})
