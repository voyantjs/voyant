import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { Hono } from "hono"

import { hospitalityService } from "./service.js"
import {
  housekeepingTaskListQuerySchema,
  insertHousekeepingTaskSchema,
  insertMaintenanceBlockSchema,
  insertMealPlanSchema,
  insertRatePlanInventoryOverrideSchema,
  insertRatePlanRoomTypeSchema,
  insertRatePlanSchema,
  insertRoomBlockSchema,
  insertRoomInventorySchema,
  insertRoomTypeBedConfigSchema,
  insertRoomTypeRateSchema,
  insertRoomTypeSchema,
  insertRoomUnitSchema,
  insertRoomUnitStatusEventSchema,
  insertStayBookingItemSchema,
  insertStayCheckpointSchema,
  insertStayDailyRateSchema,
  insertStayFolioLineSchema,
  insertStayFolioSchema,
  insertStayOperationSchema,
  insertStayRuleSchema,
  insertStayServicePostSchema,
  maintenanceBlockListQuerySchema,
  mealPlanListQuerySchema,
  ratePlanInventoryOverrideListQuerySchema,
  ratePlanListQuerySchema,
  ratePlanRoomTypeListQuerySchema,
  roomBlockListQuerySchema,
  roomInventoryListQuerySchema,
  roomTypeBedConfigListQuerySchema,
  roomTypeListQuerySchema,
  roomTypeRateListQuerySchema,
  roomUnitListQuerySchema,
  roomUnitStatusEventListQuerySchema,
  stayBookingItemListQuerySchema,
  stayCheckpointListQuerySchema,
  stayDailyRateListQuerySchema,
  stayFolioLineListQuerySchema,
  stayFolioListQuerySchema,
  stayOperationListQuerySchema,
  stayRuleListQuerySchema,
  stayServicePostListQuerySchema,
  updateHousekeepingTaskSchema,
  updateMaintenanceBlockSchema,
  updateMealPlanSchema,
  updateRatePlanInventoryOverrideSchema,
  updateRatePlanRoomTypeSchema,
  updateRatePlanSchema,
  updateRoomBlockSchema,
  updateRoomInventorySchema,
  updateRoomTypeBedConfigSchema,
  updateRoomTypeRateSchema,
  updateRoomTypeSchema,
  updateRoomUnitSchema,
  updateRoomUnitStatusEventSchema,
  updateStayBookingItemSchema,
  updateStayCheckpointSchema,
  updateStayDailyRateSchema,
  updateStayFolioLineSchema,
  updateStayFolioSchema,
  updateStayOperationSchema,
  updateStayRuleSchema,
  updateStayServicePostSchema,
} from "./validation.js"

type Env = {
  Variables: {
    db: PostgresJsDatabase
    userId?: string
  }
}

