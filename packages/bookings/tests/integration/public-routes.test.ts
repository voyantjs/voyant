import { eq } from "drizzle-orm"
import { Hono } from "hono"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"

import { availabilitySlotsRef } from "../../src/availability-ref.js"
import { publicBookingRoutes } from "../../src/routes-public.js"
import { bookingDocuments, bookingFulfillments } from "../../src/schema.js"

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL
const DB_AVAILABLE = !!TEST_DATABASE_URL

const json = (body: Record<string, unknown>) => ({
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
})

describe.skipIf(!DB_AVAILABLE)("Public booking routes", () => {
  let app: Hono
  let db: ReturnType<typeof import("@voyantjs/db/test-utils").createTestDb>

  beforeAll(async () => {
    const { createTestDb } = await import("@voyantjs/db/test-utils")

    db = createTestDb()
    app = new Hono()
      .use("*", async (c, next) => {
        c.set("db" as never, db)
        c.set("userId" as never, "public-test-user")
        await next()
      })
      .route("/", publicBookingRoutes)
  })

  beforeEach(async () => {
    const { cleanupTestDb } = await import("@voyantjs/db/test-utils")
    await cleanupTestDb(db)
  })

  afterAll(async () => {
    const { closeTestDb } = await import("@voyantjs/db/test-utils")
    await closeTestDb()
  })

  async function seedSlot(overrides: Record<string, unknown> = {}) {
    const [slot] = await db
      .insert(availabilitySlotsRef)
      .values({
        productId: "prod_public_booking",
        optionId: "opt_public_booking",
        dateLocal: "2026-06-01",
        startsAt: new Date("2026-06-01T09:00:00.000Z"),
        endsAt: new Date("2026-06-01T11:00:00.000Z"),
        timezone: "Europe/Bucharest",
        status: "open",
        unlimited: false,
        initialPax: 10,
        remainingPax: 10,
        pastCutoff: false,
        tooEarly: false,
        ...overrides,
      })
      .returning()

    return slot
  }

  it("creates a public booking session from a storefront reservation request", async () => {
    const slot = await seedSlot()

    const res = await app.request("/sessions", {
      method: "POST",
      ...json({
        sellCurrency: "EUR",
        items: [
          {
            title: "Danube tour",
            availabilitySlotId: slot.id,
            quantity: 2,
            totalSellAmountCents: 24000,
            productId: slot.productId,
            optionId: slot.optionId,
          },
        ],
        participants: [
          {
            firstName: "Ana",
            lastName: "Popescu",
            email: "ana@example.com",
            isPrimary: true,
          },
        ],
      }),
    })

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data.status).toBe("on_hold")
    expect(body.data.bookingNumber).toMatch(/^BK-\d{4}-\d{6}$/)
    expect(body.data.participants).toHaveLength(1)
    expect(body.data.allocations).toHaveLength(1)
    expect(body.data.checklist.readyForConfirmation).toBe(true)

    const [slotAfter] = await db
      .select()
      .from(availabilitySlotsRef)
      .where(eq(availabilitySlotsRef.id, slot.id))

    expect(slotAfter?.remainingPax).toBe(8)
  })

  it("updates a booking session contact state and derives pax from traveler participants", async () => {
    const slot = await seedSlot()

    const createRes = await app.request("/sessions", {
      method: "POST",
      ...json({
        sellCurrency: "EUR",
        items: [
          {
            title: "Prague city pass",
            availabilitySlotId: slot.id,
            quantity: 1,
            totalSellAmountCents: 12000,
          },
        ],
        participants: [
          {
            firstName: "Mihai",
            lastName: "Ionescu",
            email: "mihai@example.com",
            isPrimary: true,
          },
        ],
      }),
    })

    const session = (await createRes.json()).data

    const res = await app.request(`/sessions/${session.sessionId}`, {
      method: "PATCH",
      ...json({
        communicationLanguage: "ro",
        participants: [
          {
            id: session.participants[0].id,
            firstName: "Mihai",
            lastName: "Ionescu",
            email: "mihai@example.com",
            isPrimary: true,
          },
          {
            firstName: "Ioana",
            lastName: "Ionescu",
            email: "ioana@example.com",
            travelerCategory: "adult",
          },
        ],
      }),
    })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.communicationLanguage).toBe("ro")
    expect(body.data.participants).toHaveLength(2)
    expect(body.data.pax).toBe(2)
  })

  it("confirms a public booking session and returns overview lookup by booking number and email", async () => {
    const slot = await seedSlot()

    const createRes = await app.request("/sessions", {
      method: "POST",
      ...json({
        sellCurrency: "EUR",
        items: [
          {
            title: "Lisbon food tour",
            availabilitySlotId: slot.id,
            quantity: 1,
            totalSellAmountCents: 15000,
          },
        ],
        participants: [
          {
            firstName: "Elena",
            lastName: "Marin",
            email: "elena@example.com",
            isPrimary: true,
          },
        ],
      }),
    })

    const session = (await createRes.json()).data

    const confirmRes = await app.request(`/sessions/${session.sessionId}/confirm`, {
      method: "POST",
      ...json({}),
    })

    expect(confirmRes.status).toBe(200)
    const confirmed = (await confirmRes.json()).data
    expect(confirmed.status).toBe("confirmed")

    await db.insert(bookingDocuments).values({
      bookingId: session.sessionId,
      participantId: session.participants[0].id,
      type: "other",
      fileName: "voucher.pdf",
      fileUrl: "https://example.com/voucher.pdf",
    })

    await db.insert(bookingFulfillments).values({
      bookingId: session.sessionId,
      bookingItemId: session.items[0].id,
      participantId: session.participants[0].id,
      fulfillmentType: "voucher",
      deliveryChannel: "download",
      status: "issued",
      artifactUrl: "https://example.com/artifact.pdf",
    })

    const overviewRes = await app.request(
      `/overview?bookingNumber=${encodeURIComponent(session.bookingNumber)}&email=${encodeURIComponent("elena@example.com")}`,
      { method: "GET" },
    )

    expect(overviewRes.status).toBe(200)
    const overview = (await overviewRes.json()).data
    expect(overview.status).toBe("confirmed")
    expect(overview.documents).toHaveLength(1)
    expect(overview.fulfillments).toHaveLength(1)
    expect(overview.participants[0]?.firstName).toBe("Elena")
  })
})
