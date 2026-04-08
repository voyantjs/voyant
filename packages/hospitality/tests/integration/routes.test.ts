import { bookingItems, bookings } from "@voyantjs/bookings/schema"
import { newId } from "@voyantjs/db/lib/typeid"
import { cleanupTestDb, createTestDb } from "@voyantjs/db/test-utils"
import { facilities, properties } from "@voyantjs/facilities/schema"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { Hono } from "hono"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"
import { hospitalityRoutes } from "../../src/routes.js"

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

describe.skipIf(!DB_AVAILABLE)("hospitality routes", () => {
  let db: PostgresJsDatabase
  let app: ReturnType<typeof createApp>

  // Shared seed IDs
  let propertyId: string
  let roomTypeId: string
  let roomUnitId: string
  let ratePlanId: string
  let mealPlanId: string
  let bookingItemId: string
  let stayBookingItemId: string
  let stayOperationId: string

  function createApp() {
    const hono = new Hono()
    hono.use("*", async (c, next) => {
      c.set("db" as never, db)
      c.set("userId" as never, "test-user")
      await next()
    })
    hono.route("/v1/hospitality", hospitalityRoutes)
    return hono
  }

  function req(method: string, path: string, body?: unknown) {
    const init: RequestInit = { method, headers: { "Content-Type": "application/json" } }
    if (body) init.body = JSON.stringify(body)
    return app.request(`/v1/hospitality${path}`, init)
  }

  async function seedFacilityAndProperty(): Promise<string> {
    const facilityId = newId("facilities")
    await db.insert(facilities).values({
      id: facilityId,
      kind: "hotel",
      name: "Test Hotel Facility",
    })
    const propId = newId("properties")
    await db.insert(properties).values({
      id: propId,
      facilityId,
      propertyType: "hotel",
    })
    return propId
  }

  async function seedBookingAndItem(): Promise<string> {
    const bookingId = newId("bookings")
    await db.insert(bookings).values({
      id: bookingId,
      bookingNumber: `H-${Date.now()}`,
      sellCurrency: "USD",
    })
    const biId = newId("booking_items")
    await db.insert(bookingItems).values({
      id: biId,
      bookingId,
      title: "Accommodation",
      quantity: 1,
      sellCurrency: "USD",
    })
    return biId
  }

  async function seedRoomType(propId: string): Promise<string> {
    const res = await req("POST", "/room-types", {
      propertyId: propId,
      name: "Deluxe Room",
      code: `DLX-${Date.now()}`,
      maxAdults: 2,
    })
    const json = (await res.json()) as { data: { id: string } }
    return json.data.id
  }

  async function seedRoomUnit(propId: string, rtId: string): Promise<string> {
    const res = await req("POST", "/room-units", {
      propertyId: propId,
      roomTypeId: rtId,
      roomNumber: `${100 + Math.floor(Math.random() * 900)}`,
    })
    const json = (await res.json()) as { data: { id: string } }
    return json.data.id
  }

  async function seedMealPlan(propId: string): Promise<string> {
    const res = await req("POST", "/meal-plans", {
      propertyId: propId,
      code: `BB-${Date.now()}`,
      name: "Bed & Breakfast",
      includesBreakfast: true,
    })
    const json = (await res.json()) as { data: { id: string } }
    return json.data.id
  }

  async function seedRatePlan(propId: string): Promise<string> {
    const res = await req("POST", "/rate-plans", {
      propertyId: propId,
      code: `STD-${Date.now()}`,
      name: "Standard Rate",
      currencyCode: "USD",
    })
    const json = (await res.json()) as { data: { id: string } }
    return json.data.id
  }

  async function seedStayBookingItem(
    biId: string,
    propId: string,
    rtId: string,
    rpId: string,
  ): Promise<string> {
    const res = await req("POST", "/stay-booking-items", {
      bookingItemId: biId,
      propertyId: propId,
      roomTypeId: rtId,
      ratePlanId: rpId,
      checkInDate: "2025-07-01",
      checkOutDate: "2025-07-04",
      nightCount: 3,
      adults: 2,
    })
    const json = (await res.json()) as { data: { id: string } }
    return json.data.id
  }

  async function seedStayOperation(sbiId: string, propId: string): Promise<string> {
    const res = await req("POST", "/stay-operations", {
      stayBookingItemId: sbiId,
      propertyId: propId,
    })
    const json = (await res.json()) as { data: { id: string } }
    return json.data.id
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

    // Seed the full dependency chain
    propertyId = await seedFacilityAndProperty()
    roomTypeId = await seedRoomType(propertyId)
    roomUnitId = await seedRoomUnit(propertyId, roomTypeId)
    mealPlanId = await seedMealPlan(propertyId)
    ratePlanId = await seedRatePlan(propertyId)
    bookingItemId = await seedBookingAndItem()
    stayBookingItemId = await seedStayBookingItem(bookingItemId, propertyId, roomTypeId, ratePlanId)
    stayOperationId = await seedStayOperation(stayBookingItemId, propertyId)
  })

  // ─── Room Types ────────────────────────────────────────
  describe("room-types", () => {
    it("lists room types (seeded)", async () => {
      const res = await req("GET", "/room-types")
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: unknown[]; total: number }
      expect(json.total).toBeGreaterThanOrEqual(1)
    })

    it("filters room types by propertyId", async () => {
      const res = await req("GET", `/room-types?propertyId=${propertyId}`)
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: unknown[]; total: number }
      expect(json.total).toBe(1)
    })

    it("creates a room type", async () => {
      const res = await req("POST", "/room-types", {
        propertyId,
        name: "Suite",
        code: `STE-${Date.now()}`,
        inventoryMode: "serialized",
        maxAdults: 4,
        maxOccupancy: 6,
      })
      expect(res.status).toBe(201)
      const json = (await res.json()) as { data: { name: string; inventoryMode: string } }
      expect(json.data.name).toBe("Suite")
      expect(json.data.inventoryMode).toBe("serialized")
    })

    it("gets room type by id", async () => {
      const res = await req("GET", `/room-types/${roomTypeId}`)
      expect(res.status).toBe(200)
    })

    it("returns 404 for unknown room type", async () => {
      const res = await req("GET", `/room-types/${newId("room_types")}`)
      expect(res.status).toBe(404)
    })

    it("updates a room type", async () => {
      const res = await req("PATCH", `/room-types/${roomTypeId}`, { name: "Updated Deluxe" })
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: { name: string } }
      expect(json.data.name).toBe("Updated Deluxe")
    })

    it("deletes a room type", async () => {
      // Create a separate room type to delete (avoid cascading to seeded data)
      const cr = await req("POST", "/room-types", {
        propertyId,
        name: "Temp",
        code: `TMP-${Date.now()}`,
      })
      const { data } = (await cr.json()) as { data: { id: string } }
      const res = await req("DELETE", `/room-types/${data.id}`)
      expect(res.status).toBe(200)
      const get = await req("GET", `/room-types/${data.id}`)
      expect(get.status).toBe(404)
    })
  })

  // ─── Room Type Bed Configs ─────────────────────────────
  describe("room-type-bed-configs", () => {
    it("creates a bed config", async () => {
      const res = await req("POST", "/room-type-bed-configs", {
        roomTypeId,
        bedType: "king",
        quantity: 1,
        isPrimary: true,
      })
      expect(res.status).toBe(201)
      const json = (await res.json()) as { data: { bedType: string; isPrimary: boolean } }
      expect(json.data.bedType).toBe("king")
      expect(json.data.isPrimary).toBe(true)
    })

    it("lists bed configs filtered by roomTypeId", async () => {
      await req("POST", "/room-type-bed-configs", {
        roomTypeId,
        bedType: "queen",
        quantity: 2,
      })
      const res = await req("GET", `/room-type-bed-configs?roomTypeId=${roomTypeId}`)
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: unknown[]; total: number }
      expect(json.total).toBeGreaterThanOrEqual(1)
    })

    it("gets bed config by id", async () => {
      const cr = await req("POST", "/room-type-bed-configs", {
        roomTypeId,
        bedType: "twin",
      })
      const { data } = (await cr.json()) as { data: { id: string } }
      const res = await req("GET", `/room-type-bed-configs/${data.id}`)
      expect(res.status).toBe(200)
    })

    it("updates a bed config", async () => {
      const cr = await req("POST", "/room-type-bed-configs", {
        roomTypeId,
        bedType: "single",
      })
      const { data } = (await cr.json()) as { data: { id: string } }
      const res = await req("PATCH", `/room-type-bed-configs/${data.id}`, { quantity: 3 })
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: { quantity: number } }
      expect(json.data.quantity).toBe(3)
    })

    it("deletes a bed config", async () => {
      const cr = await req("POST", "/room-type-bed-configs", {
        roomTypeId,
        bedType: "sofa",
      })
      const { data } = (await cr.json()) as { data: { id: string } }
      const res = await req("DELETE", `/room-type-bed-configs/${data.id}`)
      expect(res.status).toBe(200)
    })
  })

  // ─── Room Units ────────────────────────────────────────
  describe("room-units", () => {
    it("lists room units (seeded)", async () => {
      const res = await req("GET", "/room-units")
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: unknown[]; total: number }
      expect(json.total).toBeGreaterThanOrEqual(1)
    })

    it("creates a room unit", async () => {
      const res = await req("POST", "/room-units", {
        propertyId,
        roomTypeId,
        roomNumber: "201",
        floor: "2",
        status: "active",
      })
      expect(res.status).toBe(201)
      const json = (await res.json()) as { data: { roomNumber: string; floor: string } }
      expect(json.data.roomNumber).toBe("201")
      expect(json.data.floor).toBe("2")
    })

    it("gets room unit by id", async () => {
      const res = await req("GET", `/room-units/${roomUnitId}`)
      expect(res.status).toBe(200)
    })

    it("returns 404 for unknown room unit", async () => {
      const res = await req("GET", `/room-units/${newId("room_units")}`)
      expect(res.status).toBe(404)
    })

    it("updates a room unit", async () => {
      const res = await req("PATCH", `/room-units/${roomUnitId}`, { floor: "3" })
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: { floor: string } }
      expect(json.data.floor).toBe("3")
    })

    it("deletes a room unit", async () => {
      const cr = await req("POST", "/room-units", {
        propertyId,
        roomTypeId,
        roomNumber: "999",
      })
      const { data } = (await cr.json()) as { data: { id: string } }
      const res = await req("DELETE", `/room-units/${data.id}`)
      expect(res.status).toBe(200)
    })
  })

  // ─── Meal Plans ────────────────────────────────────────
  describe("meal-plans", () => {
    it("lists meal plans (seeded)", async () => {
      const res = await req("GET", "/meal-plans")
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: unknown[]; total: number }
      expect(json.total).toBeGreaterThanOrEqual(1)
    })

    it("creates a meal plan", async () => {
      const res = await req("POST", "/meal-plans", {
        propertyId,
        code: `AI-${Date.now()}`,
        name: "All Inclusive",
        includesBreakfast: true,
        includesLunch: true,
        includesDinner: true,
        includesDrinks: true,
      })
      expect(res.status).toBe(201)
      const json = (await res.json()) as {
        data: { name: string; includesDrinks: boolean }
      }
      expect(json.data.name).toBe("All Inclusive")
      expect(json.data.includesDrinks).toBe(true)
    })

    it("gets meal plan by id", async () => {
      const res = await req("GET", `/meal-plans/${mealPlanId}`)
      expect(res.status).toBe(200)
    })

    it("returns 404 for unknown meal plan", async () => {
      const res = await req("GET", `/meal-plans/${newId("meal_plans")}`)
      expect(res.status).toBe(404)
    })

    it("updates a meal plan", async () => {
      const res = await req("PATCH", `/meal-plans/${mealPlanId}`, { includesLunch: true })
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: { includesLunch: boolean } }
      expect(json.data.includesLunch).toBe(true)
    })

    it("deletes a meal plan", async () => {
      const cr = await req("POST", "/meal-plans", {
        propertyId,
        code: `TMP-${Date.now()}`,
        name: "Temp",
      })
      const { data } = (await cr.json()) as { data: { id: string } }
      const res = await req("DELETE", `/meal-plans/${data.id}`)
      expect(res.status).toBe(200)
    })
  })

  // ─── Rate Plans ────────────────────────────────────────
  describe("rate-plans", () => {
    it("lists rate plans (seeded)", async () => {
      const res = await req("GET", "/rate-plans")
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: unknown[]; total: number }
      expect(json.total).toBeGreaterThanOrEqual(1)
    })

    it("creates a rate plan", async () => {
      const res = await req("POST", "/rate-plans", {
        propertyId,
        code: `PROMO-${Date.now()}`,
        name: "Promo Rate",
        currencyCode: "EUR",
        chargeFrequency: "per_stay",
        guaranteeMode: "deposit",
      })
      expect(res.status).toBe(201)
      const json = (await res.json()) as {
        data: { currencyCode: string; chargeFrequency: string; guaranteeMode: string }
      }
      expect(json.data.currencyCode).toBe("EUR")
      expect(json.data.chargeFrequency).toBe("per_stay")
      expect(json.data.guaranteeMode).toBe("deposit")
    })

    it("gets rate plan by id", async () => {
      const res = await req("GET", `/rate-plans/${ratePlanId}`)
      expect(res.status).toBe(200)
    })

    it("returns 404 for unknown rate plan", async () => {
      const res = await req("GET", `/rate-plans/${newId("rate_plans")}`)
      expect(res.status).toBe(404)
    })

    it("updates a rate plan", async () => {
      const res = await req("PATCH", `/rate-plans/${ratePlanId}`, { refundable: false })
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: { refundable: boolean } }
      expect(json.data.refundable).toBe(false)
    })

    it("deletes a rate plan", async () => {
      const cr = await req("POST", "/rate-plans", {
        propertyId,
        code: `DEL-${Date.now()}`,
        name: "Delete Me",
        currencyCode: "USD",
      })
      const { data } = (await cr.json()) as { data: { id: string } }
      const res = await req("DELETE", `/rate-plans/${data.id}`)
      expect(res.status).toBe(200)
    })
  })

  // ─── Rate Plan Room Types ─────────────────────────────
  describe("rate-plan-room-types", () => {
    it("creates a rate plan room type mapping", async () => {
      const res = await req("POST", "/rate-plan-room-types", {
        ratePlanId,
        roomTypeId,
      })
      expect(res.status).toBe(201)
    })

    it("lists rate plan room types", async () => {
      await req("POST", "/rate-plan-room-types", {
        ratePlanId,
        roomTypeId,
      })
      const res = await req("GET", `/rate-plan-room-types?ratePlanId=${ratePlanId}`)
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: unknown[]; total: number }
      expect(json.total).toBe(1)
    })

    it("gets rate plan room type by id", async () => {
      const cr = await req("POST", "/rate-plan-room-types", {
        ratePlanId,
        roomTypeId,
      })
      const { data } = (await cr.json()) as { data: { id: string } }
      const res = await req("GET", `/rate-plan-room-types/${data.id}`)
      expect(res.status).toBe(200)
    })

    it("updates a rate plan room type", async () => {
      const cr = await req("POST", "/rate-plan-room-types", {
        ratePlanId,
        roomTypeId,
      })
      const { data } = (await cr.json()) as { data: { id: string } }
      const res = await req("PATCH", `/rate-plan-room-types/${data.id}`, { active: false })
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: { active: boolean } }
      expect(json.data.active).toBe(false)
    })

    it("deletes a rate plan room type", async () => {
      const cr = await req("POST", "/rate-plan-room-types", {
        ratePlanId,
        roomTypeId,
      })
      const { data } = (await cr.json()) as { data: { id: string } }
      const res = await req("DELETE", `/rate-plan-room-types/${data.id}`)
      expect(res.status).toBe(200)
    })
  })

  // ─── Stay Rules ────────────────────────────────────────
  describe("stay-rules", () => {
    it("creates a stay rule", async () => {
      const res = await req("POST", "/stay-rules", {
        propertyId,
        minNights: 2,
        maxNights: 14,
        closedToArrival: false,
        closedToDeparture: false,
        priority: 10,
      })
      expect(res.status).toBe(201)
      const json = (await res.json()) as { data: { minNights: number; priority: number } }
      expect(json.data.minNights).toBe(2)
      expect(json.data.priority).toBe(10)
    })

    it("lists stay rules filtered by propertyId", async () => {
      await req("POST", "/stay-rules", { propertyId, minNights: 1 })
      const res = await req("GET", `/stay-rules?propertyId=${propertyId}`)
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: unknown[]; total: number }
      expect(json.total).toBeGreaterThanOrEqual(1)
    })

    it("gets stay rule by id", async () => {
      const cr = await req("POST", "/stay-rules", { propertyId, minNights: 1 })
      const { data } = (await cr.json()) as { data: { id: string } }
      const res = await req("GET", `/stay-rules/${data.id}`)
      expect(res.status).toBe(200)
    })

    it("returns 404 for unknown stay rule", async () => {
      const res = await req("GET", `/stay-rules/${newId("stay_rules")}`)
      expect(res.status).toBe(404)
    })

    it("updates a stay rule", async () => {
      const cr = await req("POST", "/stay-rules", { propertyId, minNights: 1 })
      const { data } = (await cr.json()) as { data: { id: string } }
      const res = await req("PATCH", `/stay-rules/${data.id}`, { maxNights: 7 })
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: { maxNights: number } }
      expect(json.data.maxNights).toBe(7)
    })

    it("deletes a stay rule", async () => {
      const cr = await req("POST", "/stay-rules", { propertyId, minNights: 1 })
      const { data } = (await cr.json()) as { data: { id: string } }
      const res = await req("DELETE", `/stay-rules/${data.id}`)
      expect(res.status).toBe(200)
    })
  })

  // ─── Room Inventory ────────────────────────────────────
  describe("room-inventory", () => {
    it("creates room inventory", async () => {
      const res = await req("POST", "/room-inventory", {
        propertyId,
        roomTypeId,
        date: "2025-07-01",
        totalUnits: 10,
        availableUnits: 8,
        soldUnits: 2,
      })
      expect(res.status).toBe(201)
      const json = (await res.json()) as { data: { totalUnits: number; availableUnits: number } }
      expect(json.data.totalUnits).toBe(10)
      expect(json.data.availableUnits).toBe(8)
    })

    it("lists room inventory filtered by roomTypeId", async () => {
      await req("POST", "/room-inventory", {
        propertyId,
        roomTypeId,
        date: "2025-07-02",
        totalUnits: 10,
      })
      const res = await req("GET", `/room-inventory?roomTypeId=${roomTypeId}`)
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: unknown[]; total: number }
      expect(json.total).toBeGreaterThanOrEqual(1)
    })

    it("gets room inventory by id", async () => {
      const cr = await req("POST", "/room-inventory", {
        propertyId,
        roomTypeId,
        date: "2025-07-03",
        totalUnits: 5,
      })
      const { data } = (await cr.json()) as { data: { id: string } }
      const res = await req("GET", `/room-inventory/${data.id}`)
      expect(res.status).toBe(200)
    })

    it("returns 404 for unknown room inventory", async () => {
      const res = await req("GET", `/room-inventory/${newId("room_inventory")}`)
      expect(res.status).toBe(404)
    })

    it("updates room inventory", async () => {
      const cr = await req("POST", "/room-inventory", {
        propertyId,
        roomTypeId,
        date: "2025-07-04",
        totalUnits: 10,
      })
      const { data } = (await cr.json()) as { data: { id: string } }
      const res = await req("PATCH", `/room-inventory/${data.id}`, { stopSell: true })
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: { stopSell: boolean } }
      expect(json.data.stopSell).toBe(true)
    })

    it("deletes room inventory", async () => {
      const cr = await req("POST", "/room-inventory", {
        propertyId,
        roomTypeId,
        date: "2025-07-05",
        totalUnits: 10,
      })
      const { data } = (await cr.json()) as { data: { id: string } }
      const res = await req("DELETE", `/room-inventory/${data.id}`)
      expect(res.status).toBe(200)
    })
  })

  // ─── Rate Plan Inventory Overrides ─────────────────────
  describe("rate-plan-inventory-overrides", () => {
    it("creates an override", async () => {
      const res = await req("POST", "/rate-plan-inventory-overrides", {
        ratePlanId,
        roomTypeId,
        date: "2025-07-01",
        stopSell: true,
        closedToArrival: true,
      })
      expect(res.status).toBe(201)
      const json = (await res.json()) as {
        data: { stopSell: boolean; closedToArrival: boolean }
      }
      expect(json.data.stopSell).toBe(true)
      expect(json.data.closedToArrival).toBe(true)
    })

    it("lists overrides filtered by ratePlanId", async () => {
      await req("POST", "/rate-plan-inventory-overrides", {
        ratePlanId,
        roomTypeId,
        date: "2025-07-10",
      })
      const res = await req("GET", `/rate-plan-inventory-overrides?ratePlanId=${ratePlanId}`)
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: unknown[]; total: number }
      expect(json.total).toBeGreaterThanOrEqual(1)
    })

    it("gets override by id", async () => {
      const cr = await req("POST", "/rate-plan-inventory-overrides", {
        ratePlanId,
        roomTypeId,
        date: "2025-07-11",
      })
      const { data } = (await cr.json()) as { data: { id: string } }
      const res = await req("GET", `/rate-plan-inventory-overrides/${data.id}`)
      expect(res.status).toBe(200)
    })

    it("returns 404 for unknown override", async () => {
      const res = await req(
        "GET",
        `/rate-plan-inventory-overrides/${newId("rate_plan_inventory_overrides")}`,
      )
      expect(res.status).toBe(404)
    })

    it("updates an override", async () => {
      const cr = await req("POST", "/rate-plan-inventory-overrides", {
        ratePlanId,
        roomTypeId,
        date: "2025-07-12",
      })
      const { data } = (await cr.json()) as { data: { id: string } }
      const res = await req("PATCH", `/rate-plan-inventory-overrides/${data.id}`, {
        minNightsOverride: 3,
      })
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: { minNightsOverride: number } }
      expect(json.data.minNightsOverride).toBe(3)
    })

    it("deletes an override", async () => {
      const cr = await req("POST", "/rate-plan-inventory-overrides", {
        ratePlanId,
        roomTypeId,
        date: "2025-07-13",
      })
      const { data } = (await cr.json()) as { data: { id: string } }
      const res = await req("DELETE", `/rate-plan-inventory-overrides/${data.id}`)
      expect(res.status).toBe(200)
    })
  })

  // ─── Stay Booking Items ────────────────────────────────
  describe("stay-booking-items", () => {
    it("lists stay booking items (seeded)", async () => {
      const res = await req("GET", "/stay-booking-items")
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: unknown[]; total: number }
      expect(json.total).toBeGreaterThanOrEqual(1)
    })

    it("gets stay booking item by id", async () => {
      const res = await req("GET", `/stay-booking-items/${stayBookingItemId}`)
      expect(res.status).toBe(200)
      const json = (await res.json()) as {
        data: { checkInDate: string; checkOutDate: string; nightCount: number }
      }
      expect(json.data.checkInDate).toBe("2025-07-01")
      expect(json.data.checkOutDate).toBe("2025-07-04")
      expect(json.data.nightCount).toBe(3)
    })

    it("returns 404 for unknown stay booking item", async () => {
      const res = await req("GET", `/stay-booking-items/${newId("stay_booking_items")}`)
      expect(res.status).toBe(404)
    })

    it("updates a stay booking item", async () => {
      const res = await req("PATCH", `/stay-booking-items/${stayBookingItemId}`, {
        status: "checked_in",
        confirmationCode: "CONF-123",
      })
      expect(res.status).toBe(200)
      const json = (await res.json()) as {
        data: { status: string; confirmationCode: string }
      }
      expect(json.data.status).toBe("checked_in")
      expect(json.data.confirmationCode).toBe("CONF-123")
    })

    it("deletes a stay booking item", async () => {
      // Create a separate one to delete
      const bi2 = await seedBookingAndItem()
      const sbi2 = await seedStayBookingItem(bi2, propertyId, roomTypeId, ratePlanId)
      const res = await req("DELETE", `/stay-booking-items/${sbi2}`)
      expect(res.status).toBe(200)
    })
  })

  // ─── Stay Daily Rates ──────────────────────────────────
  describe("stay-daily-rates", () => {
    it("creates a daily rate", async () => {
      const res = await req("POST", "/stay-daily-rates", {
        stayBookingItemId,
        date: "2025-07-01",
        sellCurrency: "USD",
        sellAmountCents: 15000,
        taxAmountCents: 1500,
      })
      expect(res.status).toBe(201)
      const json = (await res.json()) as {
        data: { sellAmountCents: number; taxAmountCents: number }
      }
      expect(json.data.sellAmountCents).toBe(15000)
      expect(json.data.taxAmountCents).toBe(1500)
    })

    it("lists daily rates filtered by stayBookingItemId", async () => {
      await req("POST", "/stay-daily-rates", {
        stayBookingItemId,
        date: "2025-07-02",
        sellCurrency: "USD",
      })
      const res = await req("GET", `/stay-daily-rates?stayBookingItemId=${stayBookingItemId}`)
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: unknown[]; total: number }
      expect(json.total).toBeGreaterThanOrEqual(1)
    })

    it("gets daily rate by id", async () => {
      const cr = await req("POST", "/stay-daily-rates", {
        stayBookingItemId,
        date: "2025-07-03",
        sellCurrency: "USD",
      })
      const { data } = (await cr.json()) as { data: { id: string } }
      const res = await req("GET", `/stay-daily-rates/${data.id}`)
      expect(res.status).toBe(200)
    })

    it("returns 404 for unknown daily rate", async () => {
      const res = await req("GET", `/stay-daily-rates/${newId("stay_daily_rates")}`)
      expect(res.status).toBe(404)
    })

    it("updates a daily rate", async () => {
      const cr = await req("POST", "/stay-daily-rates", {
        stayBookingItemId,
        date: "2025-07-04",
        sellCurrency: "USD",
        sellAmountCents: 10000,
      })
      const { data } = (await cr.json()) as { data: { id: string } }
      const res = await req("PATCH", `/stay-daily-rates/${data.id}`, {
        sellAmountCents: 12000,
      })
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: { sellAmountCents: number } }
      expect(json.data.sellAmountCents).toBe(12000)
    })

    it("deletes a daily rate", async () => {
      const cr = await req("POST", "/stay-daily-rates", {
        stayBookingItemId,
        date: "2025-07-05",
        sellCurrency: "USD",
      })
      const { data } = (await cr.json()) as { data: { id: string } }
      const res = await req("DELETE", `/stay-daily-rates/${data.id}`)
      expect(res.status).toBe(200)
    })
  })

  // ─── Room Blocks ───────────────────────────────────────
  describe("room-blocks", () => {
    it("creates a room block", async () => {
      const res = await req("POST", "/room-blocks", {
        propertyId,
        roomTypeId,
        startsOn: "2025-08-01",
        endsOn: "2025-08-05",
        status: "held",
        blockReason: "Group booking",
        quantity: 5,
      })
      expect(res.status).toBe(201)
      const json = (await res.json()) as {
        data: { status: string; quantity: number; blockReason: string }
      }
      expect(json.data.status).toBe("held")
      expect(json.data.quantity).toBe(5)
      expect(json.data.blockReason).toBe("Group booking")
    })

    it("lists room blocks filtered by propertyId", async () => {
      await req("POST", "/room-blocks", {
        propertyId,
        startsOn: "2025-09-01",
        endsOn: "2025-09-03",
      })
      const res = await req("GET", `/room-blocks?propertyId=${propertyId}`)
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: unknown[]; total: number }
      expect(json.total).toBeGreaterThanOrEqual(1)
    })

    it("gets room block by id", async () => {
      const cr = await req("POST", "/room-blocks", {
        propertyId,
        startsOn: "2025-10-01",
        endsOn: "2025-10-02",
      })
      const { data } = (await cr.json()) as { data: { id: string } }
      const res = await req("GET", `/room-blocks/${data.id}`)
      expect(res.status).toBe(200)
    })

    it("returns 404 for unknown room block", async () => {
      const res = await req("GET", `/room-blocks/${newId("room_blocks")}`)
      expect(res.status).toBe(404)
    })

    it("updates a room block", async () => {
      const cr = await req("POST", "/room-blocks", {
        propertyId,
        startsOn: "2025-11-01",
        endsOn: "2025-11-05",
      })
      const { data } = (await cr.json()) as { data: { id: string } }
      const res = await req("PATCH", `/room-blocks/${data.id}`, { status: "confirmed" })
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: { status: string } }
      expect(json.data.status).toBe("confirmed")
    })

    it("deletes a room block", async () => {
      const cr = await req("POST", "/room-blocks", {
        propertyId,
        startsOn: "2025-12-01",
        endsOn: "2025-12-02",
      })
      const { data } = (await cr.json()) as { data: { id: string } }
      const res = await req("DELETE", `/room-blocks/${data.id}`)
      expect(res.status).toBe(200)
    })
  })

  // ─── Room Unit Status Events ───────────────────────────
  describe("room-unit-status-events", () => {
    it("creates a status event", async () => {
      const res = await req("POST", "/room-unit-status-events", {
        roomUnitId,
        statusCode: "clean",
        housekeepingStatus: "inspected",
      })
      expect(res.status).toBe(201)
      const json = (await res.json()) as {
        data: { statusCode: string; housekeepingStatus: string }
      }
      expect(json.data.statusCode).toBe("clean")
      expect(json.data.housekeepingStatus).toBe("inspected")
    })

    it("lists status events filtered by roomUnitId", async () => {
      await req("POST", "/room-unit-status-events", {
        roomUnitId,
        statusCode: "dirty",
      })
      const res = await req("GET", `/room-unit-status-events?roomUnitId=${roomUnitId}`)
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: unknown[]; total: number }
      expect(json.total).toBeGreaterThanOrEqual(1)
    })

    it("gets status event by id", async () => {
      const cr = await req("POST", "/room-unit-status-events", {
        roomUnitId,
        statusCode: "occupied",
      })
      const { data } = (await cr.json()) as { data: { id: string } }
      const res = await req("GET", `/room-unit-status-events/${data.id}`)
      expect(res.status).toBe(200)
    })

    it("returns 404 for unknown status event", async () => {
      const res = await req("GET", `/room-unit-status-events/${newId("room_unit_status_events")}`)
      expect(res.status).toBe(404)
    })

    it("updates a status event", async () => {
      const cr = await req("POST", "/room-unit-status-events", {
        roomUnitId,
        statusCode: "dirty",
      })
      const { data } = (await cr.json()) as { data: { id: string } }
      const res = await req("PATCH", `/room-unit-status-events/${data.id}`, {
        statusCode: "clean",
      })
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: { statusCode: string } }
      expect(json.data.statusCode).toBe("clean")
    })

    it("deletes a status event", async () => {
      const cr = await req("POST", "/room-unit-status-events", {
        roomUnitId,
        statusCode: "temp",
      })
      const { data } = (await cr.json()) as { data: { id: string } }
      const res = await req("DELETE", `/room-unit-status-events/${data.id}`)
      expect(res.status).toBe(200)
    })
  })

  // ─── Maintenance Blocks ────────────────────────────────
  describe("maintenance-blocks", () => {
    it("creates a maintenance block", async () => {
      const res = await req("POST", "/maintenance-blocks", {
        propertyId,
        roomUnitId,
        startsOn: "2025-08-10",
        endsOn: "2025-08-12",
        status: "open",
        reason: "Plumbing repair",
      })
      expect(res.status).toBe(201)
      const json = (await res.json()) as { data: { reason: string; status: string } }
      expect(json.data.reason).toBe("Plumbing repair")
      expect(json.data.status).toBe("open")
    })

    it("lists maintenance blocks", async () => {
      await req("POST", "/maintenance-blocks", {
        propertyId,
        startsOn: "2025-09-10",
        endsOn: "2025-09-12",
      })
      const res = await req("GET", `/maintenance-blocks?propertyId=${propertyId}`)
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: unknown[]; total: number }
      expect(json.total).toBeGreaterThanOrEqual(1)
    })

    it("gets maintenance block by id", async () => {
      const cr = await req("POST", "/maintenance-blocks", {
        propertyId,
        startsOn: "2025-10-10",
        endsOn: "2025-10-12",
      })
      const { data } = (await cr.json()) as { data: { id: string } }
      const res = await req("GET", `/maintenance-blocks/${data.id}`)
      expect(res.status).toBe(200)
    })

    it("returns 404 for unknown maintenance block", async () => {
      const res = await req("GET", `/maintenance-blocks/${newId("maintenance_blocks")}`)
      expect(res.status).toBe(404)
    })

    it("updates a maintenance block", async () => {
      const cr = await req("POST", "/maintenance-blocks", {
        propertyId,
        startsOn: "2025-11-10",
        endsOn: "2025-11-12",
      })
      const { data } = (await cr.json()) as { data: { id: string } }
      const res = await req("PATCH", `/maintenance-blocks/${data.id}`, {
        status: "resolved",
      })
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: { status: string } }
      expect(json.data.status).toBe("resolved")
    })

    it("deletes a maintenance block", async () => {
      const cr = await req("POST", "/maintenance-blocks", {
        propertyId,
        startsOn: "2025-12-10",
        endsOn: "2025-12-12",
      })
      const { data } = (await cr.json()) as { data: { id: string } }
      const res = await req("DELETE", `/maintenance-blocks/${data.id}`)
      expect(res.status).toBe(200)
    })
  })

  // ─── Housekeeping Tasks ────────────────────────────────
  describe("housekeeping-tasks", () => {
    it("creates a housekeeping task", async () => {
      const res = await req("POST", "/housekeeping-tasks", {
        propertyId,
        roomUnitId,
        taskType: "turnover",
        status: "open",
        priority: 1,
        assignedTo: "Maria",
      })
      expect(res.status).toBe(201)
      const json = (await res.json()) as {
        data: { taskType: string; assignedTo: string; priority: number }
      }
      expect(json.data.taskType).toBe("turnover")
      expect(json.data.assignedTo).toBe("Maria")
      expect(json.data.priority).toBe(1)
    })

    it("lists housekeeping tasks filtered by roomUnitId", async () => {
      await req("POST", "/housekeeping-tasks", {
        propertyId,
        roomUnitId,
        taskType: "deep_clean",
      })
      const res = await req("GET", `/housekeeping-tasks?roomUnitId=${roomUnitId}`)
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: unknown[]; total: number }
      expect(json.total).toBeGreaterThanOrEqual(1)
    })

    it("gets housekeeping task by id", async () => {
      const cr = await req("POST", "/housekeeping-tasks", {
        propertyId,
        roomUnitId,
        taskType: "inspect",
      })
      const { data } = (await cr.json()) as { data: { id: string } }
      const res = await req("GET", `/housekeeping-tasks/${data.id}`)
      expect(res.status).toBe(200)
    })

    it("returns 404 for unknown housekeeping task", async () => {
      const res = await req("GET", `/housekeeping-tasks/${newId("housekeeping_tasks")}`)
      expect(res.status).toBe(404)
    })

    it("updates a housekeeping task", async () => {
      const cr = await req("POST", "/housekeeping-tasks", {
        propertyId,
        roomUnitId,
        taskType: "turnover",
      })
      const { data } = (await cr.json()) as { data: { id: string } }
      const res = await req("PATCH", `/housekeeping-tasks/${data.id}`, {
        status: "completed",
      })
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: { status: string } }
      expect(json.data.status).toBe("completed")
    })

    it("deletes a housekeeping task", async () => {
      const cr = await req("POST", "/housekeeping-tasks", {
        propertyId,
        roomUnitId,
        taskType: "temp",
      })
      const { data } = (await cr.json()) as { data: { id: string } }
      const res = await req("DELETE", `/housekeeping-tasks/${data.id}`)
      expect(res.status).toBe(200)
    })
  })

  // ─── Stay Operations ──────────────────────────────────
  describe("stay-operations", () => {
    it("lists stay operations (seeded)", async () => {
      const res = await req("GET", "/stay-operations")
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: unknown[]; total: number }
      expect(json.total).toBeGreaterThanOrEqual(1)
    })

    it("gets stay operation by id", async () => {
      const res = await req("GET", `/stay-operations/${stayOperationId}`)
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: { operationStatus: string } }
      expect(json.data.operationStatus).toBe("reserved")
    })

    it("returns 404 for unknown stay operation", async () => {
      const res = await req("GET", `/stay-operations/${newId("stay_operations")}`)
      expect(res.status).toBe(404)
    })

    it("updates a stay operation", async () => {
      const res = await req("PATCH", `/stay-operations/${stayOperationId}`, {
        operationStatus: "checked_in",
        checkedInAt: "2025-07-01T14:00:00Z",
      })
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: { operationStatus: string } }
      expect(json.data.operationStatus).toBe("checked_in")
    })

    it("deletes a stay operation", async () => {
      // Create a new chain to delete
      const bi2 = await seedBookingAndItem()
      const sbi2 = await seedStayBookingItem(bi2, propertyId, roomTypeId, ratePlanId)
      const so2 = await seedStayOperation(sbi2, propertyId)
      const res = await req("DELETE", `/stay-operations/${so2}`)
      expect(res.status).toBe(200)
    })
  })

  // ─── Stay Checkpoints ─────────────────────────────────
  describe("stay-checkpoints", () => {
    it("creates a checkpoint", async () => {
      const res = await req("POST", "/stay-checkpoints", {
        stayOperationId,
        checkpointType: "check_in",
        notes: "Guest arrived early",
      })
      expect(res.status).toBe(201)
      const json = (await res.json()) as {
        data: { checkpointType: string; notes: string }
      }
      expect(json.data.checkpointType).toBe("check_in")
      expect(json.data.notes).toBe("Guest arrived early")
    })

    it("lists checkpoints filtered by stayOperationId", async () => {
      await req("POST", "/stay-checkpoints", {
        stayOperationId,
        checkpointType: "arrival",
      })
      const res = await req("GET", `/stay-checkpoints?stayOperationId=${stayOperationId}`)
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: unknown[]; total: number }
      expect(json.total).toBeGreaterThanOrEqual(1)
    })

    it("gets checkpoint by id", async () => {
      const cr = await req("POST", "/stay-checkpoints", {
        stayOperationId,
        checkpointType: "note",
      })
      const { data } = (await cr.json()) as { data: { id: string } }
      const res = await req("GET", `/stay-checkpoints/${data.id}`)
      expect(res.status).toBe(200)
    })

    it("returns 404 for unknown checkpoint", async () => {
      const res = await req("GET", `/stay-checkpoints/${newId("stay_checkpoints")}`)
      expect(res.status).toBe(404)
    })

    it("updates a checkpoint", async () => {
      const cr = await req("POST", "/stay-checkpoints", {
        stayOperationId,
        checkpointType: "note",
      })
      const { data } = (await cr.json()) as { data: { id: string } }
      const res = await req("PATCH", `/stay-checkpoints/${data.id}`, {
        notes: "Updated note",
      })
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: { notes: string } }
      expect(json.data.notes).toBe("Updated note")
    })

    it("deletes a checkpoint", async () => {
      const cr = await req("POST", "/stay-checkpoints", {
        stayOperationId,
        checkpointType: "note",
      })
      const { data } = (await cr.json()) as { data: { id: string } }
      const res = await req("DELETE", `/stay-checkpoints/${data.id}`)
      expect(res.status).toBe(200)
    })
  })

  // ─── Stay Service Posts ────────────────────────────────
  describe("stay-service-posts", () => {
    it("creates a service post", async () => {
      const res = await req("POST", "/stay-service-posts", {
        stayOperationId,
        serviceDate: "2025-07-01",
        kind: "lodging",
        description: "Room night charge",
        quantity: 1,
        currencyCode: "USD",
        sellAmountCents: 15000,
      })
      expect(res.status).toBe(201)
      const json = (await res.json()) as {
        data: { kind: string; sellAmountCents: number; description: string }
      }
      expect(json.data.kind).toBe("lodging")
      expect(json.data.sellAmountCents).toBe(15000)
      expect(json.data.description).toBe("Room night charge")
    })

    it("lists service posts filtered by stayOperationId", async () => {
      await req("POST", "/stay-service-posts", {
        stayOperationId,
        serviceDate: "2025-07-02",
        kind: "meal",
        description: "Breakfast",
        currencyCode: "USD",
      })
      const res = await req("GET", `/stay-service-posts?stayOperationId=${stayOperationId}`)
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: unknown[]; total: number }
      expect(json.total).toBeGreaterThanOrEqual(1)
    })

    it("gets service post by id", async () => {
      const cr = await req("POST", "/stay-service-posts", {
        stayOperationId,
        serviceDate: "2025-07-03",
        kind: "minibar",
        description: "Minibar items",
        currencyCode: "USD",
        sellAmountCents: 2500,
      })
      const { data } = (await cr.json()) as { data: { id: string } }
      const res = await req("GET", `/stay-service-posts/${data.id}`)
      expect(res.status).toBe(200)
    })

    it("returns 404 for unknown service post", async () => {
      const res = await req("GET", `/stay-service-posts/${newId("stay_service_posts")}`)
      expect(res.status).toBe(404)
    })

    it("updates a service post", async () => {
      const cr = await req("POST", "/stay-service-posts", {
        stayOperationId,
        serviceDate: "2025-07-04",
        kind: "fee",
        description: "Late checkout",
        currencyCode: "USD",
        sellAmountCents: 5000,
      })
      const { data } = (await cr.json()) as { data: { id: string } }
      const res = await req("PATCH", `/stay-service-posts/${data.id}`, {
        sellAmountCents: 7500,
      })
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: { sellAmountCents: number } }
      expect(json.data.sellAmountCents).toBe(7500)
    })

    it("deletes a service post", async () => {
      const cr = await req("POST", "/stay-service-posts", {
        stayOperationId,
        serviceDate: "2025-07-05",
        kind: "other",
        description: "Temp",
        currencyCode: "USD",
      })
      const { data } = (await cr.json()) as { data: { id: string } }
      const res = await req("DELETE", `/stay-service-posts/${data.id}`)
      expect(res.status).toBe(200)
    })
  })

  // ─── Stay Folios ───────────────────────────────────────
  describe("stay-folios", () => {
    it("creates a folio", async () => {
      const res = await req("POST", "/stay-folios", {
        stayOperationId,
        currencyCode: "USD",
        status: "open",
      })
      expect(res.status).toBe(201)
      const json = (await res.json()) as {
        data: { currencyCode: string; status: string }
      }
      expect(json.data.currencyCode).toBe("USD")
      expect(json.data.status).toBe("open")
    })

    it("lists folios filtered by stayOperationId", async () => {
      await req("POST", "/stay-folios", {
        stayOperationId,
        currencyCode: "EUR",
      })
      const res = await req("GET", `/stay-folios?stayOperationId=${stayOperationId}`)
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: unknown[]; total: number }
      expect(json.total).toBeGreaterThanOrEqual(1)
    })

    it("gets folio by id", async () => {
      const cr = await req("POST", "/stay-folios", {
        stayOperationId,
        currencyCode: "USD",
      })
      const { data } = (await cr.json()) as { data: { id: string } }
      const res = await req("GET", `/stay-folios/${data.id}`)
      expect(res.status).toBe(200)
    })

    it("returns 404 for unknown folio", async () => {
      const res = await req("GET", `/stay-folios/${newId("stay_folios")}`)
      expect(res.status).toBe(404)
    })

    it("updates a folio", async () => {
      const cr = await req("POST", "/stay-folios", {
        stayOperationId,
        currencyCode: "USD",
      })
      const { data } = (await cr.json()) as { data: { id: string } }
      const res = await req("PATCH", `/stay-folios/${data.id}`, { status: "closed" })
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: { status: string } }
      expect(json.data.status).toBe("closed")
    })

    it("deletes a folio", async () => {
      const cr = await req("POST", "/stay-folios", {
        stayOperationId,
        currencyCode: "USD",
      })
      const { data } = (await cr.json()) as { data: { id: string } }
      const res = await req("DELETE", `/stay-folios/${data.id}`)
      expect(res.status).toBe(200)
    })
  })

  // ─── Stay Folio Lines ─────────────────────────────────
  describe("stay-folio-lines", () => {
    let folioId: string

    beforeEach(async () => {
      const cr = await req("POST", "/stay-folios", {
        stayOperationId,
        currencyCode: "USD",
      })
      const json = (await cr.json()) as { data: { id: string } }
      folioId = json.data.id
    })

    it("creates a folio line", async () => {
      const res = await req("POST", "/stay-folio-lines", {
        stayFolioId: folioId,
        lineType: "room_charge",
        description: "Room charge - Night 1",
        quantity: 1,
        amountCents: 15000,
        taxAmountCents: 1500,
      })
      expect(res.status).toBe(201)
      const json = (await res.json()) as {
        data: { lineType: string; amountCents: number; taxAmountCents: number }
      }
      expect(json.data.lineType).toBe("room_charge")
      expect(json.data.amountCents).toBe(15000)
      expect(json.data.taxAmountCents).toBe(1500)
    })

    it("lists folio lines filtered by stayFolioId", async () => {
      await req("POST", "/stay-folio-lines", {
        stayFolioId: folioId,
        lineType: "minibar",
        description: "Minibar charge",
        amountCents: 2500,
      })
      const res = await req("GET", `/stay-folio-lines?stayFolioId=${folioId}`)
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: unknown[]; total: number }
      expect(json.total).toBeGreaterThanOrEqual(1)
    })

    it("gets folio line by id", async () => {
      const cr = await req("POST", "/stay-folio-lines", {
        stayFolioId: folioId,
        lineType: "fee",
        description: "Service fee",
        amountCents: 500,
      })
      const { data } = (await cr.json()) as { data: { id: string } }
      const res = await req("GET", `/stay-folio-lines/${data.id}`)
      expect(res.status).toBe(200)
    })

    it("returns 404 for unknown folio line", async () => {
      const res = await req("GET", `/stay-folio-lines/${newId("stay_folio_lines")}`)
      expect(res.status).toBe(404)
    })

    it("updates a folio line", async () => {
      const cr = await req("POST", "/stay-folio-lines", {
        stayFolioId: folioId,
        lineType: "room_charge",
        description: "Room charge",
        amountCents: 10000,
      })
      const { data } = (await cr.json()) as { data: { id: string } }
      const res = await req("PATCH", `/stay-folio-lines/${data.id}`, {
        amountCents: 12000,
        notes: "Adjusted rate",
      })
      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: { amountCents: number; notes: string } }
      expect(json.data.amountCents).toBe(12000)
      expect(json.data.notes).toBe("Adjusted rate")
    })

    it("deletes a folio line", async () => {
      const cr = await req("POST", "/stay-folio-lines", {
        stayFolioId: folioId,
        lineType: "adjustment",
        description: "Discount",
        amountCents: -500,
      })
      const { data } = (await cr.json()) as { data: { id: string } }
      const res = await req("DELETE", `/stay-folio-lines/${data.id}`)
      expect(res.status).toBe(200)
    })
  })
})
