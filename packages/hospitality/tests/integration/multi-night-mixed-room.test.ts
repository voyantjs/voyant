/**
 * Reference implementation: 7-night hotel stay with a mid-stay room-type
 * change. Validates whether the bookings + hospitality schema can model
 * the use case end-to-end.
 *
 * Setup:
 *   - Property "Hotel Voyant Test"
 *   - Two room types: "Deluxe" (3 nights) and "Suite" (4 nights)
 *   - One rate plan that covers both room types, currency EUR
 *   - One meal plan that includes breakfast
 *   - One bookings.bookings row (the parent booking) with two
 *     bookings.booking_items rows, each extended by a hospitality
 *     stay_booking_items row
 *   - Per-night rates loaded into stay_daily_rates
 *   - One additional booking_items row for an extra (parking)
 *
 * The test asserts that:
 *   - The parent booking's `sellAmountCents` matches Σ(stay_daily_rates) +
 *     extras
 *   - Each stay_booking_item has the correct `nightCount`
 *   - The room-type change is reflected in two distinct stay_booking_items
 *     covering contiguous date ranges
 *   - Breakfast is captured via mealPlanId
 *
 * Findings from running this exercise are summarised in
 * `docs/architecture/hotel-booking-validation.md`. Closes #293.
 */

import { bookingItems, bookings } from "@voyantjs/bookings/schema"
import { facilities, properties } from "@voyantjs/facilities/schema"
import { eq, sql } from "drizzle-orm"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"
import { stayBookingItems, stayDailyRates } from "../../src/schema-bookings.js"
import { mealPlans, ratePlanRoomTypes, ratePlans, roomTypes } from "../../src/schema-inventory.js"

const DB_AVAILABLE = !!process.env.TEST_DATABASE_URL

let counter = 0
function id(prefix: string) {
  counter += 1
  return `${prefix}_h${counter}`
}

