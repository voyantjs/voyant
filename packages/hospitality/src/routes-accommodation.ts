import { parseJsonBody, parseQuery } from "@voyantjs/hono"
import { Hono } from "hono"
import type { Env } from "./routes-shared.js"
import { notFound } from "./routes-shared.js"
import { hospitalityService } from "./service.js"
import {
  insertMealPlanSchema,
  insertRatePlanRoomTypeSchema,
  insertRatePlanSchema,
  insertRoomTypeBedConfigSchema,
  insertRoomTypeRateSchema,
  insertRoomTypeSchema,
  insertRoomUnitSchema,
  mealPlanListQuerySchema,
  ratePlanListQuerySchema,
  ratePlanRoomTypeListQuerySchema,
  roomTypeBedConfigListQuerySchema,
  roomTypeListQuerySchema,
  roomTypeRateListQuerySchema,
  roomUnitListQuerySchema,
  updateMealPlanSchema,
  updateRatePlanRoomTypeSchema,
  updateRatePlanSchema,
  updateRoomTypeBedConfigSchema,
  updateRoomTypeRateSchema,
  updateRoomTypeSchema,
  updateRoomUnitSchema,
} from "./validation.js"

export const hospitalityAccommodationRoutes = new Hono<Env>()
  .get("/room-types", async (c) => {
    const query = await parseQuery(c, roomTypeListQuerySchema)
    return c.json(await hospitalityService.listRoomTypes(c.get("db"), query))
  })
  .post("/room-types", async (c) => {
    return c.json(
      {
        data: await hospitalityService.createRoomType(
          c.get("db"),
          await parseJsonBody(c, insertRoomTypeSchema),
        ),
      },
      201,
    )
  })
  .get("/room-types/:id", async (c) => {
    const row = await hospitalityService.getRoomTypeById(c.get("db"), c.req.param("id"))
    if (!row) return c.json(notFound("Room type"), 404)
    return c.json({ data: row })
  })
  .patch("/room-types/:id", async (c) => {
    const row = await hospitalityService.updateRoomType(
      c.get("db"),
      c.req.param("id"),
      await parseJsonBody(c, updateRoomTypeSchema),
    )
    if (!row) return c.json(notFound("Room type"), 404)
    return c.json({ data: row })
  })
  .delete("/room-types/:id", async (c) => {
    const row = await hospitalityService.deleteRoomType(c.get("db"), c.req.param("id"))
    if (!row) return c.json(notFound("Room type"), 404)
    return c.json({ success: true })
  })
  .get("/room-type-bed-configs", async (c) => {
    const query = await parseQuery(c, roomTypeBedConfigListQuerySchema)
    return c.json(await hospitalityService.listRoomTypeBedConfigs(c.get("db"), query))
  })
  .post("/room-type-bed-configs", async (c) => {
    return c.json(
      {
        data: await hospitalityService.createRoomTypeBedConfig(
          c.get("db"),
          await parseJsonBody(c, insertRoomTypeBedConfigSchema),
        ),
      },
      201,
    )
  })
  .get("/room-type-bed-configs/:id", async (c) => {
    const row = await hospitalityService.getRoomTypeBedConfigById(c.get("db"), c.req.param("id"))
    if (!row) return c.json(notFound("Room type bed config"), 404)
    return c.json({ data: row })
  })
  .patch("/room-type-bed-configs/:id", async (c) => {
    const row = await hospitalityService.updateRoomTypeBedConfig(
      c.get("db"),
      c.req.param("id"),
      await parseJsonBody(c, updateRoomTypeBedConfigSchema),
    )
    if (!row) return c.json(notFound("Room type bed config"), 404)
    return c.json({ data: row })
  })
  .delete("/room-type-bed-configs/:id", async (c) => {
    const row = await hospitalityService.deleteRoomTypeBedConfig(c.get("db"), c.req.param("id"))
    if (!row) return c.json(notFound("Room type bed config"), 404)
    return c.json({ success: true })
  })
  .get("/room-units", async (c) => {
    const query = await parseQuery(c, roomUnitListQuerySchema)
    return c.json(await hospitalityService.listRoomUnits(c.get("db"), query))
  })
  .post("/room-units", async (c) => {
    return c.json(
      {
        data: await hospitalityService.createRoomUnit(
          c.get("db"),
          await parseJsonBody(c, insertRoomUnitSchema),
        ),
      },
      201,
    )
  })
  .get("/room-units/:id", async (c) => {
    const row = await hospitalityService.getRoomUnitById(c.get("db"), c.req.param("id"))
    if (!row) return c.json(notFound("Room unit"), 404)
    return c.json({ data: row })
  })
  .patch("/room-units/:id", async (c) => {
    const row = await hospitalityService.updateRoomUnit(
      c.get("db"),
      c.req.param("id"),
      await parseJsonBody(c, updateRoomUnitSchema),
    )
    if (!row) return c.json(notFound("Room unit"), 404)
    return c.json({ data: row })
  })
  .delete("/room-units/:id", async (c) => {
    const row = await hospitalityService.deleteRoomUnit(c.get("db"), c.req.param("id"))
    if (!row) return c.json(notFound("Room unit"), 404)
    return c.json({ success: true })
  })
  .get("/meal-plans", async (c) => {
    const query = await parseQuery(c, mealPlanListQuerySchema)
    return c.json(await hospitalityService.listMealPlans(c.get("db"), query))
  })
  .post("/meal-plans", async (c) => {
    return c.json(
      {
        data: await hospitalityService.createMealPlan(
          c.get("db"),
          await parseJsonBody(c, insertMealPlanSchema),
        ),
      },
      201,
    )
  })
  .get("/meal-plans/:id", async (c) => {
    const row = await hospitalityService.getMealPlanById(c.get("db"), c.req.param("id"))
    if (!row) return c.json(notFound("Meal plan"), 404)
    return c.json({ data: row })
  })
  .patch("/meal-plans/:id", async (c) => {
    const row = await hospitalityService.updateMealPlan(
      c.get("db"),
      c.req.param("id"),
      await parseJsonBody(c, updateMealPlanSchema),
    )
    if (!row) return c.json(notFound("Meal plan"), 404)
    return c.json({ data: row })
  })
  .delete("/meal-plans/:id", async (c) => {
    const row = await hospitalityService.deleteMealPlan(c.get("db"), c.req.param("id"))
    if (!row) return c.json(notFound("Meal plan"), 404)
    return c.json({ success: true })
  })
  .get("/rate-plans", async (c) => {
    const query = await parseQuery(c, ratePlanListQuerySchema)
    return c.json(await hospitalityService.listRatePlans(c.get("db"), query))
  })
  .post("/rate-plans", async (c) => {
    return c.json(
      {
        data: await hospitalityService.createRatePlan(
          c.get("db"),
          await parseJsonBody(c, insertRatePlanSchema),
        ),
      },
      201,
    )
  })
  .get("/rate-plans/:id", async (c) => {
    const row = await hospitalityService.getRatePlanById(c.get("db"), c.req.param("id"))
    if (!row) return c.json(notFound("Rate plan"), 404)
    return c.json({ data: row })
  })
  .patch("/rate-plans/:id", async (c) => {
    const row = await hospitalityService.updateRatePlan(
      c.get("db"),
      c.req.param("id"),
      await parseJsonBody(c, updateRatePlanSchema),
    )
    if (!row) return c.json(notFound("Rate plan"), 404)
    return c.json({ data: row })
  })
  .delete("/rate-plans/:id", async (c) => {
    const row = await hospitalityService.deleteRatePlan(c.get("db"), c.req.param("id"))
    if (!row) return c.json(notFound("Rate plan"), 404)
    return c.json({ success: true })
  })
  .get("/rate-plan-room-types", async (c) => {
    const query = await parseQuery(c, ratePlanRoomTypeListQuerySchema)
    return c.json(await hospitalityService.listRatePlanRoomTypes(c.get("db"), query))
  })
  .post("/rate-plan-room-types", async (c) => {
    return c.json(
      {
        data: await hospitalityService.createRatePlanRoomType(
          c.get("db"),
          await parseJsonBody(c, insertRatePlanRoomTypeSchema),
        ),
      },
      201,
    )
  })
  .get("/rate-plan-room-types/:id", async (c) => {
    const row = await hospitalityService.getRatePlanRoomTypeById(c.get("db"), c.req.param("id"))
    if (!row) return c.json(notFound("Rate plan room type"), 404)
    return c.json({ data: row })
  })
  .patch("/rate-plan-room-types/:id", async (c) => {
    const row = await hospitalityService.updateRatePlanRoomType(
      c.get("db"),
      c.req.param("id"),
      await parseJsonBody(c, updateRatePlanRoomTypeSchema),
    )
    if (!row) return c.json(notFound("Rate plan room type"), 404)
    return c.json({ data: row })
  })
  .delete("/rate-plan-room-types/:id", async (c) => {
    const row = await hospitalityService.deleteRatePlanRoomType(c.get("db"), c.req.param("id"))
    if (!row) return c.json(notFound("Rate plan room type"), 404)
    return c.json({ success: true })
  })
  .get("/room-type-rates", async (c) => {
    const query = await parseQuery(c, roomTypeRateListQuerySchema)
    return c.json(await hospitalityService.listRoomTypeRates(c.get("db"), query))
  })
  .post("/room-type-rates", async (c) => {
    return c.json(
      {
        data: await hospitalityService.createRoomTypeRate(
          c.get("db"),
          await parseJsonBody(c, insertRoomTypeRateSchema),
        ),
      },
      201,
    )
  })
  .get("/room-type-rates/:id", async (c) => {
    const row = await hospitalityService.getRoomTypeRateById(c.get("db"), c.req.param("id"))
    if (!row) return c.json(notFound("Room type rate"), 404)
    return c.json({ data: row })
  })
  .patch("/room-type-rates/:id", async (c) => {
    const row = await hospitalityService.updateRoomTypeRate(
      c.get("db"),
      c.req.param("id"),
      await parseJsonBody(c, updateRoomTypeRateSchema),
    )
    if (!row) return c.json(notFound("Room type rate"), 404)
    return c.json({ data: row })
  })
  .delete("/room-type-rates/:id", async (c) => {
    const row = await hospitalityService.deleteRoomTypeRate(c.get("db"), c.req.param("id"))
    if (!row) return c.json(notFound("Room type rate"), 404)
    return c.json({ success: true })
  })
