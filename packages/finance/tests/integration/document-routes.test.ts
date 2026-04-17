import { bookings } from "@voyantjs/bookings/schema"
import { createEventBus } from "@voyantjs/core"
import { eq } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { Hono } from "hono"
import { beforeAll, beforeEach, describe, expect, it } from "vitest"
import { createFinanceAdminDocumentRoutes } from "../../src/routes-documents.js"
import {
  invoiceLineItems,
  invoiceRenditions,
  invoices,
  invoiceTemplates,
} from "../../src/schema.js"

const DB_AVAILABLE = !!process.env.TEST_DATABASE_URL

const json = (body: Record<string, unknown>) => ({
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
})

describe.skipIf(!DB_AVAILABLE)("Finance document routes", () => {
  let app: Hono
  let db: PostgresJsDatabase
  let generatedKeys: string[]
  let documentEvents: Array<Record<string, unknown>>

  beforeAll(async () => {
    const { createTestDb, cleanupTestDb } = await import("@voyantjs/db/test-utils")
    db = createTestDb()
    await cleanupTestDb(db)

    app = new Hono()
    app.use("*", async (c, next) => {
      c.set("db" as never, db)
      await next()
    })
    const eventBus = createEventBus()
    documentEvents = []
    eventBus.subscribe("invoice.document.generated", (event) => {
      documentEvents.push(event as Record<string, unknown>)
    })
    app.route(
      "/",
      createFinanceAdminDocumentRoutes({
        eventBus,
        resolveDocumentDownloadUrl: (_bindings, storageKey) =>
          `https://signed.example.com/${storageKey}`,
        invoiceDocumentGenerator: async ({ invoice }) => {
          const storageKey = `invoices/${invoice.id}/rendition-${generatedKeys.length + 1}.pdf`
          generatedKeys.push(storageKey)
          return {
            format: "pdf",
            storageKey,
            fileSize: 2048,
            checksum: `sha-${generatedKeys.length}`,
            metadata: {
              source: "finance-test",
              url: `https://cdn.example.com/${storageKey}`,
            },
          }
        },
      }),
    )
  })

  beforeEach(async () => {
    const { cleanupTestDb } = await import("@voyantjs/db/test-utils")
    await cleanupTestDb(db)
    generatedKeys = []
    documentEvents = []
  })

  it("generates and then regenerates a ready invoice rendition", async () => {
    const [booking] = await db
      .insert(bookings)
      .values({
        bookingNumber: "BKG-1001",
        sellCurrency: "EUR",
        sellAmountCents: 100000,
        startDate: "2026-06-01",
      })
      .returning()

    const [template] = await db
      .insert(invoiceTemplates)
      .values({
        name: "Default invoice",
        slug: "default-invoice",
        language: "ro",
        bodyFormat: "html",
        body: "<p>Factura {{invoice.invoiceNumber}}</p>",
        isDefault: true,
        active: true,
      })
      .returning()

    const [invoice] = await db
      .insert(invoices)
      .values({
        invoiceNumber: "INV-1001",
        bookingId: booking.id,
        templateId: template.id,
        invoiceType: "invoice",
        status: "sent",
        currency: "EUR",
        issueDate: "2026-05-01",
        dueDate: "2026-05-05",
        subtotalCents: 100000,
        taxCents: 0,
        totalCents: 100000,
        paidCents: 0,
        balanceDueCents: 100000,
      })
      .returning()

    await db.insert(invoiceLineItems).values({
      invoiceId: invoice.id,
      description: "Package",
      quantity: 1,
      unitPriceCents: 100000,
      totalCents: 100000,
      sortOrder: 0,
    })

    const firstRes = await app.request(`/invoices/${invoice.id}/generate-document`, {
      method: "POST",
      ...json({}),
    })

    expect(firstRes.status).toBe(201)
    const firstBody = await firstRes.json()
    expect(firstBody.data.renderedBody).toContain("INV-1001")
    expect(firstBody.data.rendition.status).toBe("ready")
    expect(firstBody.data.rendition.storageKey).toContain("rendition-1.pdf")

    const secondRes = await app.request(`/invoices/${invoice.id}/regenerate-document`, {
      method: "POST",
      ...json({}),
    })

    expect(secondRes.status).toBe(200)
    expect((await secondRes.json()).data.rendition.storageKey).toContain("rendition-2.pdf")

    const renditions = await db
      .select()
      .from(invoiceRenditions)
      .where(eq(invoiceRenditions.invoiceId, invoice.id))

    expect(renditions).toHaveLength(2)
    expect(renditions.filter((entry) => entry.status === "ready")).toHaveLength(1)
    expect(renditions.filter((entry) => entry.status === "stale")).toHaveLength(1)
    expect(documentEvents).toEqual([
      expect.objectContaining({
        invoiceId: invoice.id,
        invoiceType: "invoice",
        format: "pdf",
        regenerated: false,
      }),
      expect.objectContaining({
        invoiceId: invoice.id,
        invoiceType: "invoice",
        format: "pdf",
        regenerated: true,
      }),
    ])

    const readyRendition = renditions.find((entry) => entry.status === "ready")
    expect(readyRendition).toBeDefined()

    const downloadRes = await app.request(`/invoice-renditions/${readyRendition?.id}/download`)
    expect(downloadRes.status).toBe(302)
    expect(downloadRes.headers.get("location")).toBe(
      `https://signed.example.com/${readyRendition?.storageKey}`,
    )
  })
})
