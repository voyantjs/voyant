import { Hono } from "hono"
import type { Env } from "./routes-shared.js"
import { notFound } from "./routes-shared.js"
import { hospitalityService } from "./service.js"
import {
  housekeepingTaskListQuerySchema,
  insertHousekeepingTaskSchema,
  insertMaintenanceBlockSchema,
  insertRatePlanInventoryOverrideSchema,
  insertRoomBlockSchema,
  insertRoomInventorySchema,
  insertRoomUnitStatusEventSchema,
  maintenanceBlockListQuerySchema,
  ratePlanInventoryOverrideListQuerySchema,
  roomBlockListQuerySchema,
  roomInventoryListQuerySchema,
  roomUnitStatusEventListQuerySchema,
  updateHousekeepingTaskSchema,
  updateMaintenanceBlockSchema,
  updateRatePlanInventoryOverrideSchema,
  updateRoomBlockSchema,
  updateRoomInventorySchema,
  updateRoomUnitStatusEventSchema,
} from "./validation.js"

export const hospitalityInventoryRoutes = new Hono<Env>()
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
    if (!row) return c.json(notFound("Room inventory"), 404)
    return c.json({ data: row })
  })
  .patch("/room-inventory/:id", async (c) => {
    const row = await hospitalityService.updateRoomInventory(
      c.get("db"),
      c.req.param("id"),
      updateRoomInventorySchema.parse(await c.req.json()),
    )
    if (!row) return c.json(notFound("Room inventory"), 404)
    return c.json({ data: row })
  })
  .delete("/room-inventory/:id", async (c) => {
    const row = await hospitalityService.deleteRoomInventory(c.get("db"), c.req.param("id"))
    if (!row) return c.json(notFound("Room inventory"), 404)
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
    if (!row) return c.json(notFound("Rate plan inventory override"), 404)
    return c.json({ data: row })
  })
  .patch("/rate-plan-inventory-overrides/:id", async (c) => {
    const row = await hospitalityService.updateRatePlanInventoryOverride(
      c.get("db"),
      c.req.param("id"),
      updateRatePlanInventoryOverrideSchema.parse(await c.req.json()),
    )
    if (!row) return c.json(notFound("Rate plan inventory override"), 404)
    return c.json({ data: row })
  })
  .delete("/rate-plan-inventory-overrides/:id", async (c) => {
    const row = await hospitalityService.deleteRatePlanInventoryOverride(
      c.get("db"),
      c.req.param("id"),
    )
    if (!row) return c.json(notFound("Rate plan inventory override"), 404)
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
    if (!row) return c.json(notFound("Room block"), 404)
    return c.json({ data: row })
  })
  .patch("/room-blocks/:id", async (c) => {
    const row = await hospitalityService.updateRoomBlock(
      c.get("db"),
      c.req.param("id"),
      updateRoomBlockSchema.parse(await c.req.json()),
    )
    if (!row) return c.json(notFound("Room block"), 404)
    return c.json({ data: row })
  })
  .delete("/room-blocks/:id", async (c) => {
    const row = await hospitalityService.deleteRoomBlock(c.get("db"), c.req.param("id"))
    if (!row) return c.json(notFound("Room block"), 404)
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
    if (!row) return c.json(notFound("Room unit status event"), 404)
    return c.json({ data: row })
  })
  .patch("/room-unit-status-events/:id", async (c) => {
    const row = await hospitalityService.updateRoomUnitStatusEvent(
      c.get("db"),
      c.req.param("id"),
      updateRoomUnitStatusEventSchema.parse(await c.req.json()),
    )
    if (!row) return c.json(notFound("Room unit status event"), 404)
    return c.json({ data: row })
  })
  .delete("/room-unit-status-events/:id", async (c) => {
    const row = await hospitalityService.deleteRoomUnitStatusEvent(c.get("db"), c.req.param("id"))
    if (!row) return c.json(notFound("Room unit status event"), 404)
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
    if (!row) return c.json(notFound("Maintenance block"), 404)
    return c.json({ data: row })
  })
  .patch("/maintenance-blocks/:id", async (c) => {
    const row = await hospitalityService.updateMaintenanceBlock(
      c.get("db"),
      c.req.param("id"),
      updateMaintenanceBlockSchema.parse(await c.req.json()),
    )
    if (!row) return c.json(notFound("Maintenance block"), 404)
    return c.json({ data: row })
  })
  .delete("/maintenance-blocks/:id", async (c) => {
    const row = await hospitalityService.deleteMaintenanceBlock(c.get("db"), c.req.param("id"))
    if (!row) return c.json(notFound("Maintenance block"), 404)
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
    if (!row) return c.json(notFound("Housekeeping task"), 404)
    return c.json({ data: row })
  })
  .patch("/housekeeping-tasks/:id", async (c) => {
    const row = await hospitalityService.updateHousekeepingTask(
      c.get("db"),
      c.req.param("id"),
      updateHousekeepingTaskSchema.parse(await c.req.json()),
    )
    if (!row) return c.json(notFound("Housekeeping task"), 404)
    return c.json({ data: row })
  })
  .delete("/housekeeping-tasks/:id", async (c) => {
    const row = await hospitalityService.deleteHousekeepingTask(c.get("db"), c.req.param("id"))
    if (!row) return c.json(notFound("Housekeeping task"), 404)
    return c.json({ success: true })
  })
