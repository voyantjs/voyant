import {
  insertAddressSchema,
  insertContactPointSchema,
  updateAddressSchema,
  updateContactPointSchema,
} from "@voyantjs/identity/validation"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { Hono } from "hono"

import { crmService } from "../service/index.js"
import {
  communicationListQuerySchema,
  insertCommunicationLogSchema,
  insertOrganizationNoteSchema,
  insertOrganizationSchema,
  insertPersonNoteSchema,
  insertPersonSchema,
  insertSegmentSchema,
  organizationListQuerySchema,
  personListQuerySchema,
  updateOrganizationNoteSchema,
  updateOrganizationSchema,
  updatePersonNoteSchema,
  updatePersonSchema,
} from "../validation.js"

type Env = {
  Variables: {
    db: PostgresJsDatabase
    userId?: string
  }
}

const organizationEntity = "organization" as const
const personEntity = "person" as const

export const accountRoutes = new Hono<Env>()
  // Organizations
  .get("/organizations", async (c) => {
    const query = organizationListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await crmService.listOrganizations(c.get("db"), query))
  })
  .post("/organizations", async (c) => {
    return c.json(
      {
        data: await crmService.createOrganization(
          c.get("db"),
          insertOrganizationSchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })
  .get("/organizations/:id", async (c) => {
    const row = await crmService.getOrganizationById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Organization not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/organizations/:id", async (c) => {
    const row = await crmService.updateOrganization(
      c.get("db"),
      c.req.param("id"),
      updateOrganizationSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Organization not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/organizations/:id", async (c) => {
    const row = await crmService.deleteOrganization(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Organization not found" }, 404)
    return c.json({ success: true })
  })
  .get("/organizations/:id/contact-methods", async (c) => {
    return c.json({
      data: await crmService.listContactMethods(c.get("db"), organizationEntity, c.req.param("id")),
    })
  })
  .post("/organizations/:id/contact-methods", async (c) => {
    return c.json(
      {
        data: await crmService.createContactMethod(
          c.get("db"),
          organizationEntity,
          c.req.param("id"),
          insertContactPointSchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })
  .get("/organizations/:id/addresses", async (c) => {
    return c.json({
      data: await crmService.listAddresses(c.get("db"), organizationEntity, c.req.param("id")),
    })
  })
  .post("/organizations/:id/addresses", async (c) => {
    return c.json(
      {
        data: await crmService.createAddress(
          c.get("db"),
          organizationEntity,
          c.req.param("id"),
          insertAddressSchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })
  .get("/organizations/:id/notes", async (c) => {
    return c.json({
      data: await crmService.listOrganizationNotes(c.get("db"), c.req.param("id")),
    })
  })
  .post("/organizations/:id/notes", async (c) => {
    const userId = c.get("userId")
    if (!userId) return c.json({ error: "User ID required to create notes" }, 400)
    const row = await crmService.createOrganizationNote(
      c.get("db"),
      c.req.param("id"),
      userId,
      insertOrganizationNoteSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Organization not found" }, 404)
    return c.json({ data: row }, 201)
  })
  .patch("/organization-notes/:id", async (c) => {
    const body = updateOrganizationNoteSchema.parse(await c.req.json())
    const row = await crmService.updateOrganizationNote(
      c.get("db"),
      c.req.param("id"),
      body.content,
    )
    if (!row) return c.json({ error: "Note not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/organization-notes/:id", async (c) => {
    const row = await crmService.deleteOrganizationNote(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Note not found" }, 404)
    return c.json({ success: true })
  })

  // People
  .get("/people", async (c) => {
    const query = personListQuerySchema.parse(Object.fromEntries(new URL(c.req.url).searchParams))
    return c.json(await crmService.listPeople(c.get("db"), query))
  })
  .post("/people", async (c) => {
    return c.json(
      {
        data: await crmService.createPerson(
          c.get("db"),
          insertPersonSchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })
  .get("/people/:id", async (c) => {
    const row = await crmService.getPersonById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Person not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/people/:id", async (c) => {
    const row = await crmService.updatePerson(
      c.get("db"),
      c.req.param("id"),
      updatePersonSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Person not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/people/:id", async (c) => {
    const row = await crmService.deletePerson(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Person not found" }, 404)
    return c.json({ success: true })
  })
  .get("/people/:id/contact-methods", async (c) => {
    return c.json({
      data: await crmService.listContactMethods(c.get("db"), personEntity, c.req.param("id")),
    })
  })
  .post("/people/:id/contact-methods", async (c) => {
    return c.json(
      {
        data: await crmService.createContactMethod(
          c.get("db"),
          personEntity,
          c.req.param("id"),
          insertContactPointSchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })
  .get("/people/:id/addresses", async (c) => {
    return c.json({
      data: await crmService.listAddresses(c.get("db"), personEntity, c.req.param("id")),
    })
  })
  .post("/people/:id/addresses", async (c) => {
    return c.json(
      {
        data: await crmService.createAddress(
          c.get("db"),
          personEntity,
          c.req.param("id"),
          insertAddressSchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })
  .get("/people/:id/notes", async (c) => {
    return c.json({
      data: await crmService.listPersonNotes(c.get("db"), c.req.param("id")),
    })
  })
  .post("/people/:id/notes", async (c) => {
    const userId = c.get("userId")
    if (!userId) return c.json({ error: "User ID required to create notes" }, 400)
    const row = await crmService.createPersonNote(
      c.get("db"),
      c.req.param("id"),
      userId,
      insertPersonNoteSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Person not found" }, 404)
    return c.json({ data: row }, 201)
  })
  .patch("/person-notes/:id", async (c) => {
    const body = updatePersonNoteSchema.parse(await c.req.json())
    const row = await crmService.updatePersonNote(c.get("db"), c.req.param("id"), body.content)
    if (!row) return c.json({ error: "Note not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/person-notes/:id", async (c) => {
    const row = await crmService.deletePersonNote(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Note not found" }, 404)
    return c.json({ success: true })
  })
  .get("/people/:id/communications", async (c) => {
    const query = communicationListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json({
      data: await crmService.listCommunications(c.get("db"), c.req.param("id"), query),
    })
  })
  .post("/people/:id/communications", async (c) => {
    const row = await crmService.createCommunication(
      c.get("db"),
      c.req.param("id"),
      insertCommunicationLogSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Person not found" }, 404)
    return c.json({ data: row }, 201)
  })

  // Segments
  .get("/segments", async (c) => {
    return c.json({ data: await crmService.listSegments(c.get("db")) })
  })
  .post("/segments", async (c) => {
    return c.json(
      {
        data: await crmService.createSegment(
          c.get("db"),
          insertSegmentSchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })
  .delete("/segments/:segmentId", async (c) => {
    const row = await crmService.deleteSegment(c.get("db"), c.req.param("segmentId"))
    if (!row) return c.json({ error: "Segment not found" }, 404)
    return c.json({ success: true })
  })

  // CSV export/import
  .post("/people/export", async (c) => {
    const csv = await crmService.exportPeopleCsv(c.get("db"))
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="people.csv"',
      },
    })
  })
  .post("/people/import", async (c) => {
    const result = await crmService.importPeopleCsv(c.get("db"), await c.req.text())
    if ("error" in result) {
      return c.json({ error: result.error }, 400)
    }
    return c.json(result, 200)
  })

  // Shared contact method and address resources
  .patch("/contact-methods/:id", async (c) => {
    const row = await crmService.updateContactMethod(
      c.get("db"),
      c.req.param("id"),
      updateContactPointSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Contact method not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/contact-methods/:id", async (c) => {
    const row = await crmService.deleteContactMethod(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Contact method not found" }, 404)
    return c.json({ success: true })
  })
  .patch("/addresses/:id", async (c) => {
    const row = await crmService.updateAddress(
      c.get("db"),
      c.req.param("id"),
      updateAddressSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Address not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/addresses/:id", async (c) => {
    const row = await crmService.deleteAddress(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Address not found" }, 404)
    return c.json({ success: true })
  })
