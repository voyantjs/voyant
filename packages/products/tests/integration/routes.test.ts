import { Hono } from "hono"
import { beforeAll, beforeEach, describe, expect, it } from "vitest"

import { productRoutes } from "../../src/routes.js"

const DB_AVAILABLE = !!process.env.TEST_DATABASE_URL

describe.skipIf(!DB_AVAILABLE)("Product routes", () => {
  let app: Hono

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
    await cleanupTestDb(createTestDb())
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
})
