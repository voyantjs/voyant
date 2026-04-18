import { Hono } from "hono"
import { beforeAll, beforeEach, describe, expect, it } from "vitest"

import { supplierRoutes } from "../../src/routes.js"

const DB_AVAILABLE = !!process.env.TEST_DATABASE_URL

describe.skipIf(!DB_AVAILABLE)("Supplier routes", () => {
  let app: Hono

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
    app.route("/", supplierRoutes)
  })

  beforeEach(async () => {
    const { createTestDb, cleanupTestDb } = await import("@voyantjs/db/test-utils")
    await cleanupTestDb(createTestDb())
  })

  it("creates a supplier", async () => {
    const res = await app.request("/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Hotel",
        type: "hotel",
        status: "active",
      }),
    })

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data.name).toBe("Test Hotel")
  })

  it("lists suppliers", async () => {
    const res = await app.request("/", { method: "GET" })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toBeInstanceOf(Array)
  })

  it("searches suppliers through the supplier directory projection", async () => {
    const createRes = await app.request("/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Projection Tours",
        type: "experience",
        status: "active",
        email: "ops@projection.example",
        address: "Projection Street 1",
        city: "Cluj-Napoca",
        country: "RO",
        contactName: "Projection Ops",
        contactEmail: "contact@projection.example",
      }),
    })

    expect(createRes.status).toBe(201)

    const res = await app.request("/?search=projection%20ops", { method: "GET" })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveLength(1)
    expect(body.data[0]?.name).toBe("Projection Tours")
    expect(body.data[0]?.contactEmail).toBe("contact@projection.example")
  })
})
