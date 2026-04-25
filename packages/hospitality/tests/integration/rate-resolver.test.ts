/**
 * Closes #312.
 *
 * Verifies `hospitalityService.resolveStayDailyRates` reads the flat
 * base rate from `room_type_rates` for a (rate plan, room type) pair
 * and applies `rate_plan_inventory_overrides` restrictions on the
 * date range.
 *
 * Date-scoped rate variation (weekend bumps via the linked
 * `priceScheduleId` in the pricing module) is NOT covered here — see
 * the resolver's JSDoc and the follow-up filed as #312's notes.
 */

import { facilities, properties } from "@voyantjs/facilities/schema"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"

import {
  ratePlanInventoryOverrides,
  ratePlans,
  roomTypeRates,
  roomTypes,
} from "../../src/schema.js"
import { hospitalityService } from "../../src/service.js"

const DB_AVAILABLE = !!process.env.TEST_DATABASE_URL

let counter = 0
function id(prefix: string) {
  counter += 1
  return `${prefix}_resolver${counter}`
}

describe.skipIf(!DB_AVAILABLE)("hospitality.resolveStayDailyRates", () => {
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
    await db.insert(facilities).values({ id: facilityId, name: "Resolver Hotel", type: "property" })
    propertyId = id("prop")
    await db.insert(properties).values({ id: propertyId, facilityId, propertyType: "hotel" })
    roomTypeId = id("hrmt")
    await db.insert(roomTypes).values({ id: roomTypeId, propertyId, code: "STD", name: "Standard" })
    ratePlanId = id("hrpl")
    await db.insert(ratePlans).values({
      id: ratePlanId,
      propertyId,
      code: "BAR",
      name: "Best Available Rate",
      currencyCode: "EUR",
    })
  })

  async function seedRate(amount: number) {
    await db.insert(roomTypeRates).values({
      id: id("hrtr"),
      ratePlanId,
      roomTypeId,
      currencyCode: "EUR",
      baseAmountCents: amount,
      extraAdultAmountCents: 2000,
      extraChildAmountCents: 1000,
    })
  }

  it("flat rate plan returns N identical nightly rows", async () => {
    await seedRate(15000)

    const result = await hospitalityService.resolveStayDailyRates(db, {
      ratePlanId,
      roomTypeId,
      startDate: "2026-09-10",
      endDate: "2026-09-13", // 3 nights
    })
    expect(result.status).toBe("ok")
    if (result.status !== "ok") throw new Error()

    expect(result.rates).toHaveLength(3)
    expect(result.rates.map((r) => r.date)).toEqual(["2026-09-10", "2026-09-11", "2026-09-12"])
    for (const r of result.rates) {
      expect(r.sellAmountCents).toBe(15000)
      expect(r.sellCurrency).toBe("EUR")
      expect(r.extraAdultAmountCents).toBe(2000)
    }
  })

  it("returns rate_not_found when no room_type_rates row exists for the pair", async () => {
    const result = await hospitalityService.resolveStayDailyRates(db, {
      ratePlanId,
      roomTypeId,
      startDate: "2026-09-10",
      endDate: "2026-09-13",
    })
    expect(result.status).toBe("rate_not_found")
    if (result.status !== "rate_not_found") throw new Error()
    expect(result.ratePlanId).toBe(ratePlanId)
  })

  it("returns stop_sell when an override on any night blocks the sale", async () => {
    await seedRate(15000)
    await db.insert(ratePlanInventoryOverrides).values({
      id: id("hrio"),
      ratePlanId,
      roomTypeId,
      date: "2026-09-11",
      stopSell: true,
    })

    const result = await hospitalityService.resolveStayDailyRates(db, {
      ratePlanId,
      roomTypeId,
      startDate: "2026-09-10",
      endDate: "2026-09-13",
    })
    expect(result.status).toBe("stop_sell")
    if (result.status !== "stop_sell") throw new Error()
    expect(result.date).toBe("2026-09-11")
  })

  it("returns closed_to_arrival when the first night is CTA", async () => {
    await seedRate(15000)
    await db.insert(ratePlanInventoryOverrides).values({
      id: id("hrio"),
      ratePlanId,
      roomTypeId,
      date: "2026-09-10",
      closedToArrival: true,
    })

    const result = await hospitalityService.resolveStayDailyRates(db, {
      ratePlanId,
      roomTypeId,
      startDate: "2026-09-10",
      endDate: "2026-09-13",
    })
    expect(result.status).toBe("closed_to_arrival")
  })

  it("returns closed_to_departure when the last night is CTD", async () => {
    await seedRate(15000)
    await db.insert(ratePlanInventoryOverrides).values({
      id: id("hrio"),
      ratePlanId,
      roomTypeId,
      date: "2026-09-12",
      closedToDeparture: true,
    })

    const result = await hospitalityService.resolveStayDailyRates(db, {
      ratePlanId,
      roomTypeId,
      startDate: "2026-09-10",
      endDate: "2026-09-13",
    })
    expect(result.status).toBe("closed_to_departure")
  })

  it("ignores CTA/CTD overrides on non-edge nights", async () => {
    await seedRate(15000)
    // Mid-stay night flagged CTA — should NOT reject because we're not
    // arriving on that date.
    await db.insert(ratePlanInventoryOverrides).values({
      id: id("hrio"),
      ratePlanId,
      roomTypeId,
      date: "2026-09-11",
      closedToArrival: true,
    })

    const result = await hospitalityService.resolveStayDailyRates(db, {
      ratePlanId,
      roomTypeId,
      startDate: "2026-09-10",
      endDate: "2026-09-13",
    })
    expect(result.status).toBe("ok")
  })

  it("returns empty rates for zero-night range (defensive)", async () => {
    await seedRate(15000)
    const result = await hospitalityService.resolveStayDailyRates(db, {
      ratePlanId,
      roomTypeId,
      startDate: "2026-09-10",
      endDate: "2026-09-10",
    })
    expect(result.status).toBe("ok")
    if (result.status !== "ok") throw new Error()
    expect(result.rates).toHaveLength(0)
  })
})
