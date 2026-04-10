import { bookings } from "@voyantjs/bookings/schema"
import { newId } from "@voyantjs/db/lib/typeid"
import { cleanupTestDb, createTestDb } from "@voyantjs/db/test-utils"
import { optionUnits, productOptions, products } from "@voyantjs/products/schema"
import { Hono } from "hono"
import { beforeAll, beforeEach } from "vitest"

import { bookingRequirementsRoutes } from "../../src/routes.js"

export const DB_AVAILABLE = !!process.env.TEST_DATABASE_URL

const db = DB_AVAILABLE ? createTestDb() : (null as never)

export const json = (body: Record<string, unknown>) => ({
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
})

export function createBookingRequirementsTestContext() {
  let app!: Hono
  let productId!: string
  let optionId!: string
  let unitId!: string
  let bookingId!: string

  beforeAll(() => {
    productId = newId("products")
    optionId = newId("product_options")
    unitId = newId("option_units")
    bookingId = newId("bookings")

    app = new Hono()
    app.use("*", async (c, next) => {
      c.set("db" as never, db)
      c.set("userId" as never, "test-user-id")
      await next()
    })
    app.route("/", bookingRequirementsRoutes)
  })

  beforeEach(async () => {
    await cleanupTestDb(db)
    await db.insert(products).values({
      id: productId,
      name: "Test Product",
      sellCurrency: "USD",
    })
    await db.insert(productOptions).values({
      id: optionId,
      productId,
      name: "Test Option",
    })
    await db.insert(optionUnits).values({
      id: unitId,
      optionId,
      name: "Adult",
    })
    await db.insert(bookings).values({
      id: bookingId,
      bookingNumber: `BK-${Date.now()}`,
      productId,
      sellCurrency: "USD",
    })
  })

  return {
    bookingId: () => bookingId,
    optionId: () => optionId,
    productId: () => productId,
    request: (path: string, init?: RequestInit) => app.request(path, init),
    unitId: () => unitId,
  }
}
