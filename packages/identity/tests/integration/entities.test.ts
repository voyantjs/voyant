import { describe, expect, it } from "vitest"

import {
  createIdentityTestContext,
  DB_AVAILABLE,
  ENTITY_ID,
  ENTITY_ID_2,
  ENTITY_TYPE,
  ENTITY_TYPE_2,
} from "./test-helpers"

describe.skipIf(!DB_AVAILABLE)("identity entity-scoped routes", () => {
  const ctx = createIdentityTestContext()

  describe("contact points for entity", () => {
    it("creates a contact point via entity route", async () => {
      const res = await ctx.req("POST", `/entities/${ENTITY_TYPE}/${ENTITY_ID}/contact-points`, {
        kind: "email",
        value: "entity@test.com",
        isPrimary: true,
      })
      expect(res.status).toBe(201)
      const json = (await res.json()) as {
        data: { entityType: string; entityId: string; value: string }
      }
      expect(json.data.entityType).toBe(ENTITY_TYPE)
      expect(json.data.entityId).toBe(ENTITY_ID)
      expect(json.data.value).toBe("entity@test.com")
    })

    it("lists contact points for a specific entity", async () => {
      await ctx.req("POST", `/entities/${ENTITY_TYPE}/${ENTITY_ID}/contact-points`, {
        kind: "phone",
        value: "+111",
      })
      await ctx.req("POST", `/entities/${ENTITY_TYPE_2}/${ENTITY_ID_2}/contact-points`, {
        kind: "phone",
        value: "+222",
      })

      const res = await ctx.req("GET", `/entities/${ENTITY_TYPE}/${ENTITY_ID}/contact-points`)
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: Array<{ entityId: string }> }
      expect(json.data.length).toBe(1)
      expect(json.data[0]?.entityId).toBe(ENTITY_ID)
    })
  })

  describe("addresses for entity", () => {
    it("creates an address via entity route", async () => {
      const res = await ctx.req("POST", `/entities/${ENTITY_TYPE}/${ENTITY_ID}/addresses`, {
        label: "billing",
        line1: "456 Oak Ave",
        city: "London",
        country: "GB",
      })
      expect(res.status).toBe(201)
      const json = (await res.json()) as {
        data: { entityType: string; entityId: string; city: string; label: string }
      }
      expect(json.data.entityType).toBe(ENTITY_TYPE)
      expect(json.data.entityId).toBe(ENTITY_ID)
      expect(json.data.city).toBe("London")
      expect(json.data.label).toBe("billing")
    })

    it("lists addresses for a specific entity", async () => {
      await ctx.req("POST", `/entities/${ENTITY_TYPE}/${ENTITY_ID}/addresses`, {
        line1: "A",
      })
      await ctx.req("POST", `/entities/${ENTITY_TYPE_2}/${ENTITY_ID_2}/addresses`, {
        line1: "B",
      })

      const res = await ctx.req("GET", `/entities/${ENTITY_TYPE}/${ENTITY_ID}/addresses`)
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: Array<{ entityId: string }> }
      expect(json.data.length).toBe(1)
      expect(json.data[0]?.entityId).toBe(ENTITY_ID)
    })
  })

  describe("named contacts for entity", () => {
    it("creates a named contact via entity route", async () => {
      const res = await ctx.req("POST", `/entities/${ENTITY_TYPE}/${ENTITY_ID}/named-contacts`, {
        name: "Entity Contact",
        role: "front_desk",
        email: "front@hotel.com",
      })
      expect(res.status).toBe(201)
      const json = (await res.json()) as {
        data: { entityType: string; entityId: string; name: string; role: string }
      }
      expect(json.data.entityType).toBe(ENTITY_TYPE)
      expect(json.data.entityId).toBe(ENTITY_ID)
      expect(json.data.name).toBe("Entity Contact")
      expect(json.data.role).toBe("front_desk")
    })

    it("lists named contacts for a specific entity", async () => {
      await ctx.req("POST", `/entities/${ENTITY_TYPE}/${ENTITY_ID}/named-contacts`, {
        name: "A",
      })
      await ctx.req("POST", `/entities/${ENTITY_TYPE_2}/${ENTITY_ID_2}/named-contacts`, {
        name: "B",
      })

      const res = await ctx.req("GET", `/entities/${ENTITY_TYPE}/${ENTITY_ID}/named-contacts`)
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: Array<{ entityId: string }> }
      expect(json.data.length).toBe(1)
      expect(json.data[0]?.entityId).toBe(ENTITY_ID)
    })
  })
})
