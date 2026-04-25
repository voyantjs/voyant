/**
 * Closes #318.
 *
 * Verifies `resolveStayDailyRates` consults `room_type_rates` rows
 * linked via `priceScheduleId` and applies per-date variation —
 * weekend bumps, seasonal windows, priority resolution.
 *
 * The recurrence is matched by `weekdays` + `validFrom`/`validTo`
 * columns on `price_schedules`. Full iCal RRULE parsing is NOT
 * implemented; that's a follow-up if more complex patterns become
 * needed.
 */

import { facilities, properties } from "@voyantjs/facilities/schema"
import { priceCatalogs, priceSchedules } from "@voyantjs/pricing"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"

import { ratePlans, roomTypeRates, roomTypes } from "../../src/schema.js"
import { hospitalityService } from "../../src/service.js"

const DB_AVAILABLE = !!process.env.TEST_DATABASE_URL

let counter = 0
function id(prefix: string) {
  counter += 1
  return `${prefix}_psched${counter}`
}

describe.skipIf(!DB_AVAILABLE)(
  "hospitality.resolveStayDailyRates — date-scoped rate variation",
  () => {
    // biome-ignore lint/suspicious/noExplicitAny: test db
    let db: any
    let propertyId: string
    let roomTypeId: string
    let ratePlanId: string
    let priceCatalogId: string

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
        .values({ id: facilityId, name: "Schedule Hotel", type: "property" })
      propertyId = id("prop")
      await db.insert(properties).values({ id: propertyId, facilityId, propertyType: "hotel" })
      roomTypeId = id("hrmt")
      await db
        .insert(roomTypes)
        .values({ id: roomTypeId, propertyId, code: "STD", name: "Standard" })
      ratePlanId = id("hrpl")
      await db.insert(ratePlans).values({
        id: ratePlanId,
        propertyId,
        code: "BAR",
        name: "Best Available Rate",
        currencyCode: "EUR",
      })
      priceCatalogId = id("prca")
      await db.insert(priceCatalogs).values({
        id: priceCatalogId,
        code: `cat-${counter}`,
        name: "Default catalog",
      })
    })

    async function seedDefaultRate(amount: number) {
      await db.insert(roomTypeRates).values({
        id: id("hrtr"),
        ratePlanId,
        roomTypeId,
        currencyCode: "EUR",
        baseAmountCents: amount,
        // No priceScheduleId → default rate
      })
    }

    async function seedSchedule(opts: {
      weekdays?: string[]
      validFrom?: string
      validTo?: string
      priority?: number
      name?: string
    }) {
      const scheduleId = id("prsc")
      await db.insert(priceSchedules).values({
        id: scheduleId,
        priceCatalogId,
        code: scheduleId,
        name: opts.name ?? "Schedule",
        recurrenceRule: "FREQ=DAILY", // unused — we match via weekdays/validFrom/validTo
        weekdays: opts.weekdays ?? null,
        validFrom: opts.validFrom ?? null,
        validTo: opts.validTo ?? null,
        priority: opts.priority ?? 0,
      })
      return scheduleId
    }

    async function seedScheduledRate(scheduleId: string, amount: number) {
      await db.insert(roomTypeRates).values({
        id: id("hrtr"),
        ratePlanId,
        roomTypeId,
        priceScheduleId: scheduleId,
        currencyCode: "EUR",
        baseAmountCents: amount,
      })
    }

    it("flat default rate (no schedules) — backwards-compatible behaviour", async () => {
      await seedDefaultRate(15000)
      const result = await hospitalityService.resolveStayDailyRates(db, {
        ratePlanId,
        roomTypeId,
        startDate: "2026-09-10",
        endDate: "2026-09-13",
      })
      expect(result.status).toBe("ok")
      if (result.status !== "ok") throw new Error()
      expect(result.rates).toHaveLength(3)
      for (const r of result.rates) {
        expect(r.sellAmountCents).toBe(15000)
      }
    })

    it("weekend bump: Fri/Sat use the schedule rate, weekdays use the default", async () => {
      await seedDefaultRate(15000)
      const weekendId = await seedSchedule({
        weekdays: ["fri", "sat"],
        priority: 10,
        name: "Weekend",
      })
      await seedScheduledRate(weekendId, 25000)

      // 2026-09-10 is Thursday → 15000
      // 2026-09-11 is Friday → 25000
      // 2026-09-12 is Saturday → 25000
      // 2026-09-13 is Sunday → 15000 (back to default; Sunday isn't in the schedule)
      const result = await hospitalityService.resolveStayDailyRates(db, {
        ratePlanId,
        roomTypeId,
        startDate: "2026-09-10",
        endDate: "2026-09-14",
      })
      expect(result.status).toBe("ok")
      if (result.status !== "ok") throw new Error()
      const map = new Map(result.rates.map((r) => [r.date, r.sellAmountCents]))
      expect(map.get("2026-09-10")).toBe(15000)
      expect(map.get("2026-09-11")).toBe(25000)
      expect(map.get("2026-09-12")).toBe(25000)
      expect(map.get("2026-09-13")).toBe(15000)
    })

    it("seasonal window: validFrom/validTo on the schedule scopes the rate", async () => {
      await seedDefaultRate(10000)
      const seasonId = await seedSchedule({
        validFrom: "2026-12-20",
        validTo: "2027-01-05",
        priority: 5,
        name: "High Season",
      })
      await seedScheduledRate(seasonId, 20000)

      // Mid-Dec date → high season rate
      // Mid-Jan date → default rate
      const result = await hospitalityService.resolveStayDailyRates(db, {
        ratePlanId,
        roomTypeId,
        startDate: "2026-12-19",
        endDate: "2027-01-08",
      })
      expect(result.status).toBe("ok")
      if (result.status !== "ok") throw new Error()
      const map = new Map(result.rates.map((r) => [r.date, r.sellAmountCents]))
      expect(map.get("2026-12-19")).toBe(10000) // before the window
      expect(map.get("2026-12-20")).toBe(20000) // first day in window
      expect(map.get("2027-01-05")).toBe(20000) // last day in window
      expect(map.get("2027-01-06")).toBe(10000) // after the window
    })

    it("priority resolution: higher-priority schedule wins when multiple match", async () => {
      await seedDefaultRate(10000)
      // Lower priority weekend bump
      const weekendId = await seedSchedule({
        weekdays: ["fri", "sat"],
        priority: 5,
        name: "Weekend",
      })
      await seedScheduledRate(weekendId, 15000)
      // Higher priority Christmas premium covering the same Friday
      const xmasId = await seedSchedule({
        validFrom: "2026-12-23",
        validTo: "2026-12-26",
        priority: 100,
        name: "Christmas",
      })
      await seedScheduledRate(xmasId, 30000)

      // 2026-12-25 is Friday → matches both Weekend AND Christmas; Christmas wins on priority
      const result = await hospitalityService.resolveStayDailyRates(db, {
        ratePlanId,
        roomTypeId,
        startDate: "2026-12-25",
        endDate: "2026-12-26",
      })
      expect(result.status).toBe("ok")
      if (result.status !== "ok") throw new Error()
      expect(result.rates[0]?.sellAmountCents).toBe(30000)
    })

    it("inactive schedule is ignored", async () => {
      await seedDefaultRate(10000)
      const weekendId = id("prsc")
      await db.insert(priceSchedules).values({
        id: weekendId,
        priceCatalogId,
        code: weekendId,
        name: "Inactive weekend",
        recurrenceRule: "FREQ=DAILY",
        weekdays: ["fri", "sat"],
        priority: 10,
        active: false,
      })
      await seedScheduledRate(weekendId, 25000)

      // 2026-09-11 is Friday — but the schedule is inactive, so default applies
      const result = await hospitalityService.resolveStayDailyRates(db, {
        ratePlanId,
        roomTypeId,
        startDate: "2026-09-11",
        endDate: "2026-09-12",
      })
      expect(result.status).toBe("ok")
      if (result.status !== "ok") throw new Error()
      expect(result.rates[0]?.sellAmountCents).toBe(10000)
    })

    it("rate_not_found when no rate rows exist at all", async () => {
      const result = await hospitalityService.resolveStayDailyRates(db, {
        ratePlanId,
        roomTypeId,
        startDate: "2026-09-10",
        endDate: "2026-09-13",
      })
      expect(result.status).toBe("rate_not_found")
    })
  },
)
