import { newId } from "@voyantjs/db/lib/typeid"
import { cleanupTestDb, createTestDb } from "@voyantjs/db/test-utils"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { Hono } from "hono"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"
import { identityRoutes } from "../../src/routes.js"

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL
let DB_AVAILABLE = false

if (TEST_DATABASE_URL) {
  try {
    const testDb = createTestDb()
    await testDb.execute(/* sql */ `SELECT 1`)
    DB_AVAILABLE = true
  } catch {
    DB_AVAILABLE = false
  }
}

describe.skipIf(!DB_AVAILABLE)("identity routes", () => {
  let db: PostgresJsDatabase
  let app: ReturnType<typeof createApp>

  // Polymorphic entity references (no FK — just strings)
  const ENTITY_TYPE = "supplier"
  const ENTITY_ID = "supp_test123"
  const ENTITY_TYPE_2 = "person"
  const ENTITY_ID_2 = "prsn_test456"

  function createApp() {
    const hono = new Hono()
    hono.use("*", async (c, next) => {
      c.set("db" as never, db)
      c.set("userId" as never, "test-user")
      await next()
    })
    hono.route("/v1/identity", identityRoutes)
    return hono
  }

  function req(method: string, path: string, body?: unknown) {
    const init: RequestInit = { method, headers: { "Content-Type": "application/json" } }
    if (body) init.body = JSON.stringify(body)
    return app.request(`/v1/identity${path}`, init)
  }

  beforeAll(async () => {
    db = createTestDb()
  })

  afterAll(async () => {
    await cleanupTestDb(db)
  })

  beforeEach(async () => {
    await cleanupTestDb(db)
    app = createApp()
  })

  // ─── Contact Points ────────────────────────────────────
  describe("contact-points", () => {
    it("creates a contact point", async () => {
      const res = await req("POST", "/contact-points", {
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
      await req("POST", "/contact-points", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        kind: "phone",
        value: "+1234567890",
      })
      const res = await req("GET", "/contact-points")
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: unknown[]; total: number }
      expect(json.total).toBeGreaterThanOrEqual(1)
    })

    it("filters contact points by entityType and entityId", async () => {
      await req("POST", "/contact-points", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        kind: "email",
        value: "a@test.com",
      })
      await req("POST", "/contact-points", {
        entityType: ENTITY_TYPE_2,
        entityId: ENTITY_ID_2,
        kind: "email",
        value: "b@test.com",
      })
      const res = await req(
        "GET",
        `/contact-points?entityType=${ENTITY_TYPE}&entityId=${ENTITY_ID}`,
      )
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: unknown[]; total: number }
      expect(json.total).toBe(1)
    })

    it("filters contact points by kind", async () => {
      await req("POST", "/contact-points", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        kind: "phone",
        value: "+111",
      })
      await req("POST", "/contact-points", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        kind: "email",
        value: "x@test.com",
      })
      const res = await req("GET", "/contact-points?kind=phone")
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: unknown[]; total: number }
      expect(json.total).toBe(1)
    })

    it("gets contact point by id", async () => {
      const cr = await req("POST", "/contact-points", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        kind: "website",
        value: "https://hotel.com",
      })
      const { data } = (await cr.json()) as { data: { id: string } }
      const res = await req("GET", `/contact-points/${data.id}`)
      expect(res.status).toBe(200)
    })

    it("returns 404 for unknown contact point", async () => {
      const res = await req("GET", `/contact-points/${newId("identity_contact_points")}`)
      expect(res.status).toBe(404)
    })

    it("updates a contact point", async () => {
      const cr = await req("POST", "/contact-points", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        kind: "phone",
        value: "+111",
      })
      const { data } = (await cr.json()) as { data: { id: string } }
      const res = await req("PATCH", `/contact-points/${data.id}`, {
        value: "+222",
        label: "Office",
      })
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: { value: string; label: string } }
      expect(json.data.value).toBe("+222")
      expect(json.data.label).toBe("Office")
    })

    it("returns 404 when updating unknown contact point", async () => {
      const res = await req("PATCH", `/contact-points/${newId("identity_contact_points")}`, {
        value: "new",
      })
      expect(res.status).toBe(404)
    })

    it("deletes a contact point", async () => {
      const cr = await req("POST", "/contact-points", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        kind: "fax",
        value: "+999",
      })
      const { data } = (await cr.json()) as { data: { id: string } }
      const res = await req("DELETE", `/contact-points/${data.id}`)
      expect(res.status).toBe(200)
      const get = await req("GET", `/contact-points/${data.id}`)
      expect(get.status).toBe(404)
    })

    it("returns 404 when deleting unknown contact point", async () => {
      const res = await req("DELETE", `/contact-points/${newId("identity_contact_points")}`)
      expect(res.status).toBe(404)
    })

    it("enforces isPrimary uniqueness per entity+kind", async () => {
      // Create first as primary
      const cr1 = await req("POST", "/contact-points", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        kind: "email",
        value: "first@test.com",
        isPrimary: true,
      })
      const { data: d1 } = (await cr1.json()) as { data: { id: string } }

      // Create second as primary — should demote first
      await req("POST", "/contact-points", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        kind: "email",
        value: "second@test.com",
        isPrimary: true,
      })

      const get1 = await req("GET", `/contact-points/${d1.id}`)
      const json1 = (await get1.json()) as { data: { isPrimary: boolean } }
      expect(json1.data.isPrimary).toBe(false)
    })

    it("enforces isPrimary on update", async () => {
      const cr1 = await req("POST", "/contact-points", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        kind: "phone",
        value: "+111",
        isPrimary: true,
      })
      const { data: d1 } = (await cr1.json()) as { data: { id: string } }

      const cr2 = await req("POST", "/contact-points", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        kind: "phone",
        value: "+222",
      })
      const { data: d2 } = (await cr2.json()) as { data: { id: string } }

      // Update second to primary — should demote first
      await req("PATCH", `/contact-points/${d2.id}`, { isPrimary: true })

      const get1 = await req("GET", `/contact-points/${d1.id}`)
      const json1 = (await get1.json()) as { data: { isPrimary: boolean } }
      expect(json1.data.isPrimary).toBe(false)

      const get2 = await req("GET", `/contact-points/${d2.id}`)
      const json2 = (await get2.json()) as { data: { isPrimary: boolean } }
      expect(json2.data.isPrimary).toBe(true)
    })
  })

  // ─── Addresses ─────────────────────────────────────────
  describe("addresses", () => {
    it("creates an address", async () => {
      const res = await req("POST", "/addresses", {
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
      await req("POST", "/addresses", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        line1: "1 Rue Test",
        city: "Lyon",
      })
      const res = await req("GET", "/addresses")
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: unknown[]; total: number }
      expect(json.total).toBeGreaterThanOrEqual(1)
    })

    it("filters addresses by entityType and entityId", async () => {
      await req("POST", "/addresses", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        line1: "A",
      })
      await req("POST", "/addresses", {
        entityType: ENTITY_TYPE_2,
        entityId: ENTITY_ID_2,
        line1: "B",
      })
      const res = await req("GET", `/addresses?entityType=${ENTITY_TYPE}&entityId=${ENTITY_ID}`)
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: unknown[]; total: number }
      expect(json.total).toBe(1)
    })

    it("filters addresses by label", async () => {
      await req("POST", "/addresses", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        label: "billing",
        line1: "Billing addr",
      })
      await req("POST", "/addresses", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        label: "shipping",
        line1: "Shipping addr",
      })
      const res = await req("GET", "/addresses?label=billing")
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: unknown[]; total: number }
      expect(json.total).toBe(1)
    })

    it("gets address by id", async () => {
      const cr = await req("POST", "/addresses", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        line1: "Test",
      })
      const { data } = (await cr.json()) as { data: { id: string } }
      const res = await req("GET", `/addresses/${data.id}`)
      expect(res.status).toBe(200)
    })

    it("returns 404 for unknown address", async () => {
      const res = await req("GET", `/addresses/${newId("identity_addresses")}`)
      expect(res.status).toBe(404)
    })

    it("updates an address", async () => {
      const cr = await req("POST", "/addresses", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        line1: "Old St",
        city: "Old City",
      })
      const { data } = (await cr.json()) as { data: { id: string } }
      const res = await req("PATCH", `/addresses/${data.id}`, {
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
      const res = await req("PATCH", `/addresses/${newId("identity_addresses")}`, {
        city: "Nowhere",
      })
      expect(res.status).toBe(404)
    })

    it("deletes an address", async () => {
      const cr = await req("POST", "/addresses", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        line1: "Delete me",
      })
      const { data } = (await cr.json()) as { data: { id: string } }
      const res = await req("DELETE", `/addresses/${data.id}`)
      expect(res.status).toBe(200)
      const get = await req("GET", `/addresses/${data.id}`)
      expect(get.status).toBe(404)
    })

    it("returns 404 when deleting unknown address", async () => {
      const res = await req("DELETE", `/addresses/${newId("identity_addresses")}`)
      expect(res.status).toBe(404)
    })

    it("enforces isPrimary uniqueness per entity", async () => {
      const cr1 = await req("POST", "/addresses", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        line1: "First",
        isPrimary: true,
      })
      const { data: d1 } = (await cr1.json()) as { data: { id: string } }

      // Second primary should demote first
      await req("POST", "/addresses", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        line1: "Second",
        isPrimary: true,
      })

      const get1 = await req("GET", `/addresses/${d1.id}`)
      const json1 = (await get1.json()) as { data: { isPrimary: boolean } }
      expect(json1.data.isPrimary).toBe(false)
    })

    it("enforces isPrimary on update", async () => {
      const cr1 = await req("POST", "/addresses", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        line1: "First",
        isPrimary: true,
      })
      const { data: d1 } = (await cr1.json()) as { data: { id: string } }

      const cr2 = await req("POST", "/addresses", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        line1: "Second",
      })
      const { data: d2 } = (await cr2.json()) as { data: { id: string } }

      await req("PATCH", `/addresses/${d2.id}`, { isPrimary: true })

      const get1 = await req("GET", `/addresses/${d1.id}`)
      const json1 = (await get1.json()) as { data: { isPrimary: boolean } }
      expect(json1.data.isPrimary).toBe(false)

      const get2 = await req("GET", `/addresses/${d2.id}`)
      const json2 = (await get2.json()) as { data: { isPrimary: boolean } }
      expect(json2.data.isPrimary).toBe(true)
    })

    it("stores coordinates", async () => {
      const res = await req("POST", "/addresses", {
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

  // ─── Named Contacts ────────────────────────────────────
  describe("named-contacts", () => {
    it("creates a named contact", async () => {
      const res = await req("POST", "/named-contacts", {
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
      await req("POST", "/named-contacts", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        name: "Alice",
        role: "general",
      })
      const res = await req("GET", "/named-contacts")
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: unknown[]; total: number }
      expect(json.total).toBeGreaterThanOrEqual(1)
    })

    it("filters named contacts by entityType and entityId", async () => {
      await req("POST", "/named-contacts", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        name: "A",
      })
      await req("POST", "/named-contacts", {
        entityType: ENTITY_TYPE_2,
        entityId: ENTITY_ID_2,
        name: "B",
      })
      const res = await req(
        "GET",
        `/named-contacts?entityType=${ENTITY_TYPE}&entityId=${ENTITY_ID}`,
      )
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: unknown[]; total: number }
      expect(json.total).toBe(1)
    })

    it("filters named contacts by role", async () => {
      await req("POST", "/named-contacts", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        name: "Sales Rep",
        role: "sales",
      })
      await req("POST", "/named-contacts", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        name: "Emergency",
        role: "emergency",
      })
      const res = await req("GET", "/named-contacts?role=sales")
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: unknown[]; total: number }
      expect(json.total).toBe(1)
    })

    it("gets named contact by id", async () => {
      const cr = await req("POST", "/named-contacts", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        name: "Bob",
      })
      const { data } = (await cr.json()) as { data: { id: string } }
      const res = await req("GET", `/named-contacts/${data.id}`)
      expect(res.status).toBe(200)
    })

    it("returns 404 for unknown named contact", async () => {
      const res = await req("GET", `/named-contacts/${newId("identity_named_contacts")}`)
      expect(res.status).toBe(404)
    })

    it("updates a named contact", async () => {
      const cr = await req("POST", "/named-contacts", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        name: "Old Name",
        role: "general",
      })
      const { data } = (await cr.json()) as { data: { id: string } }
      const res = await req("PATCH", `/named-contacts/${data.id}`, {
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
      const res = await req("PATCH", `/named-contacts/${newId("identity_named_contacts")}`, {
        name: "Ghost",
      })
      expect(res.status).toBe(404)
    })

    it("deletes a named contact", async () => {
      const cr = await req("POST", "/named-contacts", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        name: "Delete Me",
      })
      const { data } = (await cr.json()) as { data: { id: string } }
      const res = await req("DELETE", `/named-contacts/${data.id}`)
      expect(res.status).toBe(200)
      const get = await req("GET", `/named-contacts/${data.id}`)
      expect(get.status).toBe(404)
    })

    it("returns 404 when deleting unknown named contact", async () => {
      const res = await req("DELETE", `/named-contacts/${newId("identity_named_contacts")}`)
      expect(res.status).toBe(404)
    })

    it("enforces isPrimary uniqueness per entity", async () => {
      const cr1 = await req("POST", "/named-contacts", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        name: "First",
        isPrimary: true,
      })
      const { data: d1 } = (await cr1.json()) as { data: { id: string } }

      await req("POST", "/named-contacts", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        name: "Second",
        isPrimary: true,
      })

      const get1 = await req("GET", `/named-contacts/${d1.id}`)
      const json1 = (await get1.json()) as { data: { isPrimary: boolean } }
      expect(json1.data.isPrimary).toBe(false)
    })

    it("enforces isPrimary on update", async () => {
      const cr1 = await req("POST", "/named-contacts", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        name: "First",
        isPrimary: true,
      })
      const { data: d1 } = (await cr1.json()) as { data: { id: string } }

      const cr2 = await req("POST", "/named-contacts", {
        entityType: ENTITY_TYPE,
        entityId: ENTITY_ID,
        name: "Second",
      })
      const { data: d2 } = (await cr2.json()) as { data: { id: string } }

      await req("PATCH", `/named-contacts/${d2.id}`, { isPrimary: true })

      const get1 = await req("GET", `/named-contacts/${d1.id}`)
      const json1 = (await get1.json()) as { data: { isPrimary: boolean } }
      expect(json1.data.isPrimary).toBe(false)

      const get2 = await req("GET", `/named-contacts/${d2.id}`)
      const json2 = (await get2.json()) as { data: { isPrimary: boolean } }
      expect(json2.data.isPrimary).toBe(true)
    })
  })

  // ─── Entity-Scoped Routes ─────────────────────────────
  describe("entity-scoped routes", () => {
    describe("contact points for entity", () => {
      it("creates a contact point via entity route", async () => {
        const res = await req("POST", `/entities/${ENTITY_TYPE}/${ENTITY_ID}/contact-points`, {
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
        // Create for target entity
        await req("POST", `/entities/${ENTITY_TYPE}/${ENTITY_ID}/contact-points`, {
          kind: "phone",
          value: "+111",
        })
        // Create for different entity
        await req("POST", `/entities/${ENTITY_TYPE_2}/${ENTITY_ID_2}/contact-points`, {
          kind: "phone",
          value: "+222",
        })

        const res = await req("GET", `/entities/${ENTITY_TYPE}/${ENTITY_ID}/contact-points`)
        expect(res.status).toBe(200)
        const json = (await res.json()) as { data: Array<{ entityId: string }> }
        expect(json.data.length).toBe(1)
        expect(json.data[0]?.entityId).toBe(ENTITY_ID)
      })
    })

    describe("addresses for entity", () => {
      it("creates an address via entity route", async () => {
        const res = await req("POST", `/entities/${ENTITY_TYPE}/${ENTITY_ID}/addresses`, {
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
        await req("POST", `/entities/${ENTITY_TYPE}/${ENTITY_ID}/addresses`, {
          line1: "A",
        })
        await req("POST", `/entities/${ENTITY_TYPE_2}/${ENTITY_ID_2}/addresses`, {
          line1: "B",
        })

        const res = await req("GET", `/entities/${ENTITY_TYPE}/${ENTITY_ID}/addresses`)
        expect(res.status).toBe(200)
        const json = (await res.json()) as { data: Array<{ entityId: string }> }
        expect(json.data.length).toBe(1)
        expect(json.data[0]?.entityId).toBe(ENTITY_ID)
      })
    })

    describe("named contacts for entity", () => {
      it("creates a named contact via entity route", async () => {
        const res = await req("POST", `/entities/${ENTITY_TYPE}/${ENTITY_ID}/named-contacts`, {
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
        await req("POST", `/entities/${ENTITY_TYPE}/${ENTITY_ID}/named-contacts`, {
          name: "A",
        })
        await req("POST", `/entities/${ENTITY_TYPE_2}/${ENTITY_ID_2}/named-contacts`, {
          name: "B",
        })

        const res = await req("GET", `/entities/${ENTITY_TYPE}/${ENTITY_ID}/named-contacts`)
        expect(res.status).toBe(200)
        const json = (await res.json()) as { data: Array<{ entityId: string }> }
        expect(json.data.length).toBe(1)
        expect(json.data[0]?.entityId).toBe(ENTITY_ID)
      })
    })
  })
})