describe.skipIf(!DB_AVAILABLE)("hotel multi-night booking — schema validation", () => {
  // biome-ignore lint/suspicious/noExplicitAny: test db type
  let db: any

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
  })

  it("models a 7-night booking with mid-stay room change + breakfast meal plan + parking add-on", async () => {
    // ---- Seed property + room types + rate plan + meal plan ---------------
    const facilityId = id("fac")
    await db.insert(facilities).values({
      id: facilityId,
      name: "Hotel Voyant Test",
      type: "property",
    })

    const propertyId = id("prop")
    await db.insert(properties).values({
      id: propertyId,
      facilityId,
      propertyType: "hotel",
      checkInTime: "15:00",
      checkOutTime: "11:00",
    })

    const deluxeId = id("hrmt")
    const suiteId = id("hrmt")
    await db.insert(roomTypes).values([
      {
        id: deluxeId,
        propertyId,
        code: "DLX",
        name: "Deluxe",
        maxAdults: 2,
        maxChildren: 1,
        standardOccupancy: 2,
        maxOccupancy: 3,
      },
      {
        id: suiteId,
        propertyId,
        code: "STE",
        name: "Suite",
        maxAdults: 2,
        maxChildren: 2,
        standardOccupancy: 2,
        maxOccupancy: 4,
      },
    ])

    const breakfastMealPlan = id("hmlp")
    await db.insert(mealPlans).values({
      id: breakfastMealPlan,
      propertyId,
      code: "BB",
      name: "Bed & Breakfast",
      includesBreakfast: true,
    })

    const ratePlanId = id("hrpl")
    await db.insert(ratePlans).values({
      id: ratePlanId,
      propertyId,
      code: "BAR-BB",
      name: "Best Available Rate (BB)",
      currencyCode: "EUR",
      mealPlanId: breakfastMealPlan,
      chargeFrequency: "per_night",
      refundable: true,
    })

    await db.insert(ratePlanRoomTypes).values([
      { id: id("hrrt"), ratePlanId, roomTypeId: deluxeId },
      { id: id("hrrt"), ratePlanId, roomTypeId: suiteId },
    ])

    // ---- Create the parent booking + booking_items ------------------------
    const bookingNumber = `BK-HOTEL-${counter}`
    const [booking] = await db
      .insert(bookings)
      .values({
        bookingNumber,
        sellCurrency: "EUR",
        sourceType: "manual",
        startDate: "2026-09-10",
        endDate: "2026-09-17",
      })
      .returning()
    const bookingId = booking.id as string

    // Item 1: Deluxe room, nights 10-13 (3 nights)
    const deluxeRates = [
      { date: "2026-09-10", sellAmountCents: 18000 }, // Thu
      { date: "2026-09-11", sellAmountCents: 22000 }, // Fri (weekend bump)
      { date: "2026-09-12", sellAmountCents: 22000 }, // Sat
    ]
    const deluxeTotal = deluxeRates.reduce((s, r) => s + r.sellAmountCents, 0)

    const [deluxeBookingItem] = await db
      .insert(bookingItems)
      .values({
        bookingId,
        title: "Deluxe room, 3 nights",
        itemType: "accommodation",
        sellCurrency: "EUR",
        unitSellAmountCents: Math.floor(deluxeTotal / 3),
        totalSellAmountCents: deluxeTotal,
        quantity: 1,
      })
      .returning()

    const [deluxeStay] = await db
      .insert(stayBookingItems)
      .values({
        bookingItemId: deluxeBookingItem.id,
        propertyId,
        roomTypeId: deluxeId,
        ratePlanId,
        mealPlanId: breakfastMealPlan,
        checkInDate: "2026-09-10",
        checkOutDate: "2026-09-13",
        nightCount: 3,
        roomCount: 1,
        adults: 2,
      })
      .returning()

    await db.insert(stayDailyRates).values(
      deluxeRates.map((r) => ({
        stayBookingItemId: deluxeStay.id,
        date: r.date,
        sellCurrency: "EUR",
        sellAmountCents: r.sellAmountCents,
      })),
    )

    // Item 2: Suite, nights 13-17 (4 nights). Note check-in matches the
    // previous item's check-out — that's how the schema represents a
    // mid-stay move.
    const suiteRates = [
      { date: "2026-09-13", sellAmountCents: 30000 }, // Sun
      { date: "2026-09-14", sellAmountCents: 28000 }, // Mon
      { date: "2026-09-15", sellAmountCents: 28000 }, // Tue
      { date: "2026-09-16", sellAmountCents: 28000 }, // Wed
    ]
    const suiteTotal = suiteRates.reduce((s, r) => s + r.sellAmountCents, 0)

    const [suiteBookingItem] = await db
      .insert(bookingItems)
      .values({
        bookingId,
        title: "Suite, 4 nights",
        itemType: "accommodation",
        sellCurrency: "EUR",
        unitSellAmountCents: Math.floor(suiteTotal / 4),
        totalSellAmountCents: suiteTotal,
        quantity: 1,
      })
      .returning()

    const [suiteStay] = await db
      .insert(stayBookingItems)
      .values({
        bookingItemId: suiteBookingItem.id,
        propertyId,
        roomTypeId: suiteId,
        ratePlanId,
        mealPlanId: breakfastMealPlan,
        checkInDate: "2026-09-13",
        checkOutDate: "2026-09-17",
        nightCount: 4,
        roomCount: 1,
        adults: 2,
        children: 1,
      })
      .returning()

    await db.insert(stayDailyRates).values(
      suiteRates.map((r) => ({
        stayBookingItemId: suiteStay.id,
        date: r.date,
        sellCurrency: "EUR",
        sellAmountCents: r.sellAmountCents,
      })),
    )

    // Item 3: Parking — pure booking_items, no stay extension
    const parkingTotal = 7000 // 1000/night × 7
    await db.insert(bookingItems).values({
      bookingId,
      title: "Self-parking, 7 nights",
      itemType: "extra",
      sellCurrency: "EUR",
      unitSellAmountCents: 1000,
      totalSellAmountCents: parkingTotal,
      quantity: 7,
    })

    // ---- Roll the booking total ------------------------------------------
    const expectedTotal = deluxeTotal + suiteTotal + parkingTotal
    await db
      .update(bookings)
      .set({ sellAmountCents: expectedTotal, updatedAt: new Date() })
      .where(eq(bookings.id, bookingId))

    // ---- Assert ---------------------------------------------------------

    // 1. Two stay_booking_items, contiguous date ranges, totals 7 nights
    const stays = await db
      .select()
      .from(stayBookingItems)
      .where(
        sql`${stayBookingItems.bookingItemId} IN (
          SELECT id FROM booking_items WHERE booking_id = ${bookingId}
        )`,
      )
    expect(stays).toHaveLength(2)
    const totalNights = stays.reduce(
      (sum: number, s: { nightCount: number }) => sum + s.nightCount,
      0,
    )
    expect(totalNights).toBe(7)
    const sortedStays = [...stays].sort((a: { checkInDate: string }, b: { checkInDate: string }) =>
      a.checkInDate.localeCompare(b.checkInDate),
    )
    expect(sortedStays[0]?.checkInDate).toBe("2026-09-10")
    expect(sortedStays[0]?.checkOutDate).toBe("2026-09-13")
    expect(sortedStays[1]?.checkInDate).toBe("2026-09-13")
    expect(sortedStays[1]?.checkOutDate).toBe("2026-09-17")

    // 2. Per-night daily rates for both stays sum to the booking item totals
    const rates = await db
      .select()
      .from(stayDailyRates)
      .where(
        sql`${stayDailyRates.stayBookingItemId} IN (${sql.join(
          stays.map((s: { id: string }) => sql`${s.id}`),
          sql`, `,
        )})`,
      )
    expect(rates).toHaveLength(7)
    const rateSum = rates.reduce(
      (sum: number, r: { sellAmountCents: number | null }) => sum + (r.sellAmountCents ?? 0),
      0,
    )
    expect(rateSum).toBe(deluxeTotal + suiteTotal)

    // 3. Booking total covers stays + parking
    const [refreshedBooking] = await db
      .select({ sellAmountCents: bookings.sellAmountCents })
      .from(bookings)
      .where(eq(bookings.id, bookingId))
    expect(refreshedBooking?.sellAmountCents).toBe(expectedTotal)

    // 4. Both stays reference the breakfast meal plan
    expect(
      stays.every((s: { mealPlanId: string | null }) => s.mealPlanId === breakfastMealPlan),
    ).toBe(true)
  })
})
