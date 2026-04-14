import { type SQL, sql } from "drizzle-orm"
import { Hono } from "hono"
import { beforeAll, beforeEach, describe, expect, it } from "vitest"

import { productRoutes } from "../../src/routes.js"

const DB_AVAILABLE = !!process.env.TEST_DATABASE_URL

describe.skipIf(!DB_AVAILABLE)("Product routes", () => {
  let app: Hono

  async function ensureDestinationTables(db: { execute: (statement: SQL) => Promise<unknown> }) {
    const statements: SQL[] = [
      sql`CREATE TABLE IF NOT EXISTS destinations (
        id text PRIMARY KEY NOT NULL,
        parent_id text,
        slug text NOT NULL,
        code text,
        destination_type text DEFAULT 'destination' NOT NULL,
        sort_order integer DEFAULT 0 NOT NULL,
        active boolean DEFAULT true NOT NULL,
        metadata jsonb,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      )`,
      sql`CREATE UNIQUE INDEX IF NOT EXISTS uidx_destinations_slug ON destinations (slug)`,
      sql`CREATE TABLE IF NOT EXISTS destination_translations (
        id text PRIMARY KEY NOT NULL,
        destination_id text NOT NULL,
        language_tag text NOT NULL,
        name text NOT NULL,
        description text,
        seo_title text,
        seo_description text,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      )`,
      sql`CREATE UNIQUE INDEX IF NOT EXISTS uidx_destination_translations_locale
        ON destination_translations (destination_id, language_tag)`,
      sql`CREATE TABLE IF NOT EXISTS product_destinations (
        product_id text NOT NULL,
        destination_id text NOT NULL,
        sort_order integer DEFAULT 0 NOT NULL,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL,
        PRIMARY KEY (product_id, destination_id)
      )`,
    ]

    for (const statement of statements) {
      await db.execute(statement)
    }
  }

  async function createProduct() {
    const res = await app.request("/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Croatia Tour 7 Days",
        sellCurrency: "EUR",
      }),
    })

    return (await res.json()).data
  }

  beforeAll(async () => {
    const { createTestDb, cleanupTestDb } = await import("@voyantjs/db/test-utils")
    const db = createTestDb()
    await ensureDestinationTables(db)
    await cleanupTestDb(db)

    app = new Hono()
    app.use("*", async (c, next) => {
      c.set("db" as never, db)
      c.set("userId" as never, "test-user-id")
      await next()
    })
    app.route("/", productRoutes)
  })

  beforeEach(async () => {
    const { createTestDb, cleanupTestDb } = await import("@voyantjs/db/test-utils")
    const db = createTestDb()
    await ensureDestinationTables(db)
    await cleanupTestDb(db)
  })

  it("creates a product", async () => {
    const res = await app.request("/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Croatia Tour 7 Days",
        sellCurrency: "EUR",
      }),
    })

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data.name).toBe("Croatia Tour 7 Days")
  })

  it("lists products", async () => {
    const res = await app.request("/", { method: "GET" })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toBeInstanceOf(Array)
  })

  it("recalculates product cost", async () => {
    const createRes = await app.request("/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Product",
        sellCurrency: "EUR",
        sellAmountCents: 10000,
      }),
    })
    const { data: product } = await createRes.json()

    // Recalculate (no services yet, cost should be 0)
    const recalcRes = await app.request(`/${product.id}/recalculate`, {
      method: "POST",
    })

    expect(recalcRes.status).toBe(200)
    const { data } = await recalcRes.json()
    expect(data.costAmountCents).toBe(0)
    expect(data.marginPercent).toBe(100)
  })

  it("creates and lists structured product features", async () => {
    const product = await createProduct()

    const createRes = await app.request(`/${product.id}/features`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        featureType: "inclusion",
        title: "Hotel pickup",
        description: "Pickup from central hotels",
      }),
    })

    expect(createRes.status).toBe(201)
    expect((await createRes.json()).data.featureType).toBe("inclusion")

    const listRes = await app.request(`/features?productId=${product.id}`, { method: "GET" })
    expect(listRes.status).toBe(200)
    expect((await listRes.json()).data).toHaveLength(1)
  })

  it("creates and updates product FAQs", async () => {
    const product = await createProduct()

    const createRes = await app.request(`/${product.id}/faqs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: "Is lunch included?",
        answer: "No, lunch is not included.",
      }),
    })

    expect(createRes.status).toBe(201)
    const { data: faq } = await createRes.json()

    const updateRes = await app.request(`/faqs/${faq.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answer: "Yes, lunch is included on premium departures.",
      }),
    })

    expect(updateRes.status).toBe(200)
    expect((await updateRes.json()).data.answer).toContain("premium departures")
  })

  it("creates and lists structured product locations", async () => {
    const product = await createProduct()

    const createRes = await app.request(`/${product.id}/locations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        locationType: "meeting_point",
        title: "Main Square",
        city: "Split",
        countryCode: "HR",
        latitude: 43.5081,
        longitude: 16.4402,
        googlePlaceId: "test-place-id",
      }),
    })

    expect(createRes.status).toBe(201)
    expect((await createRes.json()).data.locationType).toBe("meeting_point")

    const listRes = await app.request(`/locations?productId=${product.id}`, { method: "GET" })
    expect(listRes.status).toBe(200)
    const body = await listRes.json()
    expect(body.data).toHaveLength(1)
    expect(body.data[0]?.googlePlaceId).toBe("test-place-id")
  })

  it("creates destinations, translations, and product destination links", async () => {
    const product = await createProduct()

    const createDestinationRes = await app.request("/destinations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: "romania",
        destinationType: "country",
      }),
    })

    expect(createDestinationRes.status).toBe(201)
    const { data: destination } = await createDestinationRes.json()

    const createTranslationRes = await app.request(`/destinations/${destination.id}/translations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        languageTag: "ro",
        name: "Romania",
        description: "Destinatie europeana",
      }),
    })

    expect(createTranslationRes.status).toBe(201)

    const createLinkRes = await app.request(`/${product.id}/destinations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        destinationId: destination.id,
      }),
    })

    expect(createLinkRes.status).toBe(201)

    const listDestinationsRes = await app.request("/destinations?languageTag=ro", { method: "GET" })
    expect(listDestinationsRes.status).toBe(200)
    const listDestinationsBody = await listDestinationsRes.json()
    expect(listDestinationsBody.data[0]?.translation?.name).toBe("Romania")

    const listLinksRes = await app.request(`/destination-links?productId=${product.id}`, {
      method: "GET",
    })
    expect(listLinksRes.status).toBe(200)
    const listLinksBody = await listLinksRes.json()
    expect(listLinksBody.data[0]?.destinationId).toBe(destination.id)
  })
})
