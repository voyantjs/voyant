import { parseJsonBody, parseQuery } from "@voyantjs/hono"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { Hono } from "hono"

import { crmService } from "../service/index.js"
import {
  activityListQuerySchema,
  insertActivityLinkSchema,
  insertActivityParticipantSchema,
  insertActivitySchema,
  updateActivitySchema,
} from "../validation.js"

type Env = {
  Variables: {
    db: PostgresJsDatabase
    userId?: string
  }
}

export const activityRoutes = new Hono<Env>()
  .get("/activities", async (c) => {
    const query = await parseQuery(c, activityListQuerySchema)
    return c.json(await crmService.listActivities(c.get("db"), query))
  })
  .post("/activities", async (c) => {
    return c.json(
      {
        data: await crmService.createActivity(
          c.get("db"),
          await parseJsonBody(c, insertActivitySchema),
        ),
      },
      201,
    )
  })
  .get("/activities/:id", async (c) => {
    const row = await crmService.getActivityById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Activity not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/activities/:id", async (c) => {
    const row = await crmService.updateActivity(
      c.get("db"),
      c.req.param("id"),
      await parseJsonBody(c, updateActivitySchema),
    )
    if (!row) return c.json({ error: "Activity not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/activities/:id", async (c) => {
    const row = await crmService.deleteActivity(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Activity not found" }, 404)
    return c.json({ success: true })
  })
  .get("/activities/:id/links", async (c) => {
    return c.json({ data: await crmService.listActivityLinks(c.get("db"), c.req.param("id")) })
  })
  .post("/activities/:id/links", async (c) => {
    return c.json(
      {
        data: await crmService.createActivityLink(
          c.get("db"),
          c.req.param("id"),
          await parseJsonBody(c, insertActivityLinkSchema),
        ),
      },
      201,
    )
  })
  .delete("/activity-links/:id", async (c) => {
    const row = await crmService.deleteActivityLink(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Activity link not found" }, 404)
    return c.json({ success: true })
  })
  .get("/activities/:id/participants", async (c) => {
    return c.json({
      data: await crmService.listActivityParticipants(c.get("db"), c.req.param("id")),
    })
  })
  .post("/activities/:id/participants", async (c) => {
    return c.json(
      {
        data: await crmService.createActivityParticipant(
          c.get("db"),
          c.req.param("id"),
          await parseJsonBody(c, insertActivityParticipantSchema),
        ),
      },
      201,
    )
  })
  .delete("/activity-participants/:id", async (c) => {
    const row = await crmService.deleteActivityParticipant(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Activity participant not found" }, 404)
    return c.json({ success: true })
  })
