import { parseJsonBody, parseQuery } from "@voyantjs/hono"
import { Hono } from "hono"
import type { Env } from "./routes-shared.js"
import { notFound } from "./routes-shared.js"
import { hospitalityService } from "./service.js"
import {
  insertStayBookingItemSchema,
  insertStayCheckpointSchema,
  insertStayDailyRateSchema,
  insertStayFolioLineSchema,
  insertStayFolioSchema,
  insertStayOperationSchema,
  insertStayRuleSchema,
  insertStayServicePostSchema,
  stayBookingItemListQuerySchema,
  stayCheckpointListQuerySchema,
  stayDailyRateListQuerySchema,
  stayFolioLineListQuerySchema,
  stayFolioListQuerySchema,
  stayOperationListQuerySchema,
  stayRuleListQuerySchema,
  stayServicePostListQuerySchema,
  updateStayBookingItemSchema,
  updateStayCheckpointSchema,
  updateStayDailyRateSchema,
  updateStayFolioLineSchema,
  updateStayFolioSchema,
  updateStayOperationSchema,
  updateStayRuleSchema,
  updateStayServicePostSchema,
} from "./validation.js"

export const hospitalityStayRoutes = new Hono<Env>()
  .get("/stay-rules", async (c) => {
    const query = await parseQuery(c, stayRuleListQuerySchema)
    return c.json(await hospitalityService.listStayRules(c.get("db"), query))
  })
  .post("/stay-rules", async (c) => {
    return c.json(
      {
        data: await hospitalityService.createStayRule(
          c.get("db"),
          await parseJsonBody(c, insertStayRuleSchema),
        ),
      },
      201,
    )
  })
  .get("/stay-rules/:id", async (c) => {
    const row = await hospitalityService.getStayRuleById(c.get("db"), c.req.param("id"))
    if (!row) return c.json(notFound("Stay rule"), 404)
    return c.json({ data: row })
  })
  .patch("/stay-rules/:id", async (c) => {
    const row = await hospitalityService.updateStayRule(
      c.get("db"),
      c.req.param("id"),
      await parseJsonBody(c, updateStayRuleSchema),
    )
    if (!row) return c.json(notFound("Stay rule"), 404)
    return c.json({ data: row })
  })
  .delete("/stay-rules/:id", async (c) => {
    const row = await hospitalityService.deleteStayRule(c.get("db"), c.req.param("id"))
    if (!row) return c.json(notFound("Stay rule"), 404)
    return c.json({ success: true })
  })
  .get("/stay-booking-items", async (c) => {
    const query = await parseQuery(c, stayBookingItemListQuerySchema)
    return c.json(await hospitalityService.listStayBookingItems(c.get("db"), query))
  })
  .post("/stay-booking-items", async (c) => {
    return c.json(
      {
        data: await hospitalityService.createStayBookingItem(
          c.get("db"),
          await parseJsonBody(c, insertStayBookingItemSchema),
        ),
      },
      201,
    )
  })
  .get("/stay-booking-items/:id", async (c) => {
    const row = await hospitalityService.getStayBookingItemById(c.get("db"), c.req.param("id"))
    if (!row) return c.json(notFound("Stay booking item"), 404)
    return c.json({ data: row })
  })
  .patch("/stay-booking-items/:id", async (c) => {
    const row = await hospitalityService.updateStayBookingItem(
      c.get("db"),
      c.req.param("id"),
      await parseJsonBody(c, updateStayBookingItemSchema),
    )
    if (!row) return c.json(notFound("Stay booking item"), 404)
    return c.json({ data: row })
  })
  .delete("/stay-booking-items/:id", async (c) => {
    const row = await hospitalityService.deleteStayBookingItem(c.get("db"), c.req.param("id"))
    if (!row) return c.json(notFound("Stay booking item"), 404)
    return c.json({ success: true })
  })
  .get("/stay-daily-rates", async (c) => {
    const query = await parseQuery(c, stayDailyRateListQuerySchema)
    return c.json(await hospitalityService.listStayDailyRates(c.get("db"), query))
  })
  .post("/stay-daily-rates", async (c) => {
    return c.json(
      {
        data: await hospitalityService.createStayDailyRate(
          c.get("db"),
          await parseJsonBody(c, insertStayDailyRateSchema),
        ),
      },
      201,
    )
  })
  .get("/stay-daily-rates/:id", async (c) => {
    const row = await hospitalityService.getStayDailyRateById(c.get("db"), c.req.param("id"))
    if (!row) return c.json(notFound("Stay daily rate"), 404)
    return c.json({ data: row })
  })
  .patch("/stay-daily-rates/:id", async (c) => {
    const row = await hospitalityService.updateStayDailyRate(
      c.get("db"),
      c.req.param("id"),
      await parseJsonBody(c, updateStayDailyRateSchema),
    )
    if (!row) return c.json(notFound("Stay daily rate"), 404)
    return c.json({ data: row })
  })
  .delete("/stay-daily-rates/:id", async (c) => {
    const row = await hospitalityService.deleteStayDailyRate(c.get("db"), c.req.param("id"))
    if (!row) return c.json(notFound("Stay daily rate"), 404)
    return c.json({ success: true })
  })
  .get("/stay-operations", async (c) => {
    const query = await parseQuery(c, stayOperationListQuerySchema)
    return c.json(await hospitalityService.listStayOperations(c.get("db"), query))
  })
  .post("/stay-operations", async (c) =>
    c.json(
      {
        data: await hospitalityService.createStayOperation(
          c.get("db"),
          await parseJsonBody(c, insertStayOperationSchema),
        ),
      },
      201,
    ),
  )
  .get("/stay-operations/:id", async (c) => {
    const row = await hospitalityService.getStayOperationById(c.get("db"), c.req.param("id"))
    if (!row) return c.json(notFound("Stay operation"), 404)
    return c.json({ data: row })
  })
  .patch("/stay-operations/:id", async (c) => {
    const row = await hospitalityService.updateStayOperation(
      c.get("db"),
      c.req.param("id"),
      await parseJsonBody(c, updateStayOperationSchema),
    )
    if (!row) return c.json(notFound("Stay operation"), 404)
    return c.json({ data: row })
  })
  .delete("/stay-operations/:id", async (c) => {
    const row = await hospitalityService.deleteStayOperation(c.get("db"), c.req.param("id"))
    if (!row) return c.json(notFound("Stay operation"), 404)
    return c.json({ success: true })
  })
  .get("/stay-checkpoints", async (c) => {
    const query = await parseQuery(c, stayCheckpointListQuerySchema)
    return c.json(await hospitalityService.listStayCheckpoints(c.get("db"), query))
  })
  .post("/stay-checkpoints", async (c) =>
    c.json(
      {
        data: await hospitalityService.createStayCheckpoint(
          c.get("db"),
          await parseJsonBody(c, insertStayCheckpointSchema),
        ),
      },
      201,
    ),
  )
  .get("/stay-checkpoints/:id", async (c) => {
    const row = await hospitalityService.getStayCheckpointById(c.get("db"), c.req.param("id"))
    if (!row) return c.json(notFound("Stay checkpoint"), 404)
    return c.json({ data: row })
  })
  .patch("/stay-checkpoints/:id", async (c) => {
    const row = await hospitalityService.updateStayCheckpoint(
      c.get("db"),
      c.req.param("id"),
      await parseJsonBody(c, updateStayCheckpointSchema),
    )
    if (!row) return c.json(notFound("Stay checkpoint"), 404)
    return c.json({ data: row })
  })
  .delete("/stay-checkpoints/:id", async (c) => {
    const row = await hospitalityService.deleteStayCheckpoint(c.get("db"), c.req.param("id"))
    if (!row) return c.json(notFound("Stay checkpoint"), 404)
    return c.json({ success: true })
  })
  .get("/stay-service-posts", async (c) => {
    const query = await parseQuery(c, stayServicePostListQuerySchema)
    return c.json(await hospitalityService.listStayServicePosts(c.get("db"), query))
  })
  .post("/stay-service-posts", async (c) =>
    c.json(
      {
        data: await hospitalityService.createStayServicePost(
          c.get("db"),
          await parseJsonBody(c, insertStayServicePostSchema),
        ),
      },
      201,
    ),
  )
  .get("/stay-service-posts/:id", async (c) => {
    const row = await hospitalityService.getStayServicePostById(c.get("db"), c.req.param("id"))
    if (!row) return c.json(notFound("Stay service post"), 404)
    return c.json({ data: row })
  })
  .patch("/stay-service-posts/:id", async (c) => {
    const row = await hospitalityService.updateStayServicePost(
      c.get("db"),
      c.req.param("id"),
      await parseJsonBody(c, updateStayServicePostSchema),
    )
    if (!row) return c.json(notFound("Stay service post"), 404)
    return c.json({ data: row })
  })
  .delete("/stay-service-posts/:id", async (c) => {
    const row = await hospitalityService.deleteStayServicePost(c.get("db"), c.req.param("id"))
    if (!row) return c.json(notFound("Stay service post"), 404)
    return c.json({ success: true })
  })
  .get("/stay-folios", async (c) => {
    const query = await parseQuery(c, stayFolioListQuerySchema)
    return c.json(await hospitalityService.listStayFolios(c.get("db"), query))
  })
  .post("/stay-folios", async (c) =>
    c.json(
      {
        data: await hospitalityService.createStayFolio(
          c.get("db"),
          await parseJsonBody(c, insertStayFolioSchema),
        ),
      },
      201,
    ),
  )
  .get("/stay-folios/:id", async (c) => {
    const row = await hospitalityService.getStayFolioById(c.get("db"), c.req.param("id"))
    if (!row) return c.json(notFound("Stay folio"), 404)
    return c.json({ data: row })
  })
  .patch("/stay-folios/:id", async (c) => {
    const row = await hospitalityService.updateStayFolio(
      c.get("db"),
      c.req.param("id"),
      await parseJsonBody(c, updateStayFolioSchema),
    )
    if (!row) return c.json(notFound("Stay folio"), 404)
    return c.json({ data: row })
  })
  .delete("/stay-folios/:id", async (c) => {
    const row = await hospitalityService.deleteStayFolio(c.get("db"), c.req.param("id"))
    if (!row) return c.json(notFound("Stay folio"), 404)
    return c.json({ success: true })
  })
  .get("/stay-folio-lines", async (c) => {
    const query = await parseQuery(c, stayFolioLineListQuerySchema)
    return c.json(await hospitalityService.listStayFolioLines(c.get("db"), query))
  })
  .post("/stay-folio-lines", async (c) =>
    c.json(
      {
        data: await hospitalityService.createStayFolioLine(
          c.get("db"),
          await parseJsonBody(c, insertStayFolioLineSchema),
        ),
      },
      201,
    ),
  )
  .get("/stay-folio-lines/:id", async (c) => {
    const row = await hospitalityService.getStayFolioLineById(c.get("db"), c.req.param("id"))
    if (!row) return c.json(notFound("Stay folio line"), 404)
    return c.json({ data: row })
  })
  .patch("/stay-folio-lines/:id", async (c) => {
    const row = await hospitalityService.updateStayFolioLine(
      c.get("db"),
      c.req.param("id"),
      await parseJsonBody(c, updateStayFolioLineSchema),
    )
    if (!row) return c.json(notFound("Stay folio line"), 404)
    return c.json({ data: row })
  })
  .delete("/stay-folio-lines/:id", async (c) => {
    const row = await hospitalityService.deleteStayFolioLine(c.get("db"), c.req.param("id"))
    if (!row) return c.json(notFound("Stay folio line"), 404)
    return c.json({ success: true })
  })
