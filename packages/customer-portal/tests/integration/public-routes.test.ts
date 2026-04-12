import {
  bookingDocuments,
  bookingFulfillments,
  bookingItems,
  bookingParticipants,
  bookings,
} from "@voyantjs/bookings/schema"
import { crmService } from "@voyantjs/crm"
import { authUser, userProfilesTable } from "@voyantjs/db/schema/iam"
import { identityService } from "@voyantjs/identity/service"
import { Hono } from "hono"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"
import { customerPortalRoutes } from "../../src/routes.js"
import { publicCustomerPortalRoutes } from "../../src/routes-public.js"

const DB_AVAILABLE = !!process.env.TEST_DATABASE_URL

const json = (body: Record<string, unknown>) => ({
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
})

let bookingSeq = 0
function nextBookingNumber() {
  bookingSeq += 1
  return `BK-PORTAL-${String(bookingSeq).padStart(5, "0")}`
}

describe.skipIf(!DB_AVAILABLE)("Public customer portal routes", () => {
  let app: Hono
  let preflightApp: Hono
  let db: ReturnType<typeof import("@voyantjs/db/test-utils").createTestDb>

  beforeAll(async () => {
    const { createTestDb } = await import("@voyantjs/db/test-utils")

    db = createTestDb()
    app = new Hono()
      .use("*", async (c, next) => {
        c.set("db" as never, db)
        c.set("userId" as never, "user_customer_portal")
        await next()
      })
      .route("/", publicCustomerPortalRoutes)

    preflightApp = new Hono()
      .use("*", async (c, next) => {
        c.set("db" as never, db)
        await next()
      })
      .route("/", customerPortalRoutes)
  })

  beforeEach(async () => {
    const { cleanupTestDb } = await import("@voyantjs/db/test-utils")
    await cleanupTestDb(db)
    bookingSeq = 0

    await db.insert(authUser).values({
      id: "user_customer_portal",
      name: "Ana Popescu",
      email: "ana@example.com",
      emailVerified: true,
      image: null,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    })

    await db.insert(userProfilesTable).values({
      id: "user_customer_portal",
      firstName: "Ana",
      lastName: "Popescu",
      locale: "ro",
      timezone: "Europe/Bucharest",
      marketingConsent: true,
      marketingConsentAt: new Date("2026-01-02T00:00:00.000Z"),
      notificationDefaults: { email: true },
      uiPrefs: { density: "comfortable" },
    })
  })

  afterAll(async () => {
    const { closeTestDb } = await import("@voyantjs/db/test-utils")
    await closeTestDb()
  })

  async function seedLinkedCustomer() {
    const person = await crmService.createPerson(db, {
      firstName: "Ana",
      lastName: "Popescu",
      preferredLanguage: "ro",
      preferredCurrency: "EUR",
      birthday: "1990-04-15",
      relation: "client",
      status: "active",
      source: "auth.user",
      sourceRef: "user_customer_portal",
      email: "ana@example.com",
      phone: "+40123456789",
      address: "Strada Lalelelor 10",
      city: "Bucharest",
      country: "RO",
    })

    if (!person) {
      throw new Error("Expected linked customer record")
    }

    return person
  }

  it("returns the authenticated customer profile with linked CRM record", async () => {
    const person = await seedLinkedCustomer()

    const res = await app.request("/me")

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.email).toBe("ana@example.com")
    expect(body.data.locale).toBe("ro")
    expect(body.data.customerRecord).toMatchObject({
      id: person.id,
      firstName: "Ana",
      preferredCurrency: "EUR",
      phone: "+40123456789",
    })
  })

  it("reports contact existence for auth and CRM preflight checks", async () => {
    await seedLinkedCustomer()

    const res = await preflightApp.request("/contact-exists?email=ana@example.com")

    expect(res.status).toBe(200)
    expect((await res.json()).data).toEqual({
      email: "ana@example.com",
      authAccountExists: true,
      customerRecordExists: true,
      linkedCustomerRecordExists: true,
    })
  })

  it("bootstraps a new linked customer record when none exists", async () => {
    const res = await app.request("/bootstrap", {
      method: "POST",
      ...json({
        customerRecord: {
          preferredLanguage: "ro",
          preferredCurrency: "EUR",
          phone: "+40123456789",
        },
        marketingConsent: true,
      }),
    })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.status).toBe("created_customer")
    expect(body.data.profile.customerRecord).toMatchObject({
      firstName: "Ana",
      preferredCurrency: "EUR",
      phone: "+40123456789",
    })
  })

  it("returns selectable customer candidates instead of auto-linking them", async () => {
    await crmService.createPerson(db, {
      firstName: "Ana",
      lastName: "Popescu",
      relation: "client",
      status: "active",
      email: "ana@example.com",
    })

    const res = await app.request("/bootstrap", {
      method: "POST",
      ...json({}),
    })

    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.data.status).toBe("customer_selection_required")
    expect(body.data.candidates).toHaveLength(1)
    expect(body.data.candidates[0]?.linkable).toBe(true)
  })

  it("links an explicitly selected existing customer record", async () => {
    const existing = await crmService.createPerson(db, {
      firstName: "Ana",
      lastName: "Popescu",
      relation: "client",
      status: "active",
      email: "ana@example.com",
      phone: "+40101010101",
    })

    if (!existing) {
      throw new Error("Expected existing customer record")
    }

    const res = await app.request("/bootstrap", {
      method: "POST",
      ...json({
        customerRecordId: existing.id,
      }),
    })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.status).toBe("linked_existing_customer")
    expect(body.data.profile.customerRecord.id).toBe(existing.id)
  })

  it("updates profile preferences and synced customer contact details", async () => {
    const person = await seedLinkedCustomer()

    const res = await app.request("/me", {
      method: "PATCH",
      ...json({
        firstName: "Anamaria",
        timezone: "Europe/Paris",
        marketingConsent: false,
        customerRecord: {
          phone: "+40999888777",
          city: "Paris",
          country: "FR",
        },
      }),
    })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.firstName).toBe("Anamaria")
    expect(body.data.timezone).toBe("Europe/Paris")
    expect(body.data.marketingConsent).toBe(false)
    expect(body.data.customerRecord.phone).toBe("+40999888777")
    expect(body.data.customerRecord.city).toBe("Paris")

    const updatedPerson = await crmService.getPersonById(db, person.id)
    expect(updatedPerson?.firstName).toBe("Anamaria")
    expect(updatedPerson?.phone).toBe("+40999888777")
    expect(updatedPerson?.country).toBe("FR")
  })

  it("manages companions under the linked customer record", async () => {
    const person = await seedLinkedCustomer()

    const createRes = await app.request("/companions", {
      method: "POST",
      ...json({
        name: "Mihai Popescu",
        email: "mihai@example.com",
        phone: "+40111111111",
      }),
    })

    expect(createRes.status).toBe(201)
    const created = (await createRes.json()).data
    expect(created.name).toBe("Mihai Popescu")

    const listRes = await app.request("/companions")
    expect(listRes.status).toBe(200)
    expect((await listRes.json()).data).toHaveLength(1)

    const updateRes = await app.request(`/companions/${created.id}`, {
      method: "PATCH",
      ...json({
        phone: "+40222222222",
        isPrimary: true,
      }),
    })

    expect(updateRes.status).toBe(200)
    expect((await updateRes.json()).data.phone).toBe("+40222222222")

    const stored = await identityService.listNamedContactsForEntity(db, "person", person.id)
    expect(stored[0]?.metadata).toMatchObject({ kind: "companion" })

    const deleteRes = await app.request(`/companions/${created.id}`, {
      method: "DELETE",
    })

    expect(deleteRes.status).toBe(200)
    expect(
      (await app.request("/companions").then((response) => response.json())).data,
    ).toHaveLength(0)
  })

  it("lists and reads only bookings accessible to the authenticated customer", async () => {
    const person = await seedLinkedCustomer()

    const [ownedBooking] = await db
      .insert(bookings)
      .values({
        bookingNumber: nextBookingNumber(),
        personId: person.id,
        status: "confirmed",
        sellCurrency: "EUR",
        sellAmountCents: 24000,
        startDate: "2026-06-01",
        endDate: "2026-06-03",
        pax: 2,
        confirmedAt: new Date("2026-05-01T00:00:00.000Z"),
      })
      .returning()

    const [ownedParticipant] = await db
      .insert(bookingParticipants)
      .values({
        bookingId: ownedBooking.id,
        personId: person.id,
        firstName: "Ana",
        lastName: "Popescu",
        email: "ana@example.com",
        isPrimary: true,
      })
      .returning()

    const [ownedItem] = await db
      .insert(bookingItems)
      .values({
        bookingId: ownedBooking.id,
        title: "Danube package",
        sellCurrency: "EUR",
        totalSellAmountCents: 24000,
      })
      .returning()

    await db.insert(bookingDocuments).values({
      bookingId: ownedBooking.id,
      participantId: ownedParticipant.id,
      type: "other",
      fileName: "voucher.pdf",
      fileUrl: "https://example.com/voucher.pdf",
    })

    await db.insert(bookingFulfillments).values({
      bookingId: ownedBooking.id,
      bookingItemId: ownedItem.id,
      participantId: ownedParticipant.id,
      fulfillmentType: "voucher",
      deliveryChannel: "download",
      status: "issued",
      artifactUrl: "https://example.com/artifact.pdf",
    })

    const [emailBooking] = await db
      .insert(bookings)
      .values({
        bookingNumber: nextBookingNumber(),
        status: "on_hold",
        sellCurrency: "EUR",
        sellAmountCents: 12000,
      })
      .returning()

    await db.insert(bookingParticipants).values({
      bookingId: emailBooking.id,
      firstName: "Ana",
      lastName: "Popescu",
      email: "ana@example.com",
      isPrimary: true,
    })

    const [otherBooking] = await db
      .insert(bookings)
      .values({
        bookingNumber: nextBookingNumber(),
        status: "confirmed",
        sellCurrency: "EUR",
        sellAmountCents: 99999,
      })
      .returning()

    await db.insert(bookingParticipants).values({
      bookingId: otherBooking.id,
      firstName: "Other",
      lastName: "Traveler",
      email: "other@example.com",
      isPrimary: true,
    })

    const listRes = await app.request("/bookings")
    expect(listRes.status).toBe(200)
    const listBody = await listRes.json()
    expect(listBody.data).toHaveLength(2)

    const detailRes = await app.request(`/bookings/${ownedBooking.id}`)
    expect(detailRes.status).toBe(200)
    const detail = (await detailRes.json()).data
    expect(detail.documents).toHaveLength(1)
    expect(detail.fulfillments).toHaveLength(1)
    expect(detail.items[0]?.title).toBe("Danube package")

    const docsRes = await app.request(`/bookings/${ownedBooking.id}/documents`)
    expect(docsRes.status).toBe(200)
    expect((await docsRes.json()).data).toHaveLength(1)

    const forbiddenRes = await app.request(`/bookings/${otherBooking.id}`)
    expect(forbiddenRes.status).toBe(404)
  })
})
