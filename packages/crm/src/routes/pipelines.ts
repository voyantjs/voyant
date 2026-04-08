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
    const query = pipelineListQuerySchema.parse(Object.fromEntries(new URL(c.req.url).searchParams))
    return c.json(await crmService.listPipelines(c.get("db"), query))
  })
  .post("/pipelines", async (c) => {
    return c.json(
      {
        data: await crmService.createPipeline(
          c.get("db"),
          insertPipelineSchema.parse(await c.req.json()),
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
      updatePipelineSchema.parse(await c.req.json()),
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
    const query = stageListQuerySchema.parse(Object.fromEntries(new URL(c.req.url).searchParams))
    return c.json(await crmService.listStages(c.get("db"), query))
  })
  .post("/stages", async (c) => {
    return c.json(
      {
        data: await crmService.createStage(
          c.get("db"),
          insertStageSchema.parse(await c.req.json()),
        ),
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
      updateStageSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Stage not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/stages/:id", async (c) => {
    const row = await crmService.deleteStage(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Stage not found" }, 404)
    return c.json({ success: true })
  })
