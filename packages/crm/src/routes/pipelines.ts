import { parseJsonBody, parseQuery } from "@voyantjs/hono"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { Hono } from "hono"

import { crmService } from "../service/index.js"
import {
  insertPipelineSchema,
  insertStageSchema,
  pipelineListQuerySchema,
  stageListQuerySchema,
  updatePipelineSchema,
  updateStageSchema,
} from "../validation.js"

type Env = {
  Variables: {
    db: PostgresJsDatabase
    userId?: string
  }
}

export const pipelineRoutes = new Hono<Env>()
  .get("/pipelines", async (c) => {
    const query = await parseQuery(c, pipelineListQuerySchema)
    return c.json(await crmService.listPipelines(c.get("db"), query))
  })
  .post("/pipelines", async (c) => {
    return c.json(
      {
        data: await crmService.createPipeline(
          c.get("db"),
          await parseJsonBody(c, insertPipelineSchema),
        ),
      },
      201,
    )
  })
  .get("/pipelines/:id", async (c) => {
    const row = await crmService.getPipelineById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Pipeline not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/pipelines/:id", async (c) => {
    const row = await crmService.updatePipeline(
      c.get("db"),
      c.req.param("id"),
      await parseJsonBody(c, updatePipelineSchema),
    )
    if (!row) return c.json({ error: "Pipeline not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/pipelines/:id", async (c) => {
    const row = await crmService.deletePipeline(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Pipeline not found" }, 404)
    return c.json({ success: true })
  })
  .get("/stages", async (c) => {
    const query = await parseQuery(c, stageListQuerySchema)
    return c.json(await crmService.listStages(c.get("db"), query))
  })
  .post("/stages", async (c) => {
    return c.json(
      {
        data: await crmService.createStage(c.get("db"), await parseJsonBody(c, insertStageSchema)),
      },
      201,
    )
  })
  .get("/stages/:id", async (c) => {
    const row = await crmService.getStageById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Stage not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/stages/:id", async (c) => {
    const row = await crmService.updateStage(
      c.get("db"),
      c.req.param("id"),
      await parseJsonBody(c, updateStageSchema),
    )
    if (!row) return c.json({ error: "Stage not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/stages/:id", async (c) => {
    const row = await crmService.deleteStage(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Stage not found" }, 404)
    return c.json({ success: true })
  })