export const hospitalityRoutes = new Hono<Env>()
  .get("/room-types", async (c) => {
    const query = roomTypeListQuerySchema.parse(Object.fromEntries(new URL(c.req.url).searchParams))
    return c.json(await hospitalityService.listRoomTypes(c.get("db"), query))
  })
  .post("/room-types", async (c) => {
    return c.json(
      {
        data: await hospitalityService.createRoomType(
          c.get("db"),
          insertRoomTypeSchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })
  .get("/room-types/:id", async (c) => {
    const row = await hospitalityService.getRoomTypeById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Room type not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/room-types/:id", async (c) => {
    const row = await hospitalityService.updateRoomType(
      c.get("db"),
      c.req.param("id"),
      updateRoomTypeSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Room type not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/room-types/:id", async (c) => {
    const row = await hospitalityService.deleteRoomType(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Room type not found" }, 404)
    return c.json({ success: true })
  })
  .get("/room-type-bed-configs", async (c) => {
    const query = roomTypeBedConfigListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await hospitalityService.listRoomTypeBedConfigs(c.get("db"), query))
  })
  .post("/room-type-bed-configs", async (c) => {
    return c.json(
      {
        data: await hospitalityService.createRoomTypeBedConfig(
          c.get("db"),
          insertRoomTypeBedConfigSchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })
  .get("/room-type-bed-configs/:id", async (c) => {
    const row = await hospitalityService.getRoomTypeBedConfigById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Room type bed config not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/room-type-bed-configs/:id", async (c) => {
    const row = await hospitalityService.updateRoomTypeBedConfig(
      c.get("db"),
      c.req.param("id"),
      updateRoomTypeBedConfigSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Room type bed config not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/room-type-bed-configs/:id", async (c) => {
    const row = await hospitalityService.deleteRoomTypeBedConfig(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Room type bed config not found" }, 404)
    return c.json({ success: true })
  })
  .get("/room-units", async (c) => {
    const query = roomUnitListQuerySchema.parse(Object.fromEntries(new URL(c.req.url).searchParams))
    return c.json(await hospitalityService.listRoomUnits(c.get("db"), query))
  })
  .post("/room-units", async (c) => {
    return c.json(
      {
        data: await hospitalityService.createRoomUnit(
          c.get("db"),
          insertRoomUnitSchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })
  .get("/room-units/:id", async (c) => {
    const row = await hospitalityService.getRoomUnitById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Room unit not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/room-units/:id", async (c) => {
    const row = await hospitalityService.updateRoomUnit(
      c.get("db"),
      c.req.param("id"),
      updateRoomUnitSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Room unit not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/room-units/:id", async (c) => {
    const row = await hospitalityService.deleteRoomUnit(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Room unit not found" }, 404)
    return c.json({ success: true })
  })
  .get("/meal-plans", async (c) => {
    const query = mealPlanListQuerySchema.parse(Object.fromEntries(new URL(c.req.url).searchParams))
    return c.json(await hospitalityService.listMealPlans(c.get("db"), query))
  })
  .post("/meal-plans", async (c) => {
    return c.json(
      {
        data: await hospitalityService.createMealPlan(
          c.get("db"),
          insertMealPlanSchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })
  .get("/meal-plans/:id", async (c) => {
    const row = await hospitalityService.getMealPlanById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Meal plan not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/meal-plans/:id", async (c) => {
    const row = await hospitalityService.updateMealPlan(
      c.get("db"),
      c.req.param("id"),
      updateMealPlanSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Meal plan not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/meal-plans/:id", async (c) => {
    const row = await hospitalityService.deleteMealPlan(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Meal plan not found" }, 404)
    return c.json({ success: true })
  })
  .get("/rate-plans", async (c) => {
    const query = ratePlanListQuerySchema.parse(Object.fromEntries(new URL(c.req.url).searchParams))
    return c.json(await hospitalityService.listRatePlans(c.get("db"), query))
  })
  .post("/rate-plans", async (c) => {
    return c.json(
      {
        data: await hospitalityService.createRatePlan(
          c.get("db"),
          insertRatePlanSchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })
  .get("/rate-plans/:id", async (c) => {
    const row = await hospitalityService.getRatePlanById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Rate plan not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/rate-plans/:id", async (c) => {
    const row = await hospitalityService.updateRatePlan(
      c.get("db"),
      c.req.param("id"),
      updateRatePlanSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Rate plan not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/rate-plans/:id", async (c) => {
    const row = await hospitalityService.deleteRatePlan(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Rate plan not found" }, 404)
    return c.json({ success: true })
  })
  .get("/rate-plan-room-types", async (c) => {
    const query = ratePlanRoomTypeListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await hospitalityService.listRatePlanRoomTypes(c.get("db"), query))
  })
  .post("/rate-plan-room-types", async (c) => {
    return c.json(
      {
        data: await hospitalityService.createRatePlanRoomType(
          c.get("db"),
          insertRatePlanRoomTypeSchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })
  .get("/rate-plan-room-types/:id", async (c) => {
    const row = await hospitalityService.getRatePlanRoomTypeById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Rate plan room type not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/rate-plan-room-types/:id", async (c) => {
    const row = await hospitalityService.updateRatePlanRoomType(
      c.get("db"),
      c.req.param("id"),
      updateRatePlanRoomTypeSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Rate plan room type not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/rate-plan-room-types/:id", async (c) => {
    const row = await hospitalityService.deleteRatePlanRoomType(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Rate plan room type not found" }, 404)
    return c.json({ success: true })
  })
  .get("/room-type-rates", async (c) => {
    const query = roomTypeRateListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await hospitalityService.listRoomTypeRates(c.get("db"), query))
  })
  .post("/room-type-rates", async (c) => {
    return c.json(
      {
        data: await hospitalityService.createRoomTypeRate(
          c.get("db"),
          insertRoomTypeRateSchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })
  .get("/room-type-rates/:id", async (c) => {
    const row = await hospitalityService.getRoomTypeRateById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Room type rate not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/room-type-rates/:id", async (c) => {
    const row = await hospitalityService.updateRoomTypeRate(
      c.get("db"),
      c.req.param("id"),
      updateRoomTypeRateSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Room type rate not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/room-type-rates/:id", async (c) => {
    const row = await hospitalityService.deleteRoomTypeRate(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Room type rate not found" }, 404)
    return c.json({ success: true })
  })
  .get("/stay-rules", async (c) => {
    const query = stayRuleListQuerySchema.parse(Object.fromEntries(new URL(c.req.url).searchParams))
    return c.json(await hospitalityService.listStayRules(c.get("db"), query))
  })
  .post("/stay-rules", async (c) => {
    return c.json(
      {
        data: await hospitalityService.createStayRule(
          c.get("db"),
          insertStayRuleSchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })
  .get("/stay-rules/:id", async (c) => {
    const row = await hospitalityService.getStayRuleById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Stay rule not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/stay-rules/:id", async (c) => {
    const row = await hospitalityService.updateStayRule(
      c.get("db"),
      c.req.param("id"),
      updateStayRuleSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Stay rule not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/stay-rules/:id", async (c) => {
    const row = await hospitalityService.deleteStayRule(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Stay rule not found" }, 404)
    return c.json({ success: true })
  })
  .get("/room-inventory", async (c) => {
    const query = roomInventoryListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await hospitalityService.listRoomInventory(c.get("db"), query))
  })
  .post("/room-inventory", async (c) => {
    return c.json(
      {
        data: await hospitalityService.createRoomInventory(
          c.get("db"),
          insertRoomInventorySchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })
  .get("/room-inventory/:id", async (c) => {
    const row = await hospitalityService.getRoomInventoryById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Room inventory not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/room-inventory/:id", async (c) => {
    const row = await hospitalityService.updateRoomInventory(
      c.get("db"),
      c.req.param("id"),
      updateRoomInventorySchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Room inventory not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/room-inventory/:id", async (c) => {
    const row = await hospitalityService.deleteRoomInventory(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Room inventory not found" }, 404)
    return c.json({ success: true })
  })
  .get("/rate-plan-inventory-overrides", async (c) => {
    const query = ratePlanInventoryOverrideListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await hospitalityService.listRatePlanInventoryOverrides(c.get("db"), query))
  })
  .post("/rate-plan-inventory-overrides", async (c) => {
    return c.json(
      {
        data: await hospitalityService.createRatePlanInventoryOverride(
          c.get("db"),
          insertRatePlanInventoryOverrideSchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })
  .get("/rate-plan-inventory-overrides/:id", async (c) => {
    const row = await hospitalityService.getRatePlanInventoryOverrideById(
      c.get("db"),
      c.req.param("id"),
    )
    if (!row) return c.json({ error: "Rate plan inventory override not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/rate-plan-inventory-overrides/:id", async (c) => {
    const row = await hospitalityService.updateRatePlanInventoryOverride(
      c.get("db"),
      c.req.param("id"),
      updateRatePlanInventoryOverrideSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Rate plan inventory override not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/rate-plan-inventory-overrides/:id", async (c) => {
    const row = await hospitalityService.deleteRatePlanInventoryOverride(
      c.get("db"),
      c.req.param("id"),
    )
    if (!row) return c.json({ error: "Rate plan inventory override not found" }, 404)
    return c.json({ success: true })
  })
  .get("/stay-booking-items", async (c) => {
    const query = stayBookingItemListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await hospitalityService.listStayBookingItems(c.get("db"), query))
  })
  .post("/stay-booking-items", async (c) => {
    return c.json(
      {
        data: await hospitalityService.createStayBookingItem(
          c.get("db"),
          insertStayBookingItemSchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })
  .get("/stay-booking-items/:id", async (c) => {
    const row = await hospitalityService.getStayBookingItemById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Stay booking item not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/stay-booking-items/:id", async (c) => {
    const row = await hospitalityService.updateStayBookingItem(
      c.get("db"),
      c.req.param("id"),
      updateStayBookingItemSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Stay booking item not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/stay-booking-items/:id", async (c) => {
    const row = await hospitalityService.deleteStayBookingItem(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Stay booking item not found" }, 404)
    return c.json({ success: true })
  })
  .get("/stay-daily-rates", async (c) => {
    const query = stayDailyRateListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await hospitalityService.listStayDailyRates(c.get("db"), query))
  })
  .post("/stay-daily-rates", async (c) => {
    return c.json(
      {
        data: await hospitalityService.createStayDailyRate(
          c.get("db"),
          insertStayDailyRateSchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })
  .get("/stay-daily-rates/:id", async (c) => {
    const row = await hospitalityService.getStayDailyRateById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Stay daily rate not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/stay-daily-rates/:id", async (c) => {
    const row = await hospitalityService.updateStayDailyRate(
      c.get("db"),
      c.req.param("id"),
      updateStayDailyRateSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Stay daily rate not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/stay-daily-rates/:id", async (c) => {
    const row = await hospitalityService.deleteStayDailyRate(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Stay daily rate not found" }, 404)
    return c.json({ success: true })
  })
  .get("/room-blocks", async (c) => {
    const query = roomBlockListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await hospitalityService.listRoomBlocks(c.get("db"), query))
  })
  .post("/room-blocks", async (c) =>
    c.json(
      {
        data: await hospitalityService.createRoomBlock(
          c.get("db"),
          insertRoomBlockSchema.parse(await c.req.json()),
        ),
      },
      201,
    ),
  )
  .get("/room-blocks/:id", async (c) => {
    const row = await hospitalityService.getRoomBlockById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Room block not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/room-blocks/:id", async (c) => {
    const row = await hospitalityService.updateRoomBlock(
      c.get("db"),
      c.req.param("id"),
      updateRoomBlockSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Room block not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/room-blocks/:id", async (c) => {
    const row = await hospitalityService.deleteRoomBlock(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Room block not found" }, 404)
    return c.json({ success: true })
  })
  .get("/room-unit-status-events", async (c) => {
    const query = roomUnitStatusEventListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await hospitalityService.listRoomUnitStatusEvents(c.get("db"), query))
  })
  .post("/room-unit-status-events", async (c) =>
    c.json(
      {
        data: await hospitalityService.createRoomUnitStatusEvent(
          c.get("db"),
          insertRoomUnitStatusEventSchema.parse(await c.req.json()),
        ),
      },
      201,
    ),
  )
  .get("/room-unit-status-events/:id", async (c) => {
    const row = await hospitalityService.getRoomUnitStatusEventById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Room unit status event not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/room-unit-status-events/:id", async (c) => {
    const row = await hospitalityService.updateRoomUnitStatusEvent(
      c.get("db"),
      c.req.param("id"),
      updateRoomUnitStatusEventSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Room unit status event not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/room-unit-status-events/:id", async (c) => {
    const row = await hospitalityService.deleteRoomUnitStatusEvent(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Room unit status event not found" }, 404)
    return c.json({ success: true })
  })
  .get("/maintenance-blocks", async (c) => {
    const query = maintenanceBlockListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await hospitalityService.listMaintenanceBlocks(c.get("db"), query))
  })
  .post("/maintenance-blocks", async (c) =>
    c.json(
      {
        data: await hospitalityService.createMaintenanceBlock(
          c.get("db"),
          insertMaintenanceBlockSchema.parse(await c.req.json()),
        ),
      },
      201,
    ),
  )
  .get("/maintenance-blocks/:id", async (c) => {
    const row = await hospitalityService.getMaintenanceBlockById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Maintenance block not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/maintenance-blocks/:id", async (c) => {
    const row = await hospitalityService.updateMaintenanceBlock(
      c.get("db"),
      c.req.param("id"),
      updateMaintenanceBlockSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Maintenance block not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/maintenance-blocks/:id", async (c) => {
    const row = await hospitalityService.deleteMaintenanceBlock(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Maintenance block not found" }, 404)
    return c.json({ success: true })
  })
  .get("/housekeeping-tasks", async (c) => {
    const query = housekeepingTaskListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await hospitalityService.listHousekeepingTasks(c.get("db"), query))
  })
  .post("/housekeeping-tasks", async (c) =>
    c.json(
      {
        data: await hospitalityService.createHousekeepingTask(
          c.get("db"),
          insertHousekeepingTaskSchema.parse(await c.req.json()),
        ),
      },
      201,
    ),
  )
  .get("/housekeeping-tasks/:id", async (c) => {
    const row = await hospitalityService.getHousekeepingTaskById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Housekeeping task not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/housekeeping-tasks/:id", async (c) => {
    const row = await hospitalityService.updateHousekeepingTask(
      c.get("db"),
      c.req.param("id"),
      updateHousekeepingTaskSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Housekeeping task not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/housekeeping-tasks/:id", async (c) => {
    const row = await hospitalityService.deleteHousekeepingTask(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Housekeeping task not found" }, 404)
    return c.json({ success: true })
  })
  .get("/stay-operations", async (c) => {
    const query = stayOperationListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await hospitalityService.listStayOperations(c.get("db"), query))
  })
  .post("/stay-operations", async (c) =>
    c.json(
      {
        data: await hospitalityService.createStayOperation(
          c.get("db"),
          insertStayOperationSchema.parse(await c.req.json()),
        ),
      },
      201,
    ),
  )
  .get("/stay-operations/:id", async (c) => {
    const row = await hospitalityService.getStayOperationById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Stay operation not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/stay-operations/:id", async (c) => {
    const row = await hospitalityService.updateStayOperation(
      c.get("db"),
      c.req.param("id"),
      updateStayOperationSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Stay operation not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/stay-operations/:id", async (c) => {
    const row = await hospitalityService.deleteStayOperation(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Stay operation not found" }, 404)
    return c.json({ success: true })
  })
  .get("/stay-checkpoints", async (c) => {
    const query = stayCheckpointListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await hospitalityService.listStayCheckpoints(c.get("db"), query))
  })
  .post("/stay-checkpoints", async (c) =>
    c.json(
      {
        data: await hospitalityService.createStayCheckpoint(
          c.get("db"),
          insertStayCheckpointSchema.parse(await c.req.json()),
        ),
      },
      201,
    ),
  )
  .get("/stay-checkpoints/:id", async (c) => {
    const row = await hospitalityService.getStayCheckpointById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Stay checkpoint not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/stay-checkpoints/:id", async (c) => {
    const row = await hospitalityService.updateStayCheckpoint(
      c.get("db"),
      c.req.param("id"),
      updateStayCheckpointSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Stay checkpoint not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/stay-checkpoints/:id", async (c) => {
    const row = await hospitalityService.deleteStayCheckpoint(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Stay checkpoint not found" }, 404)
    return c.json({ success: true })
  })
  .get("/stay-service-posts", async (c) => {
    const query = stayServicePostListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await hospitalityService.listStayServicePosts(c.get("db"), query))
  })
  .post("/stay-service-posts", async (c) =>
    c.json(
      {
        data: await hospitalityService.createStayServicePost(
          c.get("db"),
          insertStayServicePostSchema.parse(await c.req.json()),
        ),
      },
      201,
    ),
  )
  .get("/stay-service-posts/:id", async (c) => {
    const row = await hospitalityService.getStayServicePostById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Stay service post not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/stay-service-posts/:id", async (c) => {
    const row = await hospitalityService.updateStayServicePost(
      c.get("db"),
      c.req.param("id"),
      updateStayServicePostSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Stay service post not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/stay-service-posts/:id", async (c) => {
    const row = await hospitalityService.deleteStayServicePost(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Stay service post not found" }, 404)
    return c.json({ success: true })
  })
  .get("/stay-folios", async (c) => {
    const query = stayFolioListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await hospitalityService.listStayFolios(c.get("db"), query))
  })
  .post("/stay-folios", async (c) =>
    c.json(
      {
        data: await hospitalityService.createStayFolio(
          c.get("db"),
          insertStayFolioSchema.parse(await c.req.json()),
        ),
      },
      201,
    ),
  )
  .get("/stay-folios/:id", async (c) => {
    const row = await hospitalityService.getStayFolioById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Stay folio not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/stay-folios/:id", async (c) => {
    const row = await hospitalityService.updateStayFolio(
      c.get("db"),
      c.req.param("id"),
      updateStayFolioSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Stay folio not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/stay-folios/:id", async (c) => {
    const row = await hospitalityService.deleteStayFolio(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Stay folio not found" }, 404)
    return c.json({ success: true })
  })
  .get("/stay-folio-lines", async (c) => {
    const query = stayFolioLineListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await hospitalityService.listStayFolioLines(c.get("db"), query))
  })
  .post("/stay-folio-lines", async (c) =>
    c.json(
      {
        data: await hospitalityService.createStayFolioLine(
          c.get("db"),
          insertStayFolioLineSchema.parse(await c.req.json()),
        ),
      },
      201,
    ),
  )
  .get("/stay-folio-lines/:id", async (c) => {
    const row = await hospitalityService.getStayFolioLineById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Stay folio line not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/stay-folio-lines/:id", async (c) => {
    const row = await hospitalityService.updateStayFolioLine(
      c.get("db"),
      c.req.param("id"),
      updateStayFolioLineSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Stay folio line not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/stay-folio-lines/:id", async (c) => {
    const row = await hospitalityService.deleteStayFolioLine(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Stay folio line not found" }, 404)
    return c.json({ success: true })
  })

export type HospitalityRoutes = typeof hospitalityRoutes
