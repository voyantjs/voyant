import { Hono } from "hono"
import { beforeAll, beforeEach, describe, expect, it } from "vitest"

import { extrasRoutes } from "../../src/routes.js"

const DB_AVAILABLE = !!process.env.TEST_DATABASE_URL
const json = (body: Record<string, unknown>) => ({
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
})

let seq = 0
function nextSeq() {
  seq++
  return String(seq).padStart(4, "0")
}

describe.skipIf(!DB_AVAILABLE)("Extras routes", () => {
  let app: Hono
  let db: ReturnType<typeof import("@voyantjs/db/test-utils").createTestDb>

  beforeAll(async () => {
    const { createTestDb, cleanupTestDb } = await import("@voyantjs/db/test-utils")
    db = createTestDb()
    await cleanupTestDb(db)

    app = new Hono()
    app.use("*", async (c, next) => {
      c.set("db" as never, db)
      c.set("userId" as never, "test-user-id")
      await next()
    })
    app.route("/", extrasRoutes)
  })

  beforeEach(async () => {
    const { cleanupTestDb } = await import("@voyantjs/db/test-utils")
    await cleanupTestDb(db)
  })

  // ─── Seed Helpers ─────────────────────────────────────────

  async function seedProduct() {
    const { products } = await import("@voyantjs/products/schema")
    const [row] = await (db as never as import("drizzle-orm/postgres-js").PostgresJsDatabase)
      .insert(products)
      .values({ name: `Product ${nextSeq()}`, sellCurrency: "USD" })
      .returning()
    return row!
  }

  async function seedProductOption(productId: string) {
    const { productOptions } = await import("@voyantjs/products/schema")
    const [row] = await (db as never as import("drizzle-orm/postgres-js").PostgresJsDatabase)
      .insert(productOptions)
      .values({ productId, name: `Option ${nextSeq()}` })
      .returning()
    return row!
  }

  async function seedBooking() {
    const { bookings } = await import("@voyantjs/bookings/schema")
    const [row] = await (db as never as import("drizzle-orm/postgres-js").PostgresJsDatabase)
      .insert(bookings)
      .values({ bookingNumber: `BK-${nextSeq()}`, sellCurrency: "USD" })
      .returning()
    return row!
  }

  async function seedProductExtra(overrides: Record<string, unknown> = {}) {
    let productId = overrides.productId as string | undefined
    if (!productId) {
      const product = await seedProduct()
      productId = product.id
    }
    const body = {
      productId,
      name: `Extra ${nextSeq()}`,
      ...overrides,
    }
    const res = await app.request("/product-extras", { method: "POST", ...json(body) })
    expect(res.status).toBe(201)
    const { data } = await res.json()
    return data as { id: string; productId: string; [k: string]: unknown }
  }

  async function seedOptionExtraConfig(
    optionId: string,
    productExtraId: string,
    overrides: Record<string, unknown> = {},
  ) {
    const body = { optionId, productExtraId, ...overrides }
    const res = await app.request("/option-extra-configs", { method: "POST", ...json(body) })
    expect(res.status).toBe(201)
    const { data } = await res.json()
    return data as { id: string; [k: string]: unknown }
  }

  async function seedBookingExtra(overrides: Record<string, unknown> = {}) {
    let bookingId = overrides.bookingId as string | undefined
    if (!bookingId) {
      const booking = await seedBooking()
      bookingId = booking.id
    }
    const body = {
      bookingId,
      name: `Booking Extra ${nextSeq()}`,
      sellCurrency: "USD",
      ...overrides,
    }
    const res = await app.request("/booking-extras", { method: "POST", ...json(body) })
    expect(res.status).toBe(201)
    const { data } = await res.json()
    return data as { id: string; bookingId: string; [k: string]: unknown }
  }

  // ─── Product Extras CRUD ──────────────────────────────────

  describe("Product Extras", () => {
    it("creates a product extra with defaults", async () => {
      const extra = await seedProductExtra()
      expect(extra.id).toMatch(/^pxtr_/)
      expect(extra.selectionType).toBe("optional")
      expect(extra.pricingMode).toBe("per_booking")
      expect(extra.active).toBe(true)
      expect(extra.sortOrder).toBe(0)
    })

    it("creates a product extra with all fields", async () => {
      const extra = await seedProductExtra({
        code: "LUNCH",
        description: "Packed lunch",
        selectionType: "required",
        pricingMode: "per_person",
        pricedPerPerson: true,
        minQuantity: 1,
        maxQuantity: 10,
        defaultQuantity: 2,
        sortOrder: 5,
        metadata: { category: "food" },
      })
      expect(extra.code).toBe("LUNCH")
      expect(extra.description).toBe("Packed lunch")
      expect(extra.selectionType).toBe("required")
      expect(extra.pricingMode).toBe("per_person")
      expect(extra.pricedPerPerson).toBe(true)
      expect(extra.minQuantity).toBe(1)
      expect(extra.maxQuantity).toBe(10)
      expect(extra.defaultQuantity).toBe(2)
      expect(extra.sortOrder).toBe(5)
      expect(extra.metadata).toEqual({ category: "food" })
    })

    it("gets a product extra by id", async () => {
      const extra = await seedProductExtra()
      const res = await app.request(`/product-extras/${extra.id}`, { method: "GET" })
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(data.id).toBe(extra.id)
    })

    it("returns 404 for non-existent product extra", async () => {
      const res = await app.request("/product-extras/pxtr_00000000000000000000000000", {
        method: "GET",
      })
      expect(res.status).toBe(404)
    })

    it("updates a product extra", async () => {
      const extra = await seedProductExtra()
      const res = await app.request(`/product-extras/${extra.id}`, {
        method: "PATCH",
        ...json({ name: "Updated Name", active: false }),
      })
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(data.name).toBe("Updated Name")
      expect(data.active).toBe(false)
    })

    it("returns 404 when updating non-existent product extra", async () => {
      const res = await app.request("/product-extras/pxtr_00000000000000000000000000", {
        method: "PATCH",
        ...json({ name: "x" }),
      })
      expect(res.status).toBe(404)
    })

    it("deletes a product extra", async () => {
      const extra = await seedProductExtra()
      const res = await app.request(`/product-extras/${extra.id}`, { method: "DELETE" })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)

      const check = await app.request(`/product-extras/${extra.id}`, { method: "GET" })
      expect(check.status).toBe(404)
    })

    it("returns 404 when deleting non-existent product extra", async () => {
      const res = await app.request("/product-extras/pxtr_00000000000000000000000000", {
        method: "DELETE",
      })
      expect(res.status).toBe(404)
    })
  })

  describe("Product Extras list & filters", () => {
    it("lists product extras with pagination", async () => {
      const product = await seedProduct()
      await seedProductExtra({ productId: product.id })
      await seedProductExtra({ productId: product.id })
      await seedProductExtra({ productId: product.id })

      const res = await app.request("/product-extras?limit=2&offset=0", { method: "GET" })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.length).toBe(2)
      expect(body.total).toBe(3)
    })

    it("filters by productId", async () => {
      const p1 = await seedProduct()
      const p2 = await seedProduct()
      await seedProductExtra({ productId: p1.id })
      await seedProductExtra({ productId: p2.id })

      const res = await app.request(`/product-extras?productId=${p1.id}`, { method: "GET" })
      const body = await res.json()
      expect(body.total).toBe(1)
      expect(body.data[0].productId).toBe(p1.id)
    })

    it("filters by active", async () => {
      const product = await seedProduct()
      await seedProductExtra({ productId: product.id, active: true })
      await seedProductExtra({ productId: product.id, active: false })

      const res = await app.request(`/product-extras?productId=${product.id}&active=false`, {
        method: "GET",
      })
      const body = await res.json()
      expect(body.total).toBe(1)
      expect(body.data[0].active).toBe(false)
    })

    it("searches by name", async () => {
      const product = await seedProduct()
      await seedProductExtra({ productId: product.id, name: "Airport Transfer" })
      await seedProductExtra({ productId: product.id, name: "Lunch Pack" })

      const res = await app.request("/product-extras?search=Airport", { method: "GET" })
      const body = await res.json()
      expect(body.total).toBe(1)
      expect(body.data[0].name).toBe("Airport Transfer")
    })

    it("searches by code", async () => {
      const product = await seedProduct()
      await seedProductExtra({ productId: product.id, code: "XFER" })
      await seedProductExtra({ productId: product.id, code: "MEAL" })

      const res = await app.request("/product-extras?search=XFER", { method: "GET" })
      const body = await res.json()
      expect(body.total).toBe(1)
    })
  })

  // ─── Option Extra Configs CRUD ────────────────────────────

  describe("Option Extra Configs", () => {
    it("creates an option extra config", async () => {
      const product = await seedProduct()
      const option = await seedProductOption(product.id)
      const extra = await seedProductExtra({ productId: product.id })
      const config = await seedOptionExtraConfig(option.id, extra.id)
      expect(config.id).toMatch(/^oexc_/)
      expect(config.active).toBe(true)
      expect(config.isDefault).toBe(false)
    })

    it("creates with overrides", async () => {
      const product = await seedProduct()
      const option = await seedProductOption(product.id)
      const extra = await seedProductExtra({ productId: product.id })
      const config = await seedOptionExtraConfig(option.id, extra.id, {
        selectionType: "required",
        pricingMode: "per_person",
        isDefault: true,
        notes: "Always include",
      })
      expect(config.selectionType).toBe("required")
      expect(config.pricingMode).toBe("per_person")
      expect(config.isDefault).toBe(true)
      expect(config.notes).toBe("Always include")
    })

    it("gets an option extra config by id", async () => {
      const product = await seedProduct()
      const option = await seedProductOption(product.id)
      const extra = await seedProductExtra({ productId: product.id })
      const config = await seedOptionExtraConfig(option.id, extra.id)

      const res = await app.request(`/option-extra-configs/${config.id}`, { method: "GET" })
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(data.id).toBe(config.id)
    })

    it("returns 404 for non-existent option extra config", async () => {
      const res = await app.request("/option-extra-configs/oexc_00000000000000000000000000", {
        method: "GET",
      })
      expect(res.status).toBe(404)
    })

    it("updates an option extra config", async () => {
      const product = await seedProduct()
      const option = await seedProductOption(product.id)
      const extra = await seedProductExtra({ productId: product.id })
      const config = await seedOptionExtraConfig(option.id, extra.id)

      const res = await app.request(`/option-extra-configs/${config.id}`, {
        method: "PATCH",
        ...json({ active: false, isDefault: true }),
      })
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(data.active).toBe(false)
      expect(data.isDefault).toBe(true)
    })

    it("deletes an option extra config", async () => {
      const product = await seedProduct()
      const option = await seedProductOption(product.id)
      const extra = await seedProductExtra({ productId: product.id })
      const config = await seedOptionExtraConfig(option.id, extra.id)

      const res = await app.request(`/option-extra-configs/${config.id}`, { method: "DELETE" })
      expect(res.status).toBe(200)

      const check = await app.request(`/option-extra-configs/${config.id}`, { method: "GET" })
      expect(check.status).toBe(404)
    })
  })

  describe("Option Extra Configs list & filters", () => {
    it("lists with pagination", async () => {
      const product = await seedProduct()
      const option = await seedProductOption(product.id)
      const e1 = await seedProductExtra({ productId: product.id, code: "A" })
      const e2 = await seedProductExtra({ productId: product.id, code: "B" })
      const e3 = await seedProductExtra({ productId: product.id, code: "C" })
      await seedOptionExtraConfig(option.id, e1.id)
      await seedOptionExtraConfig(option.id, e2.id)
      await seedOptionExtraConfig(option.id, e3.id)

      const res = await app.request("/option-extra-configs?limit=2", { method: "GET" })
      const body = await res.json()
      expect(body.data.length).toBe(2)
      expect(body.total).toBe(3)
    })

    it("filters by optionId", async () => {
      const product = await seedProduct()
      const o1 = await seedProductOption(product.id)
      const o2 = await seedProductOption(product.id)
      const extra = await seedProductExtra({ productId: product.id })
      await seedOptionExtraConfig(o1.id, extra.id)
      await seedOptionExtraConfig(o2.id, extra.id)

      const res = await app.request(`/option-extra-configs?optionId=${o1.id}`, { method: "GET" })
      const body = await res.json()
      expect(body.total).toBe(1)
    })

    it("filters by productExtraId", async () => {
      const product = await seedProduct()
      const option = await seedProductOption(product.id)
      const e1 = await seedProductExtra({ productId: product.id, code: "X" })
      const e2 = await seedProductExtra({ productId: product.id, code: "Y" })
      await seedOptionExtraConfig(option.id, e1.id)
      await seedOptionExtraConfig(option.id, e2.id)

      const res = await app.request(`/option-extra-configs?productExtraId=${e1.id}`, {
        method: "GET",
      })
      const body = await res.json()
      expect(body.total).toBe(1)
    })
  })

  // ─── Booking Extras CRUD ──────────────────────────────────

  describe("Booking Extras", () => {
    it("creates a booking extra with defaults", async () => {
      const extra = await seedBookingExtra()
      expect(extra.id).toMatch(/^bkex_/)
      expect(extra.status).toBe("draft")
      expect(extra.pricingMode).toBe("per_booking")
      expect(extra.quantity).toBe(1)
    })

    it("creates a booking extra with all fields", async () => {
      const product = await seedProduct()
      const pExtra = await seedProductExtra({ productId: product.id })
      const booking = await seedBooking()

      const extra = await seedBookingExtra({
        bookingId: booking.id,
        productExtraId: pExtra.id,
        name: "Lunch",
        description: "Packed lunch for each person",
        status: "selected",
        pricingMode: "per_person",
        pricedPerPerson: true,
        quantity: 4,
        sellCurrency: "EUR",
        unitSellAmountCents: 1500,
        totalSellAmountCents: 6000,
        costCurrency: "EUR",
        unitCostAmountCents: 800,
        totalCostAmountCents: 3200,
        notes: "Vegetarian option",
        metadata: { dietary: "vegetarian" },
      })
      expect(extra.name).toBe("Lunch")
      expect(extra.status).toBe("selected")
      expect(extra.pricingMode).toBe("per_person")
      expect(extra.quantity).toBe(4)
      expect(extra.unitSellAmountCents).toBe(1500)
      expect(extra.totalSellAmountCents).toBe(6000)
      expect(extra.costCurrency).toBe("EUR")
      expect(extra.notes).toBe("Vegetarian option")
      expect(extra.metadata).toEqual({ dietary: "vegetarian" })
    })

    it("gets a booking extra by id", async () => {
      const extra = await seedBookingExtra()
      const res = await app.request(`/booking-extras/${extra.id}`, { method: "GET" })
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(data.id).toBe(extra.id)
    })

    it("returns 404 for non-existent booking extra", async () => {
      const res = await app.request("/booking-extras/bkex_00000000000000000000000000", {
        method: "GET",
      })
      expect(res.status).toBe(404)
    })

    it("updates a booking extra", async () => {
      const extra = await seedBookingExtra()
      const res = await app.request(`/booking-extras/${extra.id}`, {
        method: "PATCH",
        ...json({ status: "confirmed", quantity: 3 }),
      })
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(data.status).toBe("confirmed")
      expect(data.quantity).toBe(3)
    })

    it("returns 404 when updating non-existent booking extra", async () => {
      const res = await app.request("/booking-extras/bkex_00000000000000000000000000", {
        method: "PATCH",
        ...json({ status: "confirmed" }),
      })
      expect(res.status).toBe(404)
    })

    it("deletes a booking extra", async () => {
      const extra = await seedBookingExtra()
      const res = await app.request(`/booking-extras/${extra.id}`, { method: "DELETE" })
      expect(res.status).toBe(200)

      const check = await app.request(`/booking-extras/${extra.id}`, { method: "GET" })
      expect(check.status).toBe(404)
    })

    it("returns 404 when deleting non-existent booking extra", async () => {
      const res = await app.request("/booking-extras/bkex_00000000000000000000000000", {
        method: "DELETE",
      })
      expect(res.status).toBe(404)
    })
  })

  describe("Booking Extras list & filters", () => {
    it("lists with pagination", async () => {
      const booking = await seedBooking()
      await seedBookingExtra({ bookingId: booking.id })
      await seedBookingExtra({ bookingId: booking.id })
      await seedBookingExtra({ bookingId: booking.id })

      const res = await app.request("/booking-extras?limit=2", { method: "GET" })
      const body = await res.json()
      expect(body.data.length).toBe(2)
      expect(body.total).toBe(3)
    })

    it("filters by bookingId", async () => {
      const b1 = await seedBooking()
      const b2 = await seedBooking()
      await seedBookingExtra({ bookingId: b1.id })
      await seedBookingExtra({ bookingId: b2.id })

      const res = await app.request(`/booking-extras?bookingId=${b1.id}`, { method: "GET" })
      const body = await res.json()
      expect(body.total).toBe(1)
    })

    it("filters by status", async () => {
      const booking = await seedBooking()
      await seedBookingExtra({ bookingId: booking.id, status: "draft" })
      await seedBookingExtra({ bookingId: booking.id, status: "confirmed" })

      const res = await app.request("/booking-extras?status=confirmed", { method: "GET" })
      const body = await res.json()
      expect(body.total).toBe(1)
      expect(body.data[0].status).toBe("confirmed")
    })

    it("filters by productExtraId", async () => {
      const product = await seedProduct()
      const pExtra = await seedProductExtra({ productId: product.id })
      const booking = await seedBooking()
      await seedBookingExtra({ bookingId: booking.id, productExtraId: pExtra.id })
      await seedBookingExtra({ bookingId: booking.id })

      const res = await app.request(`/booking-extras?productExtraId=${pExtra.id}`, {
        method: "GET",
      })
      const body = await res.json()
      expect(body.total).toBe(1)
    })
  })
})
