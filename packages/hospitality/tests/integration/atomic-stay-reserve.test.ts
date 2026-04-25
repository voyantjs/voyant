/**
 * Closes #311.
 *
 * Verifies that concurrent stay reservations against pooled-mode room
 * inventory serialize through the per-night `room_inventory` row lock,
 * so exactly the right number of reserves succeed and the rest receive
 * a typed `insufficient_capacity` failure.
 *
 * Pattern mirrors `packages/bookings/tests/integration/concurrency.test.ts`.
 */

import { bookingItems, bookings } from "@voyantjs/bookings/schema"
import { facilities, properties } from "@voyantjs/facilities/schema"
import { and, eq } from "drizzle-orm"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"

import { ratePlanRoomTypes, ratePlans, roomInventory, roomTypes } from "../../src/schema.js"
import { stayBookingItems } from "../../src/schema-bookings.js"
import { hospitalityService } from "../../src/service.js"

const DB_AVAILABLE = !!process.env.TEST_DATABASE_URL

let counter = 0
function id(prefix: string) {
  counter += 1
  return `${prefix}_atomic${counter}`
}

describe.skipIf(!DB_AVAILABLE)("hospitality.reserveStay — atomic inventory consumption", () => {
  // biome-ignore lint/suspicious/noExplicitAny: test db
  let db: any
  let propertyId: string
  let roomTypeId: string
  let ratePlanId: string

  beforeAll(async () => {
    const { createTestDb, cleanupTestDb } = await import("@voyantjs/db/test-utils")
    db = createTestDb()
    await cleanupTestDb(db)
  })

  afterAll(async () => {
    const { closeTestDb } = await import("@voyantjs/db/test-utils")
    await closeTestDb()
  })

  beforeEach(async () => {
    const { cleanupTestDb } = await import("@voyantjs/db/test-utils")
    await cleanupTestDb(db)

    const facilityId = id("fac")
    await db.insert(facilities).values({ id: facilityId, name: "Test Hotel", type: "property" })
    propertyId = id("prop")
    await db.insert(properties).values({
      id: propertyId,
      facilityId,
      propertyType: "hotel",
    })
    roomTypeId = id("hrmt")
    await db.insert(roomTypes).values({
      id: roomTypeId,
      propertyId,
      code: "STD",
      name: "Standard",
    })
    ratePlanId = id("hrpl")
    await db.insert(ratePlans).values({
      id: ratePlanId,
      propertyId,
      code: "BAR",
      name: "Best Available Rate",
      currencyCode: "EUR",
    })
    await db.insert(ratePlanRoomTypes).values({ id: id("hrrt"), ratePlanId, roomTypeId })
  })

  async function seedInventory(dates: string[], totalUnits: number, available: number) {
    await db.insert(roomInventory).values(
      dates.map((date) => ({
        id: id("hriv"),
        propertyId,
        roomTypeId,
        date,
        totalUnits,
        availableUnits: available,
      })),
    )
  }

  async function seedBooking() {
    const [booking] = await db
      .insert(bookings)
      .values({
        bookingNumber: `BK-STAY-${counter}`,
        sellCurrency: "EUR",
      })
      .returning()
    const [item] = await db
      .insert(bookingItems)
      .values({
        bookingId: booking.id,
        title: "Stay placeholder",
        itemType: "accommodation",
        sellCurrency: "EUR",
      })
      .returning()
    return { bookingId: booking.id as string, bookingItemId: item.id as string }
  }

  function reservePayload(bookingItemId: string, checkInDate: string, checkOutDate: string) {
    const nightCount = Math.round(
      (new Date(`${checkOutDate}T00:00:00Z`).getTime() -
        new Date(`${checkInDate}T00:00:00Z`).getTime()) /
        (24 * 60 * 60 * 1000),
    )
    return {
      bookingItemId,
      propertyId,
      roomTypeId,
      ratePlanId,
      checkInDate,
      checkOutDate,
      adults: 2,
      dailyRates: Array.from({ length: nightCount }, () => ({
        sellCurrency: "EUR" as const,
        sellAmountCents: 12000,
      })),
    }
  }

  it("two concurrent reserves on the last available room — exactly one succeeds, one returns insufficient_capacity", async () => {
    await seedInventory(["2026-09-10", "2026-09-11"], 5, 1)
    const a = await seedBooking()
    const b = await seedBooking()

    const [resultA, resultB] = await Promise.all([
      hospitalityService.reserveStay(
        db,
        reservePayload(a.bookingItemId, "2026-09-10", "2026-09-12"),
      ),
      hospitalityService.reserveStay(
        db,
        reservePayload(b.bookingItemId, "2026-09-10", "2026-09-12"),
      ),
    ])

    const successes = [resultA, resultB].filter((r) => r.status === "ok")
    const conflicts = [resultA, resultB].filter((r) => r.status === "insufficient_capacity")
    expect(successes).toHaveLength(1)
    expect(conflicts).toHaveLength(1)

    // Inventory rolled correctly: both nights at 0 available, 1 held
    const inventoryRows = await db
      .select()
      .from(roomInventory)
      .where(eq(roomInventory.roomTypeId, roomTypeId))
    expect(inventoryRows).toHaveLength(2)
    for (const row of inventoryRows) {
      expect(row.availableUnits).toBe(0)
      expect(row.heldUnits).toBe(1)
    }

    // Exactly one stay_booking_items row created
    const stays = await db.select().from(stayBookingItems)
    expect(stays).toHaveLength(1)
  })

  it("ten concurrent reserves on a 5-room slot — exactly five succeed", async () => {
    await seedInventory(["2026-09-10", "2026-09-11"], 5, 5)
    const seeded = await Promise.all(Array.from({ length: 10 }, () => seedBooking()))

    const results = await Promise.all(
      seeded.map((b) =>
        hospitalityService.reserveStay(
          db,
          reservePayload(b.bookingItemId, "2026-09-10", "2026-09-12"),
        ),
      ),
    )

    const ok = results.filter((r) => r.status === "ok")
    const conflicts = results.filter((r) => r.status === "insufficient_capacity")
    expect(ok).toHaveLength(5)
    expect(conflicts).toHaveLength(5)

    const inventoryRows = await db
      .select()
      .from(roomInventory)
      .where(eq(roomInventory.roomTypeId, roomTypeId))
    for (const row of inventoryRows) {
      expect(row.availableUnits).toBe(0)
      expect(row.heldUnits).toBe(5)
    }
  })

  it("rejects when a single night within the range is sold out", async () => {
    // Day 1 has 5 available, day 2 has 0 available — reserve fails on day 2,
    // day 1 inventory MUST NOT be touched (atomic check).
    await seedInventory(["2026-09-10"], 5, 5)
    await seedInventory(["2026-09-11"], 5, 0)
    const a = await seedBooking()

    const result = await hospitalityService.reserveStay(
      db,
      reservePayload(a.bookingItemId, "2026-09-10", "2026-09-12"),
    )
    expect(result.status).toBe("insufficient_capacity")
    if (result.status !== "insufficient_capacity") throw new Error()
    expect(result.date).toBe("2026-09-11")

    // Day 1 inventory must be untouched
    const [day1] = await db
      .select()
      .from(roomInventory)
      .where(and(eq(roomInventory.roomTypeId, roomTypeId), eq(roomInventory.date, "2026-09-10")))
    expect(day1.availableUnits).toBe(5)
    expect(day1.heldUnits).toBe(0)
  })

  it("rejects when stop_sell is true on any night", async () => {
    await db.insert(roomInventory).values([
      {
        id: id("hriv"),
        propertyId,
        roomTypeId,
        date: "2026-09-10",
        totalUnits: 5,
        availableUnits: 5,
      },
      {
        id: id("hriv"),
        propertyId,
        roomTypeId,
        date: "2026-09-11",
        totalUnits: 5,
        availableUnits: 5,
        stopSell: true,
      },
    ])
    const a = await seedBooking()

    const result = await hospitalityService.reserveStay(
      db,
      reservePayload(a.bookingItemId, "2026-09-10", "2026-09-12"),
    )
    expect(result.status).toBe("stop_sell")
  })

  it("rejects with inventory_missing when no row exists for a night", async () => {
    await seedInventory(["2026-09-10"], 5, 5) // only one of the two nights
    const a = await seedBooking()

    const result = await hospitalityService.reserveStay(
      db,
      reservePayload(a.bookingItemId, "2026-09-10", "2026-09-12"),
    )
    expect(result.status).toBe("inventory_missing")
    if (result.status !== "inventory_missing") throw new Error()
    expect(result.date).toBe("2026-09-11")
  })

  it("rejects rate_count_mismatch when dailyRates length doesn't match the night count", async () => {
    await seedInventory(["2026-09-10", "2026-09-11"], 5, 5)
    const a = await seedBooking()

    const result = await hospitalityService.reserveStay(db, {
      bookingItemId: a.bookingItemId,
      propertyId,
      roomTypeId,
      ratePlanId,
      checkInDate: "2026-09-10",
      checkOutDate: "2026-09-12",
      adults: 2,
      dailyRates: [{ sellCurrency: "EUR", sellAmountCents: 12000 }], // wrong length
    })
    expect(result.status).toBe("rate_count_mismatch")
    if (result.status !== "rate_count_mismatch") throw new Error()
    expect(result.expected).toBe(2)
    expect(result.received).toBe(1)

    // Inventory not touched
    const inventoryRows = await db
      .select()
      .from(roomInventory)
      .where(eq(roomInventory.roomTypeId, roomTypeId))
    for (const row of inventoryRows) {
      expect(row.availableUnits).toBe(5)
    }
  })
})
