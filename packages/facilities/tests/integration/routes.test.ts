import { Hono } from "hono"
import { beforeAll, beforeEach, describe, expect, it } from "vitest"

import { facilitiesRoutes } from "../../src/routes.js"

const DB_AVAILABLE = !!process.env.TEST_DATABASE_URL
const json = (body: Record<string, unknown>) => ({
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
})

let seq = 0
function nextSeq() {
  seq++
  return String(seq).padStart(4, "0")
}

describe.skipIf(!DB_AVAILABLE)("Facilities routes", () => {
  let app: Hono
  let db: ReturnType<typeof import("@voyantjs/db/test-utils").createTestDb>

  beforeAll(async () => {
    const { createTestDb, cleanupTestDb } = await import("@voyantjs/db/test-utils")
    db = createTestDb()
    await cleanupTestDb(db)

    app = new Hono()
    app.use("*", async (c, next) => {
      c.set("db" as never, db)
      c.set("userId" as never, "test-user-id")
      await next()
    })
    app.route("/", facilitiesRoutes)
  })

  beforeEach(async () => {
    const { cleanupTestDb } = await import("@voyantjs/db/test-utils")
    await cleanupTestDb(db)
  })

  // ─── Seed Helpers ─────────────────────────────────────────

  async function seedFacility(overrides: Record<string, unknown> = {}) {
    const body = {
      kind: "hotel",
      name: `Facility ${nextSeq()}`,
      ...overrides,
    }
    const res = await app.request("/facilities", { method: "POST", ...json(body) })
    expect(res.status).toBe(201)
    const { data } = await res.json()
    return data as { id: string; [k: string]: unknown }
  }

  async function seedProperty(facilityId: string, overrides: Record<string, unknown> = {}) {
    const body = { facilityId, ...overrides }
    const res = await app.request("/properties", { method: "POST", ...json(body) })
    expect(res.status).toBe(201)
    const { data } = await res.json()
    return data as { id: string; facilityId: string; [k: string]: unknown }
  }

  async function seedPropertyGroup(overrides: Record<string, unknown> = {}) {
    const body = { name: `Group ${nextSeq()}`, ...overrides }
    const res = await app.request("/property-groups", { method: "POST", ...json(body) })
    expect(res.status).toBe(201)
    const { data } = await res.json()
    return data as { id: string; [k: string]: unknown }
  }

  // ─── Facilities CRUD ──────────────────────────────────────

  describe("Facilities", () => {
    it("creates a facility with defaults", async () => {
      const f = await seedFacility()
      expect(f.id).toMatch(/^faci_/)
      expect(f.kind).toBe("hotel")
      expect(f.status).toBe("active")
    })

    it("creates a facility with address fields", async () => {
      const f = await seedFacility({
        kind: "resort",
        addressLine1: "123 Beach Rd",
        city: "Cancun",
        country: "MX",
        latitude: 21.1619,
        longitude: -86.8515,
      })
      expect(f.addressLine1).toBe("123 Beach Rd")
      expect(f.city).toBe("Cancun")
      expect(f.country).toBe("MX")
      expect(f.latitude).toBe(21.1619)
      expect(f.address).toContain("123 Beach Rd")
    })

    it("gets a facility by id", async () => {
      const f = await seedFacility()
      const res = await app.request(`/facilities/${f.id}`, { method: "GET" })
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(data.id).toBe(f.id)
    })

    it("returns 404 for non-existent facility", async () => {
      const res = await app.request("/facilities/faci_00000000000000000000000000", {
        method: "GET",
      })
      expect(res.status).toBe(404)
    })

    it("updates a facility", async () => {
      const f = await seedFacility()
      const res = await app.request(`/facilities/${f.id}`, {
        method: "PATCH",
        ...json({ name: "Updated Hotel", status: "inactive" }),
      })
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(data.name).toBe("Updated Hotel")
      expect(data.status).toBe("inactive")
    })

    it("updates facility address fields", async () => {
      const f = await seedFacility({ city: "Paris" })
      const res = await app.request(`/facilities/${f.id}`, {
        method: "PATCH",
        ...json({ city: "Lyon" }),
      })
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(data.city).toBe("Lyon")
    })

    it("returns 404 when updating non-existent facility", async () => {
      const res = await app.request("/facilities/faci_00000000000000000000000000", {
        method: "PATCH",
        ...json({ name: "x" }),
      })
      expect(res.status).toBe(404)
    })

    it("deletes a facility", async () => {
      const f = await seedFacility()
      const res = await app.request(`/facilities/${f.id}`, { method: "DELETE" })
      expect(res.status).toBe(200)

      const check = await app.request(`/facilities/${f.id}`, { method: "GET" })
      expect(check.status).toBe(404)
    })

    it("returns 404 when deleting non-existent facility", async () => {
      const res = await app.request("/facilities/faci_00000000000000000000000000", {
        method: "DELETE",
      })
      expect(res.status).toBe(404)
    })
  })

  describe("Facilities list & filters", () => {
    it("lists with pagination", async () => {
      await seedFacility()
      await seedFacility()
      await seedFacility()
      const res = await app.request("/facilities?limit=2", { method: "GET" })
      const body = await res.json()
      expect(body.data.length).toBe(2)
      expect(body.total).toBe(3)
    })

    it("filters by kind", async () => {
      await seedFacility({ kind: "hotel" })
      await seedFacility({ kind: "airport" })
      const res = await app.request("/facilities?kind=airport", { method: "GET" })
      const body = await res.json()
      expect(body.total).toBe(1)
      expect(body.data[0].kind).toBe("airport")
    })

    it("filters by status", async () => {
      await seedFacility({ status: "active" })
      await seedFacility({ status: "archived" })
      const res = await app.request("/facilities?status=archived", { method: "GET" })
      const body = await res.json()
      expect(body.total).toBe(1)
      expect(body.data[0].status).toBe("archived")
    })

    it("searches by name", async () => {
      await seedFacility({ name: "Grand Hotel Plaza" })
      await seedFacility({ name: "Airport Lounge" })
      const res = await app.request("/facilities?search=Grand", { method: "GET" })
      const body = await res.json()
      expect(body.total).toBe(1)
      expect(body.data[0].name).toBe("Grand Hotel Plaza")
    })
  })

  // ─── Contact Points (identity) ────────────────────────────

  describe("Facility Contact Points", () => {
    it("creates and lists contact points for a facility", async () => {
      const f = await seedFacility()
      const createRes = await app.request(`/facilities/${f.id}/contact-points`, {
        method: "POST",
        ...json({ kind: "phone", value: "+1-555-0100" }),
      })
      expect(createRes.status).toBe(201)
      const { data: cp } = await createRes.json()
      expect(cp.id).toMatch(/^idcp_/)
      expect(cp.value).toBe("+1-555-0100")

      const listRes = await app.request(`/facilities/${f.id}/contact-points`, { method: "GET" })
      expect(listRes.status).toBe(200)
      const { data: list } = await listRes.json()
      expect(list.length).toBe(1)
    })

    it("returns 404 when creating contact point for non-existent facility", async () => {
      const res = await app.request("/facilities/faci_00000000000000000000000000/contact-points", {
        method: "POST",
        ...json({ kind: "email", value: "test@example.com" }),
      })
      expect(res.status).toBe(404)
    })

    it("updates a contact point", async () => {
      const f = await seedFacility()
      const createRes = await app.request(`/facilities/${f.id}/contact-points`, {
        method: "POST",
        ...json({ kind: "email", value: "old@example.com" }),
      })
      const { data: cp } = await createRes.json()

      const res = await app.request(`/contact-points/${cp.id}`, {
        method: "PATCH",
        ...json({ value: "new@example.com" }),
      })
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(data.value).toBe("new@example.com")
    })

    it("deletes a contact point", async () => {
      const f = await seedFacility()
      const createRes = await app.request(`/facilities/${f.id}/contact-points`, {
        method: "POST",
        ...json({ kind: "website", value: "https://example.com" }),
      })
      const { data: cp } = await createRes.json()

      const res = await app.request(`/contact-points/${cp.id}`, { method: "DELETE" })
      expect(res.status).toBe(200)
    })
  })

  // ─── Addresses (identity) ─────────────────────────────────

  describe("Facility Addresses", () => {
    it("creates and lists addresses for a facility", async () => {
      const f = await seedFacility()
      const createRes = await app.request(`/facilities/${f.id}/addresses`, {
        method: "POST",
        ...json({ label: "billing", line1: "456 Corp Ave", city: "London", country: "GB" }),
      })
      expect(createRes.status).toBe(201)
      const { data: addr } = await createRes.json()
      expect(addr.id).toMatch(/^idad_/)
      expect(addr.city).toBe("London")

      const listRes = await app.request(`/facilities/${f.id}/addresses`, { method: "GET" })
      expect(listRes.status).toBe(200)
      const { data: list } = await listRes.json()
      expect(list.length).toBeGreaterThanOrEqual(1)
    })

    it("returns 404 when creating address for non-existent facility", async () => {
      const res = await app.request("/facilities/faci_00000000000000000000000000/addresses", {
        method: "POST",
        ...json({ label: "primary", line1: "x" }),
      })
      expect(res.status).toBe(404)
    })

    it("updates an address", async () => {
      const f = await seedFacility()
      const createRes = await app.request(`/facilities/${f.id}/addresses`, {
        method: "POST",
        ...json({ label: "primary", city: "Berlin" }),
      })
      const { data: addr } = await createRes.json()

      const res = await app.request(`/addresses/${addr.id}`, {
        method: "PATCH",
        ...json({ city: "Munich" }),
      })
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(data.city).toBe("Munich")
    })

    it("deletes an address", async () => {
      const f = await seedFacility()
      const createRes = await app.request(`/facilities/${f.id}/addresses`, {
        method: "POST",
        ...json({ label: "shipping", line1: "789 Dock St" }),
      })
      const { data: addr } = await createRes.json()

      const res = await app.request(`/addresses/${addr.id}`, { method: "DELETE" })
      expect(res.status).toBe(200)
    })
  })

  // ─── Facility Contacts (named contacts) ──────────────────���

  describe("Facility Contacts", () => {
    it("creates a facility contact", async () => {
      const f = await seedFacility()
      const res = await app.request(`/facilities/${f.id}/contacts`, {
        method: "POST",
        ...json({ name: "John Smith", role: "front_desk", email: "john@hotel.com" }),
      })
      expect(res.status).toBe(201)
      const { data } = await res.json()
      expect(data.id).toMatch(/^idnc_/)
      expect(data.name).toBe("John Smith")
      expect(data.role).toBe("front_desk")
    })

    it("returns 404 for non-existent facility", async () => {
      const res = await app.request("/facilities/faci_00000000000000000000000000/contacts", {
        method: "POST",
        ...json({ name: "Nobody", role: "general" }),
      })
      expect(res.status).toBe(404)
    })

    it("lists facility contacts", async () => {
      const f = await seedFacility()
      await app.request(`/facilities/${f.id}/contacts`, {
        method: "POST",
        ...json({ name: "Alice", role: "sales" }),
      })
      await app.request(`/facilities/${f.id}/contacts`, {
        method: "POST",
        ...json({ name: "Bob", role: "operations" }),
      })
      const res = await app.request(`/facility-contacts?facilityId=${f.id}`, { method: "GET" })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.total).toBe(2)
    })

    it("updates a facility contact", async () => {
      const f = await seedFacility()
      const createRes = await app.request(`/facilities/${f.id}/contacts`, {
        method: "POST",
        ...json({ name: "Jane Doe", role: "general" }),
      })
      const { data: contact } = await createRes.json()

      const res = await app.request(`/facility-contacts/${contact.id}`, {
        method: "PATCH",
        ...json({ name: "Jane Smith" }),
      })
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(data.name).toBe("Jane Smith")
    })

    it("deletes a facility contact", async () => {
      const f = await seedFacility()
      const createRes = await app.request(`/facilities/${f.id}/contacts`, {
        method: "POST",
        ...json({ name: "Temp Contact", role: "other" }),
      })
      const { data: contact } = await createRes.json()

      const res = await app.request(`/facility-contacts/${contact.id}`, { method: "DELETE" })
      expect(res.status).toBe(200)
    })
  })

  // ─── Facility Features ────────────────────────────────────

  describe("Facility Features", () => {
    it("creates a feature for a facility", async () => {
      const f = await seedFacility()
      const res = await app.request(`/facilities/${f.id}/features`, {
        method: "POST",
        ...json({ name: "Free WiFi", category: "amenity" }),
      })
      expect(res.status).toBe(201)
      const { data } = await res.json()
      expect(data.id).toMatch(/^ffea_/)
      expect(data.name).toBe("Free WiFi")
      expect(data.category).toBe("amenity")
    })

    it("returns 404 for non-existent facility", async () => {
      const res = await app.request("/facilities/faci_00000000000000000000000000/features", {
        method: "POST",
        ...json({ name: "Pool", category: "amenity" }),
      })
      expect(res.status).toBe(404)
    })

    it("lists features with filter by facilityId", async () => {
      const f = await seedFacility()
      await app.request(`/facilities/${f.id}/features`, {
        method: "POST",
        ...json({ name: "Pool", category: "amenity" }),
      })
      await app.request(`/facilities/${f.id}/features`, {
        method: "POST",
        ...json({ name: "Ramp Access", category: "accessibility" }),
      })

      const res = await app.request(`/facility-features?facilityId=${f.id}`, { method: "GET" })
      const body = await res.json()
      expect(body.total).toBe(2)
    })

    it("filters features by category", async () => {
      const f = await seedFacility()
      await app.request(`/facilities/${f.id}/features`, {
        method: "POST",
        ...json({ name: "Pool", category: "amenity" }),
      })
      await app.request(`/facilities/${f.id}/features`, {
        method: "POST",
        ...json({ name: "Guards", category: "security" }),
      })

      const res = await app.request(`/facility-features?facilityId=${f.id}&category=security`, {
        method: "GET",
      })
      const body = await res.json()
      expect(body.total).toBe(1)
      expect(body.data[0].name).toBe("Guards")
    })

    it("updates a feature", async () => {
      const f = await seedFacility()
      const createRes = await app.request(`/facilities/${f.id}/features`, {
        method: "POST",
        ...json({ name: "Gym", category: "amenity" }),
      })
      const { data: feat } = await createRes.json()

      const res = await app.request(`/facility-features/${feat.id}`, {
        method: "PATCH",
        ...json({ highlighted: true }),
      })
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(data.highlighted).toBe(true)
    })

    it("deletes a feature", async () => {
      const f = await seedFacility()
      const createRes = await app.request(`/facilities/${f.id}/features`, {
        method: "POST",
        ...json({ name: "Spa", category: "service" }),
      })
      const { data: feat } = await createRes.json()

      const res = await app.request(`/facility-features/${feat.id}`, { method: "DELETE" })
      expect(res.status).toBe(200)
    })
  })

  // ─── Facility Operation Schedules ─────────────────────────

  describe("Facility Operation Schedules", () => {
    it("creates a schedule for a facility", async () => {
      const f = await seedFacility()
      const res = await app.request(`/facilities/${f.id}/operation-schedules`, {
        method: "POST",
        ...json({ dayOfWeek: "monday", opensAt: "08:00", closesAt: "22:00" }),
      })
      expect(res.status).toBe(201)
      const { data } = await res.json()
      expect(data.id).toMatch(/^fops_/)
      expect(data.dayOfWeek).toBe("monday")
      expect(data.opensAt).toBe("08:00")
      expect(data.closesAt).toBe("22:00")
    })

    it("creates a closed-day schedule", async () => {
      const f = await seedFacility()
      const res = await app.request(`/facilities/${f.id}/operation-schedules`, {
        method: "POST",
        ...json({ dayOfWeek: "sunday", closed: true }),
      })
      expect(res.status).toBe(201)
      const { data } = await res.json()
      expect(data.closed).toBe(true)
    })

    it("returns 404 for non-existent facility", async () => {
      const res = await app.request(
        "/facilities/faci_00000000000000000000000000/operation-schedules",
        {
          method: "POST",
          ...json({ dayOfWeek: "monday", opensAt: "09:00", closesAt: "17:00" }),
        },
      )
      expect(res.status).toBe(404)
    })

    it("lists schedules with filter", async () => {
      const f = await seedFacility()
      await app.request(`/facilities/${f.id}/operation-schedules`, {
        method: "POST",
        ...json({ dayOfWeek: "monday", opensAt: "08:00", closesAt: "22:00" }),
      })
      await app.request(`/facilities/${f.id}/operation-schedules`, {
        method: "POST",
        ...json({ dayOfWeek: "tuesday", opensAt: "08:00", closesAt: "22:00" }),
      })

      const res = await app.request(
        `/facility-operation-schedules?facilityId=${f.id}&dayOfWeek=monday`,
        { method: "GET" },
      )
      const body = await res.json()
      expect(body.total).toBe(1)
      expect(body.data[0].dayOfWeek).toBe("monday")
    })

    it("updates a schedule", async () => {
      const f = await seedFacility()
      const createRes = await app.request(`/facilities/${f.id}/operation-schedules`, {
        method: "POST",
        ...json({ dayOfWeek: "friday", opensAt: "09:00", closesAt: "18:00" }),
      })
      const { data: sched } = await createRes.json()

      const res = await app.request(`/facility-operation-schedules/${sched.id}`, {
        method: "PATCH",
        ...json({ closesAt: "23:00" }),
      })
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(data.closesAt).toBe("23:00")
    })

    it("deletes a schedule", async () => {
      const f = await seedFacility()
      const createRes = await app.request(`/facilities/${f.id}/operation-schedules`, {
        method: "POST",
        ...json({ dayOfWeek: "wednesday" }),
      })
      const { data: sched } = await createRes.json()

      const res = await app.request(`/facility-operation-schedules/${sched.id}`, {
        method: "DELETE",
      })
      expect(res.status).toBe(200)
    })
  })

  // ─── Properties ───────────────────────────────────────────

  describe("Properties", () => {
    it("creates a property linked to a facility", async () => {
      const f = await seedFacility({ kind: "hotel" })
      const p = await seedProperty(f.id)
      expect(p.id).toMatch(/^prop_/)
      expect(p.facilityId).toBe(f.id)
      expect(p.propertyType).toBe("hotel")
    })

    it("creates a property with all fields", async () => {
      const f = await seedFacility({ kind: "resort" })
      const p = await seedProperty(f.id, {
        propertyType: "resort",
        brandName: "Luxury Resorts",
        groupName: "LR Group",
        rating: 5,
        ratingScale: 5,
        checkInTime: "15:00",
        checkOutTime: "11:00",
        policyNotes: "No pets",
      })
      expect(p.propertyType).toBe("resort")
      expect(p.brandName).toBe("Luxury Resorts")
      expect(p.rating).toBe(5)
      expect(p.checkInTime).toBe("15:00")
    })

    it("returns 404 when creating property for non-existent facility", async () => {
      const res = await app.request("/properties", {
        method: "POST",
        ...json({ facilityId: "faci_00000000000000000000000000" }),
      })
      expect(res.status).toBe(404)
    })

    it("gets a property by id", async () => {
      const f = await seedFacility()
      const p = await seedProperty(f.id)
      const res = await app.request(`/properties/${p.id}`, { method: "GET" })
      expect(res.status).toBe(200)
    })

    it("returns 404 for non-existent property", async () => {
      const res = await app.request("/properties/prop_00000000000000000000000000", {
        method: "GET",
      })
      expect(res.status).toBe(404)
    })

    it("updates a property", async () => {
      const f = await seedFacility()
      const p = await seedProperty(f.id)
      const res = await app.request(`/properties/${p.id}`, {
        method: "PATCH",
        ...json({ brandName: "New Brand", rating: 4 }),
      })
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(data.brandName).toBe("New Brand")
      expect(data.rating).toBe(4)
    })

    it("deletes a property", async () => {
      const f = await seedFacility()
      const p = await seedProperty(f.id)
      const res = await app.request(`/properties/${p.id}`, { method: "DELETE" })
      expect(res.status).toBe(200)

      const check = await app.request(`/properties/${p.id}`, { method: "GET" })
      expect(check.status).toBe(404)
    })
  })

  describe("Properties list & filters", () => {
    it("lists with pagination", async () => {
      const f1 = await seedFacility()
      const f2 = await seedFacility()
      const f3 = await seedFacility()
      await seedProperty(f1.id)
      await seedProperty(f2.id)
      await seedProperty(f3.id)

      const res = await app.request("/properties?limit=2", { method: "GET" })
      const body = await res.json()
      expect(body.data.length).toBe(2)
      expect(body.total).toBe(3)
    })

    it("filters by propertyType", async () => {
      const f1 = await seedFacility()
      const f2 = await seedFacility()
      await seedProperty(f1.id, { propertyType: "hotel" })
      await seedProperty(f2.id, { propertyType: "villa" })

      const res = await app.request("/properties?propertyType=villa", { method: "GET" })
      const body = await res.json()
      expect(body.total).toBe(1)
      expect(body.data[0].propertyType).toBe("villa")
    })

    it("searches by brand or group name", async () => {
      const f1 = await seedFacility()
      const f2 = await seedFacility()
      await seedProperty(f1.id, { brandName: "Hilton" })
      await seedProperty(f2.id, { brandName: "Marriott" })

      const res = await app.request("/properties?search=Hilton", { method: "GET" })
      const body = await res.json()
      expect(body.total).toBe(1)
    })
  })

  // ─── Property Groups ──────────────────────────────────────

  describe("Property Groups", () => {
    it("creates a property group", async () => {
      const g = await seedPropertyGroup()
      expect(g.id).toMatch(/^pgrp_/)
      expect(g.groupType).toBe("chain")
      expect(g.status).toBe("active")
    })

    it("creates with all fields", async () => {
      const g = await seedPropertyGroup({
        groupType: "brand",
        code: "LUX",
        brandName: "Luxury Collection",
        legalName: "Luxury Corp Ltd",
        website: "https://luxury.com",
        notes: "Premium brand",
        metadata: { tier: "premium" },
      })
      expect(g.groupType).toBe("brand")
      expect(g.code).toBe("LUX")
      expect(g.brandName).toBe("Luxury Collection")
      expect(g.metadata).toEqual({ tier: "premium" })
    })

    it("gets a property group by id", async () => {
      const g = await seedPropertyGroup()
      const res = await app.request(`/property-groups/${g.id}`, { method: "GET" })
      expect(res.status).toBe(200)
    })

    it("returns 404 for non-existent property group", async () => {
      const res = await app.request("/property-groups/pgrp_00000000000000000000000000", {
        method: "GET",
      })
      expect(res.status).toBe(404)
    })

    it("updates a property group", async () => {
      const g = await seedPropertyGroup()
      const res = await app.request(`/property-groups/${g.id}`, {
        method: "PATCH",
        ...json({ status: "inactive", notes: "Suspended" }),
      })
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(data.status).toBe("inactive")
      expect(data.notes).toBe("Suspended")
    })

    it("deletes a property group", async () => {
      const g = await seedPropertyGroup()
      const res = await app.request(`/property-groups/${g.id}`, { method: "DELETE" })
      expect(res.status).toBe(200)

      const check = await app.request(`/property-groups/${g.id}`, { method: "GET" })
      expect(check.status).toBe(404)
    })
  })

  describe("Property Groups list & filters", () => {
    it("lists with pagination", async () => {
      await seedPropertyGroup()
      await seedPropertyGroup()
      await seedPropertyGroup()
      const res = await app.request("/property-groups?limit=2", { method: "GET" })
      const body = await res.json()
      expect(body.data.length).toBe(2)
      expect(body.total).toBe(3)
    })

    it("filters by groupType", async () => {
      await seedPropertyGroup({ groupType: "chain" })
      await seedPropertyGroup({ groupType: "brand" })
      const res = await app.request("/property-groups?groupType=brand", { method: "GET" })
      const body = await res.json()
      expect(body.total).toBe(1)
    })

    it("searches by name", async () => {
      await seedPropertyGroup({ name: "Hilton Hotels" })
      await seedPropertyGroup({ name: "Marriott Intl" })
      const res = await app.request("/property-groups?search=Hilton", { method: "GET" })
      const body = await res.json()
      expect(body.total).toBe(1)
    })
  })

  // ─── Property Group Members ───────────────────────────────

  describe("Property Group Members", () => {
    it("creates a membership", async () => {
      const f = await seedFacility()
      const p = await seedProperty(f.id)
      const g = await seedPropertyGroup()

      const res = await app.request("/property-group-members", {
        method: "POST",
        ...json({ groupId: g.id, propertyId: p.id }),
      })
      expect(res.status).toBe(201)
      const { data } = await res.json()
      expect(data.id).toMatch(/^pgpm_/)
      expect(data.membershipRole).toBe("member")
    })

    it("creates with role and dates", async () => {
      const f = await seedFacility()
      const p = await seedProperty(f.id)
      const g = await seedPropertyGroup()

      const res = await app.request("/property-group-members", {
        method: "POST",
        ...json({
          groupId: g.id,
          propertyId: p.id,
          membershipRole: "flagship",
          isPrimary: true,
          validFrom: "2024-01-01",
        }),
      })
      expect(res.status).toBe(201)
      const { data } = await res.json()
      expect(data.membershipRole).toBe("flagship")
      expect(data.isPrimary).toBe(true)
    })

    it("returns 404 for non-existent group or property", async () => {
      const res = await app.request("/property-group-members", {
        method: "POST",
        ...json({
          groupId: "pgrp_00000000000000000000000000",
          propertyId: "prop_00000000000000000000000000",
        }),
      })
      expect(res.status).toBe(404)
    })

    it("gets a member by id", async () => {
      const f = await seedFacility()
      const p = await seedProperty(f.id)
      const g = await seedPropertyGroup()
      const createRes = await app.request("/property-group-members", {
        method: "POST",
        ...json({ groupId: g.id, propertyId: p.id }),
      })
      const { data: member } = await createRes.json()

      const res = await app.request(`/property-group-members/${member.id}`, { method: "GET" })
      expect(res.status).toBe(200)
    })

    it("updates a member", async () => {
      const f = await seedFacility()
      const p = await seedProperty(f.id)
      const g = await seedPropertyGroup()
      const createRes = await app.request("/property-group-members", {
        method: "POST",
        ...json({ groupId: g.id, propertyId: p.id }),
      })
      const { data: member } = await createRes.json()

      const res = await app.request(`/property-group-members/${member.id}`, {
        method: "PATCH",
        ...json({ membershipRole: "franchise", notes: "Converted" }),
      })
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(data.membershipRole).toBe("franchise")
      expect(data.notes).toBe("Converted")
    })

    it("deletes a member", async () => {
      const f = await seedFacility()
      const p = await seedProperty(f.id)
      const g = await seedPropertyGroup()
      const createRes = await app.request("/property-group-members", {
        method: "POST",
        ...json({ groupId: g.id, propertyId: p.id }),
      })
      const { data: member } = await createRes.json()

      const res = await app.request(`/property-group-members/${member.id}`, { method: "DELETE" })
      expect(res.status).toBe(200)

      const check = await app.request(`/property-group-members/${member.id}`, { method: "GET" })
      expect(check.status).toBe(404)
    })
  })

  describe("Property Group Members list & filters", () => {
    it("lists with filter by groupId", async () => {
      const f1 = await seedFacility()
      const f2 = await seedFacility()
      const p1 = await seedProperty(f1.id)
      const p2 = await seedProperty(f2.id)
      const g = await seedPropertyGroup()
      await app.request("/property-group-members", {
        method: "POST",
        ...json({ groupId: g.id, propertyId: p1.id }),
      })
      await app.request("/property-group-members", {
        method: "POST",
        ...json({ groupId: g.id, propertyId: p2.id }),
      })

      const res = await app.request(`/property-group-members?groupId=${g.id}`, { method: "GET" })
      const body = await res.json()
      expect(body.total).toBe(2)
    })

    it("filters by membershipRole", async () => {
      const f1 = await seedFacility()
      const f2 = await seedFacility()
      const p1 = await seedProperty(f1.id)
      const p2 = await seedProperty(f2.id)
      const g = await seedPropertyGroup()
      await app.request("/property-group-members", {
        method: "POST",
        ...json({ groupId: g.id, propertyId: p1.id, membershipRole: "member" }),
      })
      await app.request("/property-group-members", {
        method: "POST",
        ...json({ groupId: g.id, propertyId: p2.id, membershipRole: "flagship" }),
      })

      const res = await app.request(
        `/property-group-members?groupId=${g.id}&membershipRole=flagship`,
        { method: "GET" },
      )
      const body = await res.json()
      expect(body.total).toBe(1)
      expect(body.data[0].membershipRole).toBe("flagship")
    })
  })
})
