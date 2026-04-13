import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { Hono } from "hono"
import { beforeAll, beforeEach, describe, expect, it } from "vitest"

import { contractsAdminRoutes, contractsPublicRoutes } from "../../src/contracts/routes.js"
import { contractTemplates } from "../../src/contracts/schema.js"

const DB_AVAILABLE = !!process.env.TEST_DATABASE_URL

const json = (body: Record<string, unknown>) => ({
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
})

describe.skipIf(!DB_AVAILABLE)("Legal public routes", () => {
  let adminApp: Hono
  let publicApp: Hono
  let db: PostgresJsDatabase

  beforeAll(async () => {
    const { createTestDb, cleanupTestDb } = await import("@voyantjs/db/test-utils")
    db = createTestDb()
    await cleanupTestDb(db)

    adminApp = new Hono()
    adminApp.use("*", async (c, next) => {
      c.set("db" as never, db)
      await next()
    })
    adminApp.route("/", contractsAdminRoutes)

    publicApp = new Hono()
    publicApp.use("*", async (c, next) => {
      c.set("db" as never, db)
      await next()
    })
    publicApp.route("/", contractsPublicRoutes)
  })

  beforeEach(async () => {
    const { cleanupTestDb } = await import("@voyantjs/db/test-utils")
    await cleanupTestDb(db)
  })

  it("selects the default active template using language fallback order", async () => {
    await db.insert(contractTemplates).values([
      {
        name: "Customer EN",
        slug: "customer-en",
        scope: "customer",
        language: "en",
        bodyFormat: "markdown",
        body: "Hello {{customer.firstName}}",
        active: true,
      },
      {
        name: "Customer RO",
        slug: "customer-ro",
        scope: "customer",
        language: "ro",
        bodyFormat: "markdown",
        body: "Salut {{customer.firstName}}",
        active: true,
      },
    ])

    const publicRes = await publicApp.request(
      "/templates/default?scope=customer&language=de&fallbackLanguages=ro,en",
    )
    expect(publicRes.status).toBe(200)
    expect((await publicRes.json()).data.slug).toBe("customer-ro")

    const adminRes = await adminApp.request(
      "/templates/default?scope=customer&language=de&fallbackLanguages=en",
    )
    expect(adminRes.status).toBe(200)
    expect((await adminRes.json()).data.slug).toBe("customer-en")
  })

  it("renders a public preview from an active template", async () => {
    const [template] = await db
      .insert(contractTemplates)
      .values({
        name: "Customer RO",
        slug: "customer-ro",
        scope: "customer",
        language: "ro",
        bodyFormat: "markdown",
        body: "Salut {{customer.firstName}} {{customer.lastName}}",
        active: true,
      })
      .returning()

    const res = await publicApp.request(`/templates/${template.id}/preview`, {
      method: "POST",
      ...json({
        variables: {
          customer: { firstName: "Ana", lastName: "Popescu" },
        },
      }),
    })

    expect(res.status).toBe(200)
    expect((await res.json()).data).toEqual({
      rendered: "Salut Ana Popescu",
      bodyFormat: "markdown",
    })
  })
})
