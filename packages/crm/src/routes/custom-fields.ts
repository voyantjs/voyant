import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { Hono } from "hono"

import { crmService } from "../service/index.js"
import {
  customFieldDefinitionListQuerySchema,
  customFieldValueListQuerySchema,
  insertCustomFieldDefinitionSchema,
  updateCustomFieldDefinitionSchema,
  upsertCustomFieldValueSchema,
} from "../validation.js"

type Env = {
  Variables: {
    db: PostgresJsDatabase
    userId?: string
  }
}

export const customFieldRoutes = new Hono<Env>()
  .get("/custom-fields", async (c) => {
    const query = customFieldDefinitionListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await crmService.listCustomFieldDefinitions(c.get("db"), query))
  })
  .post("/custom-fields", async (c) => {
    return c.json(
      {
        data: await crmService.createCustomFieldDefinition(
          c.get("db"),
          insertCustomFieldDefinitionSchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })
  .get("/custom-fields/:id", async (c) => {
    const row = await crmService.getCustomFieldDefinitionById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Custom field not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/custom-fields/:id", async (c) => {
    const row = await crmService.updateCustomFieldDefinition(
      c.get("db"),
      c.req.param("id"),
      updateCustomFieldDefinitionSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Custom field not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/custom-fields/:id", async (c) => {
    const row = await crmService.deleteCustomFieldDefinition(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Custom field not found" }, 404)
    return c.json({ success: true })
  })
  .get("/custom-field-values", async (c) => {
    const query = customFieldValueListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await crmService.listCustomFieldValues(c.get("db"), query))
  })
  .put("/custom-fields/:id/value", async (c) => {
    return c.json(
      {
        data: await crmService.upsertCustomFieldValue(
          c.get("db"),
          c.req.param("id"),
          upsertCustomFieldValueSchema.parse(await c.req.json()),
        ),
      },
      200,
    )
  })
  .delete("/custom-field-values/:id", async (c) => {
    const row = await crmService.deleteCustomFieldValue(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Custom field value not found" }, 404)
    return c.json({ success: true })
  })
