/**
 * Closes #319.
 *
 * Verifies serialized-mode (per-physical-room) stay reserve picks an
 * available `room_unit`, locks it, and excludes units covered by
 * `room_blocks` / `maintenance_blocks` or already in an overlapping
 * reserved stay.
 */

import { bookingItems, bookings } from "@voyantjs/bookings/schema"
import { facilities, properties } from "@voyantjs/facilities/schema"
import { eq } from "drizzle-orm"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"
import {
  maintenanceBlocks,
  ratePlanRoomTypes,
  ratePlans,
  roomBlocks,
  roomTypes,
  roomUnits,
} from "../../src/schema.js"
import { stayBookingItems } from "../../src/schema-bookings.js"
import { hospitalityService } from "../../src/service.js"

const DB_AVAILABLE = !!process.env.TEST_DATABASE_URL

let counter = 0
function id(prefix: string) {
  counter += 1
  return `${prefix}_ser${counter}`
}

describe.skipIf(!DB_AVAILABLE)("hospitality.reserveStay — serialized mode", () => {
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
    await db
      .insert(facilities)
      .values({ id: facilityId, name: "Serialized Hotel", type: "property" })
    propertyId = id("prop")
    await db.insert(properties).values({ id: propertyId, facilityId, propertyType: "hotel" })
    roomTypeId = id("hrmt")
    await db.insert(roomTypes).values({
      id: roomTypeId,
      propertyId,
      code: "STD",
      name: "Standard",
      inventoryMode: "serialized",
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

  async function seedRoomUnit(code: string, status: "active" | "out_of_order" = "active") {
    const unitId = id("hrun")
    await db.insert(roomUnits).values({
      id: unitId,
      propertyId,
      roomTypeId,
      code,
      roomNumber: code,
      status,
    })
    return unitId
  }

  async function seedBooking() {
    const [booking] = await db
      .insert(bookings)
      .values({
        bookingNumber: `BK-SER-${counter}`,
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

  it("picks an active unit and persists roomUnitId on the stay row", async () => {
    const unitId = await seedRoomUnit("101")
    const a = await seedBooking()

    const result = await hospitalityService.reserveStay(
      db,
      reservePayload(a.bookingItemId, "2026-09-10", "2026-09-12"),
    )
    expect(result.status).toBe("ok")
    if (result.status !== "ok") throw new Error()
    expect(result.roomUnitId).toBe(unitId)

    const [stay] = await db
      .select()
      .from(stayBookingItems)
      .where(eq(stayBookingItems.id, result.stayBookingItemId))
    expect(stay?.roomUnitId).toBe(unitId)
  })

  it("two concurrent reserves with one available unit — exactly one succeeds", async () => {
    await seedRoomUnit("101")
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

    const ok = [resultA, resultB].filter((r) => r.status === "ok")
    const conflicts = [resultA, resultB].filter((r) => r.status === "no_unit_available")
    expect(ok).toHaveLength(1)
    expect(conflicts).toHaveLength(1)

    const stays = await db.select().from(stayBookingItems)
    expect(stays).toHaveLength(1)
  })

  it("with two units, two concurrent reserves both succeed on different units", async () => {
    const unitA = await seedRoomUnit("101")
    const unitB = await seedRoomUnit("102")
    const bookingA = await seedBooking()
    const bookingB = await seedBooking()

    const [resultA, resultB] = await Promise.all([
      hospitalityService.reserveStay(
        db,
        reservePayload(bookingA.bookingItemId, "2026-09-10", "2026-09-12"),
      ),
      hospitalityService.reserveStay(
        db,
        reservePayload(bookingB.bookingItemId, "2026-09-10", "2026-09-12"),
      ),
    ])
    expect(resultA.status).toBe("ok")
    expect(resultB.status).toBe("ok")

    const assigned = new Set<string | undefined | null>()
    if (resultA.status === "ok") assigned.add(resultA.roomUnitId)
    if (resultB.status === "ok") assigned.add(resultB.roomUnitId)
    expect(assigned.size).toBe(2)
    expect(assigned.has(unitA)).toBe(true)
    expect(assigned.has(unitB)).toBe(true)
  })

  it("skips units in out_of_order status", async () => {
    await seedRoomUnit("101", "out_of_order")
    const a = await seedBooking()

    const result = await hospitalityService.reserveStay(
      db,
      reservePayload(a.bookingItemId, "2026-09-10", "2026-09-12"),
    )
    expect(result.status).toBe("no_unit_available")
  })

  it("skips units covered by a per-unit room_block whose range overlaps", async () => {
    const unitId = await seedRoomUnit("101")
    await db.insert(roomBlocks).values({
      id: id("hrbl"),
      propertyId,
      roomUnitId: unitId,
      startsOn: "2026-09-09",
      endsOn: "2026-09-15",
      status: "confirmed",
    })
    const a = await seedBooking()

    const result = await hospitalityService.reserveStay(
      db,
      reservePayload(a.bookingItemId, "2026-09-10", "2026-09-12"),
    )
    expect(result.status).toBe("no_unit_available")
  })

  it("skips units covered by a property-wide roomType room_block", async () => {
    await seedRoomUnit("101")
    await db.insert(roomBlocks).values({
      id: id("hrbl"),
      propertyId,
      roomTypeId,
      // No roomUnitId → applies to all units of this room type
      startsOn: "2026-09-09",
      endsOn: "2026-09-15",
      status: "held",
    })
    const a = await seedBooking()

    const result = await hospitalityService.reserveStay(
      db,
      reservePayload(a.bookingItemId, "2026-09-10", "2026-09-12"),
    )
    expect(result.status).toBe("no_unit_available")
  })

  it("does NOT skip units whose room_block has been released", async () => {
    const unitId = await seedRoomUnit("101")
    await db.insert(roomBlocks).values({
      id: id("hrbl"),
      propertyId,
      roomUnitId: unitId,
      startsOn: "2026-09-09",
      endsOn: "2026-09-15",
      status: "released",
    })
    const a = await seedBooking()

    const result = await hospitalityService.reserveStay(
      db,
      reservePayload(a.bookingItemId, "2026-09-10", "2026-09-12"),
    )
    expect(result.status).toBe("ok")
  })

  it("skips units in maintenance_blocks (open or in_progress)", async () => {
    const unitId = await seedRoomUnit("101")
    await db.insert(maintenanceBlocks).values({
      id: id("hmbl"),
      propertyId,
      roomUnitId: unitId,
      startsOn: "2026-09-10",
      endsOn: "2026-09-13",
      status: "in_progress",
    })
    const a = await seedBooking()

    const result = await hospitalityService.reserveStay(
      db,
      reservePayload(a.bookingItemId, "2026-09-10", "2026-09-12"),
    )
    expect(result.status).toBe("no_unit_available")
  })

  it("skips units already in an overlapping reserved stay", async () => {
    const unitId = await seedRoomUnit("101")
    const first = await seedBooking()
    const ok = await hospitalityService.reserveStay(
      db,
      reservePayload(first.bookingItemId, "2026-09-08", "2026-09-12"),
    )
    expect(ok.status).toBe("ok")
    if (ok.status === "ok") {
      expect(ok.roomUnitId).toBe(unitId)
    }

    const second = await seedBooking()
    const result = await hospitalityService.reserveStay(
      db,
      reservePayload(second.bookingItemId, "2026-09-10", "2026-09-14"),
    )
    expect(result.status).toBe("no_unit_available")
  })

  it("does NOT skip units whose existing stay was cancelled", async () => {
    const unitId = await seedRoomUnit("101")
    const first = await seedBooking()
    const result1 = await hospitalityService.reserveStay(
      db,
      reservePayload(first.bookingItemId, "2026-09-08", "2026-09-12"),
    )
    if (result1.status !== "ok") throw new Error()
    await db
      .update(stayBookingItems)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(stayBookingItems.id, result1.stayBookingItemId))

    const second = await seedBooking()
    const result2 = await hospitalityService.reserveStay(
      db,
      reservePayload(second.bookingItemId, "2026-09-10", "2026-09-14"),
    )
    expect(result2.status).toBe("ok")
    if (result2.status === "ok") {
      expect(result2.roomUnitId).toBe(unitId)
    }
  })

  it("returns room_type_not_found when the roomTypeId doesn't exist", async () => {
    const a = await seedBooking()
    const result = await hospitalityService.reserveStay(db, {
      bookingItemId: a.bookingItemId,
      propertyId,
      roomTypeId: "hrmt_does_not_exist",
      ratePlanId,
      checkInDate: "2026-09-10",
      checkOutDate: "2026-09-12",
      adults: 1,
      dailyRates: [
        { sellCurrency: "EUR", sellAmountCents: 12000 },
        { sellCurrency: "EUR", sellAmountCents: 12000 },
      ],
    })
    expect(result.status).toBe("room_type_not_found")
  })
})
