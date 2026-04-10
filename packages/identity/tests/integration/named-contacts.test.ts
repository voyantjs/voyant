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

describe.skipIf(!DB_AVAILABLE)("identity named-contact routes", () => {
  const ctx = createIdentityTestContext()

  describe("named-contacts", () => {
    it("creates a named contact", async () => {
      const res = await ctx.req("POST", "/named-contacts", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        role: "reservations",
        name: "Jane Doe",
        title: "Reservation Manager",
        email: "jane@hotel.com",
        phone: "+1234567890",
        isPrimary: true,
      })
      expect(res.status).toBe(201)
      const json = (await res.json()) as {
        data: {
          role: string
          name: string
          title: string
          email: string
          isPrimary: boolean
        }
      }
      expect(json.data.role).toBe("reservations")
      expect(json.data.name).toBe("Jane Doe")
      expect(json.data.title).toBe("Reservation Manager")
      expect(json.data.email).toBe("jane@hotel.com")
      expect(json.data.isPrimary).toBe(true)
    })

    it("lists named contacts", async () => {
      await ctx.req("POST", "/named-contacts", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        name: "Alice",
        role: "general",
      })
      const res = await ctx.req("GET", "/named-contacts")
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: unknown[]; total: number }
      expect(json.total).toBeGreaterThanOrEqual(1)
    })

    it("filters named contacts by entityType and entityId", async () => {
      await ctx.req("POST", "/named-contacts", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        name: "A",
      })
      await ctx.req("POST", "/named-contacts", {
        entityType: ENTITY_TYPE_2,
        entityId: ENTITY_ID_2,
        name: "B",
      })
      const res = await ctx.req(
        "GET",
        `/named-contacts?entityType=${ENTITY_TYPE}&entityId=${ENTITY_ID}`,
      )
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: unknown[]; total: number }
      expect(json.total).toBe(1)
    })

    it("filters named contacts by role", async () => {
      await ctx.req("POST", "/named-contacts", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        name: "Sales Rep",
        role: "sales",
      })
      await ctx.req("POST", "/named-contacts", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        name: "Emergency",
        role: "emergency",
      })
      const res = await ctx.req("GET", "/named-contacts?role=sales")
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: unknown[]; total: number }
      expect(json.total).toBe(1)
    })

    it("gets named contact by id", async () => {
      const createRes = await ctx.req("POST", "/named-contacts", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        name: "Bob",
      })
      const { data } = (await createRes.json()) as { data: { id: string } }
      const res = await ctx.req("GET", `/named-contacts/${data.id}`)
      expect(res.status).toBe(200)
    })

    it("returns 404 for unknown named contact", async () => {
      const res = await ctx.req("GET", `/named-contacts/${newId("identity_named_contacts")}`)
      expect(res.status).toBe(404)
    })

    it("updates a named contact", async () => {
      const createRes = await ctx.req("POST", "/named-contacts", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        name: "Old Name",
        role: "general",
      })
      const { data } = (await createRes.json()) as { data: { id: string } }
      const res = await ctx.req("PATCH", `/named-contacts/${data.id}`, {
        name: "New Name",
        role: "operations",
        phone: "+999",
      })
      expect(res.status).toBe(200)
      const json = (await res.json()) as {
        data: { name: string; role: string; phone: string }
      }
      expect(json.data.name).toBe("New Name")
      expect(json.data.role).toBe("operations")
      expect(json.data.phone).toBe("+999")
    })

    it("returns 404 when updating unknown named contact", async () => {
      const res = await ctx.req("PATCH", `/named-contacts/${newId("identity_named_contacts")}`, {
        name: "Ghost",
      })
      expect(res.status).toBe(404)
    })

    it("deletes a named contact", async () => {
      const createRes = await ctx.req("POST", "/named-contacts", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        name: "Delete Me",
      })
      const { data } = (await createRes.json()) as { data: { id: string } }
      const res = await ctx.req("DELETE", `/named-contacts/${data.id}`)
      expect(res.status).toBe(200)
      const get = await ctx.req("GET", `/named-contacts/${data.id}`)
      expect(get.status).toBe(404)
    })

    it("returns 404 when deleting unknown named contact", async () => {
      const res = await ctx.req("DELETE", `/named-contacts/${newId("identity_named_contacts")}`)
      expect(res.status).toBe(404)
    })

    it("enforces isPrimary uniqueness per entity", async () => {
      const firstRes = await ctx.req("POST", "/named-contacts", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        name: "First",
        isPrimary: true,
      })
      const { data: first } = (await firstRes.json()) as { data: { id: string } }

      await ctx.req("POST", "/named-contacts", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        name: "Second",
        isPrimary: true,
      })

      const getFirst = await ctx.req("GET", `/named-contacts/${first.id}`)
      const firstJson = (await getFirst.json()) as { data: { isPrimary: boolean } }
      expect(firstJson.data.isPrimary).toBe(false)
    })

    it("enforces isPrimary on update", async () => {
      const firstRes = await ctx.req("POST", "/named-contacts", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        name: "First",
        isPrimary: true,
      })
      const { data: first } = (await firstRes.json()) as { data: { id: string } }

      const secondRes = await ctx.req("POST", "/named-contacts", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        name: "Second",
      })
      const { data: second } = (await secondRes.json()) as { data: { id: string } }

      await ctx.req("PATCH", `/named-contacts/${second.id}`, { isPrimary: true })

      const getFirst = await ctx.req("GET", `/named-contacts/${first.id}`)
      const firstJson = (await getFirst.json()) as { data: { isPrimary: boolean } }
      expect(firstJson.data.isPrimary).toBe(false)

      const getSecond = await ctx.req("GET", `/named-contacts/${second.id}`)
      const secondJson = (await getSecond.json()) as { data: { isPrimary: boolean } }
      expect(secondJson.data.isPrimary).toBe(true)
    })
  })
})
