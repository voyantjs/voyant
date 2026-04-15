import { createEventBus } from "@voyantjs/core"
import { eq } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { Hono } from "hono"
import { beforeAll, beforeEach, describe, expect, it } from "vitest"

import { contractsPublicRoutes, createContractsAdminRoutes } from "../../src/contracts/routes.js"
import {
  contractAttachments,
  contracts,
  contractTemplates,
  contractTemplateVersions,
} from "../../src/contracts/schema.js"

const DB_AVAILABLE = !!process.env.TEST_DATABASE_URL

const json = (body: Record<string, unknown>) => ({
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
})

describe.skipIf(!DB_AVAILABLE)("Legal public routes", () => {
  let adminApp: Hono
  let publicApp: Hono
  let db: PostgresJsDatabase
  let generatedNames: string[]
  let documentEvents: Array<Record<string, unknown>>

  beforeAll(async () => {
    const { createTestDb, cleanupTestDb } = await import("@voyantjs/db/test-utils")
    db = createTestDb()
    await cleanupTestDb(db)

    adminApp = new Hono()
    adminApp.use("*", async (c, next) => {
      c.set("db" as never, db)
      await next()
    })
    const eventBus = createEventBus()
    documentEvents = []
    eventBus.subscribe("contract.document.generated", (event) => {
      documentEvents.push(event as Record<string, unknown>)
    })
    adminApp.route(
      "/",
      createContractsAdminRoutes({
        eventBus,
        documentGenerator: async ({ contract }) => {
          const name = `contract-${generatedNames.length + 1}.pdf`
          generatedNames.push(name)
          return {
            kind: "document",
            name,
            mimeType: "application/pdf",
            fileSize: 1024,
            storageKey: `contracts/${contract.id}/${name}`,
            metadata: {
              source: "legal-test",
              url: `https://cdn.example.com/contracts/${contract.id}/${name}`,
            },
          }
        },
      }),
    )

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
    generatedNames = []
    documentEvents = []
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

  it("generates and regenerates a canonical contract document attachment", async () => {
    const [template] = await db
      .insert(contractTemplates)
      .values({
        name: "Customer RO",
        slug: "customer-ro",
        scope: "customer",
        language: "ro",
        bodyFormat: "markdown",
        body: "Salut {{customer.firstName}}",
        active: true,
      })
      .returning()

    const [version] = await db
      .insert(contractTemplateVersions)
      .values({
        templateId: template.id,
        version: 1,
        bodyFormat: "markdown",
        body: "Salut {{customer.firstName}}",
      })
      .returning()

    await db
      .update(contractTemplates)
      .set({ currentVersionId: version.id })
      .where(eq(contractTemplates.id, template.id))

    const [contract] = await db
      .insert(contracts)
      .values({
        title: "Booking contract",
        scope: "customer",
        status: "draft",
        templateVersionId: version.id,
        variables: {
          customer: { firstName: "Ana" },
        },
      })
      .returning()

    const firstRes = await adminApp.request(`/${contract.id}/generate-document`, {
      method: "POST",
      ...json({}),
    })

    expect(firstRes.status).toBe(201)
    const firstBody = await firstRes.json()
    expect(firstBody.data.renderedBody).toBe("Salut Ana")
    expect(firstBody.data.attachment.name).toBe("contract-1.pdf")

    const [issuedContract] = await db
      .select()
      .from(contracts)
      .where(eq(contracts.id, contract.id))
      .limit(1)

    expect(issuedContract?.status).toBe("issued")
    expect(issuedContract?.renderedBody).toBe("Salut Ana")

    const secondRes = await adminApp.request(`/${contract.id}/regenerate-document`, {
      method: "POST",
      ...json({}),
    })

    expect(secondRes.status).toBe(200)
    expect((await secondRes.json()).data.attachment.name).toBe("contract-2.pdf")

    const attachments = await db
      .select()
      .from(contractAttachments)
      .where(eq(contractAttachments.contractId, contract.id))

    expect(attachments).toHaveLength(1)
    expect(attachments[0]?.name).toBe("contract-2.pdf")
    expect(attachments[0]?.storageKey).toContain("contract-2.pdf")
    expect(documentEvents).toEqual([
      expect.objectContaining({
        contractId: contract.id,
        attachmentKind: "document",
        attachmentName: "contract-1.pdf",
        regenerated: false,
      }),
      expect.objectContaining({
        contractId: contract.id,
        attachmentKind: "document",
        attachmentName: "contract-2.pdf",
        regenerated: true,
      }),
    ])
  })
})
