import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { Hono } from "hono"

import { identityService } from "./service.js"
import {
  addressListQuerySchema,
  contactPointListQuerySchema,
  insertAddressForEntitySchema,
  insertAddressSchema,
  insertContactPointForEntitySchema,
  insertContactPointSchema,
  insertNamedContactForEntitySchema,
  insertNamedContactSchema,
  namedContactListQuerySchema,
  updateAddressSchema,
  updateContactPointSchema,
  updateNamedContactSchema,
} from "./validation.js"

type Env = {
  Variables: {
    db: PostgresJsDatabase
    userId?: string
  }
}

export const identityRoutes = new Hono<Env>()
  .get("/named-contacts", async (c) => {
    const query = namedContactListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await identityService.listNamedContacts(c.get("db"), query))
  })
  .post("/named-contacts", async (c) => {
    return c.json(
      {
        data: await identityService.createNamedContact(
          c.get("db"),
          insertNamedContactSchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })
  .get("/named-contacts/:id", async (c) => {
    const row = await identityService.getNamedContactById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Named contact not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/named-contacts/:id", async (c) => {
    const row = await identityService.updateNamedContact(
      c.get("db"),
      c.req.param("id"),
      updateNamedContactSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Named contact not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/named-contacts/:id", async (c) => {
    const row = await identityService.deleteNamedContact(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Named contact not found" }, 404)
    return c.json({ success: true })
  })
  .get("/contact-points", async (c) => {
    const query = contactPointListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await identityService.listContactPoints(c.get("db"), query))
  })
  .post("/contact-points", async (c) => {
    return c.json(
      {
        data: await identityService.createContactPoint(
          c.get("db"),
          insertContactPointSchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })
  .get("/contact-points/:id", async (c) => {
    const row = await identityService.getContactPointById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Contact point not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/contact-points/:id", async (c) => {
    const row = await identityService.updateContactPoint(
      c.get("db"),
      c.req.param("id"),
      updateContactPointSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Contact point not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/contact-points/:id", async (c) => {
    const row = await identityService.deleteContactPoint(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Contact point not found" }, 404)
    return c.json({ success: true })
  })
  .get("/addresses", async (c) => {
    const query = addressListQuerySchema.parse(Object.fromEntries(new URL(c.req.url).searchParams))
    return c.json(await identityService.listAddresses(c.get("db"), query))
  })
  .post("/addresses", async (c) => {
    return c.json(
      {
        data: await identityService.createAddress(
          c.get("db"),
          insertAddressSchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })
  .get("/addresses/:id", async (c) => {
    const row = await identityService.getAddressById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Address not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/addresses/:id", async (c) => {
    const row = await identityService.updateAddress(
      c.get("db"),
      c.req.param("id"),
      updateAddressSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Address not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/addresses/:id", async (c) => {
    const row = await identityService.deleteAddress(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Address not found" }, 404)
    return c.json({ success: true })
  })
  .get("/entities/:entityType/:entityId/contact-points", async (c) => {
    const params = c.req.param()
    return c.json({
      data: await identityService.listContactPointsForEntity(
        c.get("db"),
        params.entityType,
        params.entityId,
      ),
    })
  })
  .post("/entities/:entityType/:entityId/contact-points", async (c) => {
    const params = c.req.param()
    const body = insertContactPointForEntitySchema.parse(await c.req.json())
    return c.json(
      {
        data: await identityService.createContactPoint(c.get("db"), {
          ...body,
          entityType: params.entityType,
          entityId: params.entityId,
        }),
      },
      201,
    )
  })
  .get("/entities/:entityType/:entityId/addresses", async (c) => {
    const params = c.req.param()
    return c.json({
      data: await identityService.listAddressesForEntity(
        c.get("db"),
        params.entityType,
        params.entityId,
      ),
    })
  })
  .post("/entities/:entityType/:entityId/addresses", async (c) => {
    const params = c.req.param()
    const body = insertAddressForEntitySchema.parse(await c.req.json())
    return c.json(
      {
        data: await identityService.createAddress(c.get("db"), {
          ...body,
          entityType: params.entityType,
          entityId: params.entityId,
        }),
      },
      201,
    )
  })
  .get("/entities/:entityType/:entityId/named-contacts", async (c) => {
    const params = c.req.param()
    return c.json({
      data: await identityService.listNamedContactsForEntity(
        c.get("db"),
        params.entityType,
        params.entityId,
      ),
    })
  })
  .post("/entities/:entityType/:entityId/named-contacts", async (c) => {
    const params = c.req.param()
    const body = insertNamedContactForEntitySchema.parse(await c.req.json())
    return c.json(
      {
        data: await identityService.createNamedContact(c.get("db"), {
          ...body,
          entityType: params.entityType,
          entityId: params.entityId,
        }),
      },
      201,
    )
  })

export type IdentityRoutes = typeof identityRoutes
