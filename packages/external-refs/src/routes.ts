import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { Hono } from "hono"

import { externalRefsService } from "./service.js"
import {
  externalRefListQuerySchema,
  insertExternalRefForEntitySchema,
  insertExternalRefSchema,
  updateExternalRefSchema,
} from "./validation.js"

type Env = {
  Variables: {
    db: PostgresJsDatabase
    userId?: string
  }
}

export const externalRefsRoutes = new Hono<Env>()
  .get("/refs", async (c) => {
    const query = externalRefListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await externalRefsService.listExternalRefs(c.get("db"), query))
  })
  .post("/refs", async (c) => {
    return c.json(
      {
        data: await externalRefsService.createExternalRef(
          c.get("db"),
          insertExternalRefSchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })
  .get("/refs/:id", async (c) => {
    const row = await externalRefsService.getExternalRefById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "External reference not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/refs/:id", async (c) => {
    const row = await externalRefsService.updateExternalRef(
      c.get("db"),
      c.req.param("id"),
      updateExternalRefSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "External reference not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/refs/:id", async (c) => {
    const row = await externalRefsService.deleteExternalRef(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "External reference not found" }, 404)
    return c.json({ success: true })
  })
  .get("/entities/:entityType/:entityId/refs", async (c) => {
    const params = c.req.param()
    const query = externalRefListQuerySchema.parse({
      ...Object.fromEntries(new URL(c.req.url).searchParams),
      entityType: params.entityType,
      entityId: params.entityId,
    })
    return c.json(await externalRefsService.listExternalRefs(c.get("db"), query))
  })
  .post("/entities/:entityType/:entityId/refs", async (c) => {
    const params = c.req.param()
    const body = insertExternalRefForEntitySchema.parse(await c.req.json())
    return c.json(
      {
        data: await externalRefsService.createExternalRef(c.get("db"), {
          ...body,
          entityType: params.entityType,
          entityId: params.entityId,
        }),
      },
      201,
    )
  })

export type ExternalRefsRoutes = typeof externalRefsRoutes
