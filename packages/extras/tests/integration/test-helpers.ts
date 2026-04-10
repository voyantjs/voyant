import { Hono } from "hono"
import { beforeAll, beforeEach, expect } from "vitest"

import { extrasRoutes } from "../../src/routes.js"

export const DB_AVAILABLE = !!process.env.TEST_DATABASE_URL

export const json = (body: Record<string, unknown>) => ({
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
})

let seq = 0

function nextSeq() {
  seq++
  return String(seq).padStart(4, "0")
}

export function createExtrasTestContext() {
  let app!: Hono
  let db!: ReturnType<typeof import("@voyantjs/db/test-utils").createTestDb>

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

    const res = await app.request("/product-extras", {
      method: "POST",
      ...json({
        productId,
        name: `Extra ${nextSeq()}`,
        ...overrides,
      }),
    })
    expect(res.status).toBe(201)
    const { data } = await res.json()
    return data as { id: string; productId: string; [key: string]: unknown }
  }

  async function seedOptionExtraConfig(
    optionId: string,
    productExtraId: string,
    overrides: Record<string, unknown> = {},
  ) {
    const res = await app.request("/option-extra-configs", {
      method: "POST",
      ...json({ optionId, productExtraId, ...overrides }),
    })
    expect(res.status).toBe(201)
    const { data } = await res.json()
    return data as { id: string; [key: string]: unknown }
  }

  async function seedBookingExtra(overrides: Record<string, unknown> = {}) {
    let bookingId = overrides.bookingId as string | undefined
    if (!bookingId) {
      const booking = await seedBooking()
      bookingId = booking.id
    }

    const res = await app.request("/booking-extras", {
      method: "POST",
      ...json({
        bookingId,
        name: `Booking Extra ${nextSeq()}`,
        sellCurrency: "USD",
        ...overrides,
      }),
    })
    expect(res.status).toBe(201)
    const { data } = await res.json()
    return data as { id: string; bookingId: string; [key: string]: unknown }
  }

  return {
    request: (path: string, init?: RequestInit) => app.request(path, init),
    seedBooking,
    seedBookingExtra,
    seedOptionExtraConfig,
    seedProduct,
    seedProductExtra,
    seedProductOption,
  }
}
