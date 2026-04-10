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

describe.skipIf(!DB_AVAILABLE)("identity contact-point routes", () => {
  const ctx = createIdentityTestContext()

  describe("contact-points", () => {
    it("creates a contact point", async () => {
      const res = await ctx.req("POST", "/contact-points", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        kind: "email",
        value: "info@hotel.com",
        isPrimary: true,
      })
      expect(res.status).toBe(201)
      const json = (await res.json()) as {
        data: { kind: string; value: string; isPrimary: boolean; entityType: string }
      }
      expect(json.data.kind).toBe("email")
      expect(json.data.value).toBe("info@hotel.com")
      expect(json.data.isPrimary).toBe(true)
      expect(json.data.entityType).toBe(ENTITY_TYPE)
    })

    it("lists contact points", async () => {
      await ctx.req("POST", "/contact-points", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        kind: "phone",
        value: "+1234567890",
      })
      const res = await ctx.req("GET", "/contact-points")
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: unknown[]; total: number }
      expect(json.total).toBeGreaterThanOrEqual(1)
    })

    it("filters contact points by entityType and entityId", async () => {
      await ctx.req("POST", "/contact-points", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        kind: "email",
        value: "a@test.com",
      })
      await ctx.req("POST", "/contact-points", {
        entityType: ENTITY_TYPE_2,
        entityId: ENTITY_ID_2,
        kind: "email",
        value: "b@test.com",
      })
      const res = await ctx.req(
        "GET",
        `/contact-points?entityType=${ENTITY_TYPE}&entityId=${ENTITY_ID}`,
      )
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: unknown[]; total: number }
      expect(json.total).toBe(1)
    })

    it("filters contact points by kind", async () => {
      await ctx.req("POST", "/contact-points", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        kind: "phone",
        value: "+111",
      })
      await ctx.req("POST", "/contact-points", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        kind: "email",
        value: "x@test.com",
      })
      const res = await ctx.req("GET", "/contact-points?kind=phone")
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: unknown[]; total: number }
      expect(json.total).toBe(1)
    })

    it("gets contact point by id", async () => {
      const createRes = await ctx.req("POST", "/contact-points", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        kind: "website",
        value: "https://hotel.com",
      })
      const { data } = (await createRes.json()) as { data: { id: string } }
      const res = await ctx.req("GET", `/contact-points/${data.id}`)
      expect(res.status).toBe(200)
    })

    it("returns 404 for unknown contact point", async () => {
      const res = await ctx.req("GET", `/contact-points/${newId("identity_contact_points")}`)
      expect(res.status).toBe(404)
    })

    it("updates a contact point", async () => {
      const createRes = await ctx.req("POST", "/contact-points", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        kind: "phone",
        value: "+111",
      })
      const { data } = (await createRes.json()) as { data: { id: string } }
      const res = await ctx.req("PATCH", `/contact-points/${data.id}`, {
        value: "+222",
        label: "Office",
      })
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: { value: string; label: string } }
      expect(json.data.value).toBe("+222")
      expect(json.data.label).toBe("Office")
    })

    it("returns 404 when updating unknown contact point", async () => {
      const res = await ctx.req("PATCH", `/contact-points/${newId("identity_contact_points")}`, {
        value: "new",
      })
      expect(res.status).toBe(404)
    })

    it("deletes a contact point", async () => {
      const createRes = await ctx.req("POST", "/contact-points", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        kind: "fax",
        value: "+999",
      })
      const { data } = (await createRes.json()) as { data: { id: string } }
      const res = await ctx.req("DELETE", `/contact-points/${data.id}`)
      expect(res.status).toBe(200)
      const get = await ctx.req("GET", `/contact-points/${data.id}`)
      expect(get.status).toBe(404)
    })

    it("returns 404 when deleting unknown contact point", async () => {
      const res = await ctx.req("DELETE", `/contact-points/${newId("identity_contact_points")}`)
      expect(res.status).toBe(404)
    })

    it("enforces isPrimary uniqueness per entity+kind", async () => {
      const firstRes = await ctx.req("POST", "/contact-points", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        kind: "email",
        value: "first@test.com",
        isPrimary: true,
      })
      const { data: first } = (await firstRes.json()) as { data: { id: string } }

      await ctx.req("POST", "/contact-points", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        kind: "email",
        value: "second@test.com",
        isPrimary: true,
      })

      const getFirst = await ctx.req("GET", `/contact-points/${first.id}`)
      const firstJson = (await getFirst.json()) as { data: { isPrimary: boolean } }
      expect(firstJson.data.isPrimary).toBe(false)
    })

    it("enforces isPrimary on update", async () => {
      const firstRes = await ctx.req("POST", "/contact-points", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        kind: "phone",
        value: "+111",
        isPrimary: true,
      })
      const { data: first } = (await firstRes.json()) as { data: { id: string } }

      const secondRes = await ctx.req("POST", "/contact-points", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        kind: "phone",
        value: "+222",
      })
      const { data: second } = (await secondRes.json()) as { data: { id: string } }

      await ctx.req("PATCH", `/contact-points/${second.id}`, { isPrimary: true })

      const getFirst = await ctx.req("GET", `/contact-points/${first.id}`)
      const firstJson = (await getFirst.json()) as { data: { isPrimary: boolean } }
      expect(firstJson.data.isPrimary).toBe(false)

      const getSecond = await ctx.req("GET", `/contact-points/${second.id}`)
      const secondJson = (await getSecond.json()) as { data: { isPrimary: boolean } }
      expect(secondJson.data.isPrimary).toBe(true)
    })
  })
})
