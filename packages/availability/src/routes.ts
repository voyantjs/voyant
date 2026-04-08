import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { Hono } from "hono"
import { z } from "zod"

import { availabilityService } from "./service.js"
import {
  availabilityCloseoutListQuerySchema,
  availabilityPickupPointListQuerySchema,
  availabilityRuleListQuerySchema,
  availabilitySlotListQuerySchema,
  availabilitySlotPickupListQuerySchema,
  availabilityStartTimeListQuerySchema,
  customPickupAreaListQuerySchema,
  insertAvailabilityCloseoutSchema,
  insertAvailabilityPickupPointSchema,
  insertAvailabilityRuleSchema,
  insertAvailabilitySlotPickupSchema,
  insertAvailabilitySlotSchema,
  insertAvailabilityStartTimeSchema,
  insertCustomPickupAreaSchema,
  insertLocationPickupTimeSchema,
  insertPickupGroupSchema,
  insertPickupLocationSchema,
  insertProductMeetingConfigSchema,
  locationPickupTimeListQuerySchema,
  pickupGroupListQuerySchema,
  pickupLocationListQuerySchema,
  productMeetingConfigListQuerySchema,
  updateAvailabilityCloseoutSchema,
  updateAvailabilityPickupPointSchema,
  updateAvailabilityRuleSchema,
  updateAvailabilitySlotPickupSchema,
  updateAvailabilitySlotSchema,
  updateAvailabilityStartTimeSchema,
  updateCustomPickupAreaSchema,
  updateLocationPickupTimeSchema,
  updatePickupGroupSchema,
  updatePickupLocationSchema,
  updateProductMeetingConfigSchema,
} from "./validation.js"

type Env = {
  Variables: {
    db: PostgresJsDatabase
    userId?: string
  }
}

const batchIdsSchema = z.object({
  ids: z.array(z.string()).min(1).max(200),
})

const createBatchUpdateSchema = <TPatch extends z.ZodTypeAny>(patchSchema: TPatch) =>
  z.object({
    ids: batchIdsSchema.shape.ids,
    patch: patchSchema.refine((value) => Object.keys(value as Record<string, unknown>).length > 0, {
      message: "Patch payload is required",
    }),
  })

const batchUpdateAvailabilityRuleSchema = createBatchUpdateSchema(updateAvailabilityRuleSchema)
const batchUpdateAvailabilityStartTimeSchema = createBatchUpdateSchema(
  updateAvailabilityStartTimeSchema,
)
const batchUpdateAvailabilitySlotSchema = createBatchUpdateSchema(updateAvailabilitySlotSchema)
const batchUpdateAvailabilityCloseoutSchema = createBatchUpdateSchema(
  updateAvailabilityCloseoutSchema,
)
const batchUpdateAvailabilityPickupPointSchema = createBatchUpdateSchema(
  updateAvailabilityPickupPointSchema,
)
const batchUpdateAvailabilitySlotPickupSchema = createBatchUpdateSchema(
  updateAvailabilitySlotPickupSchema,
)
const batchUpdateProductMeetingConfigSchema = createBatchUpdateSchema(
  updateProductMeetingConfigSchema,
)
const batchUpdatePickupGroupSchema = createBatchUpdateSchema(updatePickupGroupSchema)
const batchUpdatePickupLocationSchema = createBatchUpdateSchema(updatePickupLocationSchema)
const batchUpdateLocationPickupTimeSchema = createBatchUpdateSchema(updateLocationPickupTimeSchema)
const batchUpdateCustomPickupAreaSchema = createBatchUpdateSchema(updateCustomPickupAreaSchema)

async function handleBatchUpdate<TPatch, TRow>({
  db,
  ids,
  patch,
  update,
}: {
  db: PostgresJsDatabase
  ids: string[]
  patch: TPatch
  update: (db: PostgresJsDatabase, id: string, patch: TPatch) => Promise<TRow | null>
}) {
  const results = await Promise.all(
    ids.map(async (id) => {
      const row = await update(db, id, patch)
      return row ? { id, row } : { id, row: null }
    }),
  )

  const data = results.flatMap((result) => (result.row ? [result.row] : []))
  const failed = results
    .filter((result) => result.row === null)
    .map((result) => ({ id: result.id, error: "Not found" }))

  return {
    data,
    total: ids.length,
    succeeded: data.length,
    failed,
  }
}

async function handleBatchDelete({
  db,
  ids,
  remove,
}: {
  db: PostgresJsDatabase
  ids: string[]
  remove: (db: PostgresJsDatabase, id: string) => Promise<{ id: string } | null>
}) {
  const results = await Promise.all(
    ids.map(async (id) => {
      const row = await remove(db, id)
      return row ? { id } : { id, error: "Not found" }
    }),
  )

  const deletedIds = results.flatMap((result) => ("error" in result ? [] : [result.id]))
  const failed = results
    .filter((result): result is { id: string; error: string } => "error" in result)
    .map((result) => ({ id: result.id, error: result.error }))

  return {
    deletedIds,
    total: ids.length,
    succeeded: deletedIds.length,
    failed,
  }
}

export const availabilityRoutes = new Hono<Env>()
  .get("/rules", async (c) => {
    const query = availabilityRuleListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await availabilityService.listRules(c.get("db"), query))
  })
  .post("/rules", async (c) => {
    return c.json(
      {
        data: await availabilityService.createRule(
          c.get("db"),
          insertAvailabilityRuleSchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })
  .post("/rules/batch-update", async (c) => {
    const body = batchUpdateAvailabilityRuleSchema.parse(await c.req.json())
    return c.json(
      await handleBatchUpdate({
        db: c.get("db"),
        ids: body.ids,
        patch: body.patch,
        update: availabilityService.updateRule,
      }),
    )
  })
  .post("/rules/batch-delete", async (c) => {
    const body = batchIdsSchema.parse(await c.req.json())
    return c.json(
      await handleBatchDelete({
        db: c.get("db"),
        ids: body.ids,
        remove: availabilityService.deleteRule,
      }),
    )
  })
  .get("/rules/:id", async (c) => {
    const row = await availabilityService.getRuleById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Availability rule not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/rules/:id", async (c) => {
    const row = await availabilityService.updateRule(
      c.get("db"),
      c.req.param("id"),
      updateAvailabilityRuleSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Availability rule not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/rules/:id", async (c) => {
    const row = await availabilityService.deleteRule(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Availability rule not found" }, 404)
    return c.json({ success: true })
  })
  .get("/start-times", async (c) => {
    const query = availabilityStartTimeListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await availabilityService.listStartTimes(c.get("db"), query))
  })
  .post("/start-times", async (c) => {
    return c.json(
      {
        data: await availabilityService.createStartTime(
          c.get("db"),
          insertAvailabilityStartTimeSchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })
  .post("/start-times/batch-update", async (c) => {
    const body = batchUpdateAvailabilityStartTimeSchema.parse(await c.req.json())
    return c.json(
      await handleBatchUpdate({
        db: c.get("db"),
        ids: body.ids,
        patch: body.patch,
        update: availabilityService.updateStartTime,
      }),
    )
  })
  .post("/start-times/batch-delete", async (c) => {
    const body = batchIdsSchema.parse(await c.req.json())
    return c.json(
      await handleBatchDelete({
        db: c.get("db"),
        ids: body.ids,
        remove: availabilityService.deleteStartTime,
      }),
    )
  })
  .get("/start-times/:id", async (c) => {
    const row = await availabilityService.getStartTimeById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Availability start time not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/start-times/:id", async (c) => {
    const row = await availabilityService.updateStartTime(
      c.get("db"),
      c.req.param("id"),
      updateAvailabilityStartTimeSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Availability start time not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/start-times/:id", async (c) => {
    const row = await availabilityService.deleteStartTime(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Availability start time not found" }, 404)
    return c.json({ success: true })
  })
  .get("/slots", async (c) => {
    const query = availabilitySlotListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await availabilityService.listSlots(c.get("db"), query))
  })
  .post("/slots", async (c) => {
    return c.json(
      {
        data: await availabilityService.createSlot(
          c.get("db"),
          insertAvailabilitySlotSchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })
  .post("/slots/batch-update", async (c) => {
    const body = batchUpdateAvailabilitySlotSchema.parse(await c.req.json())
    return c.json(
      await handleBatchUpdate({
        db: c.get("db"),
        ids: body.ids,
        patch: body.patch,
        update: availabilityService.updateSlot,
      }),
    )
  })
  .post("/slots/batch-delete", async (c) => {
    const body = batchIdsSchema.parse(await c.req.json())
    return c.json(
      await handleBatchDelete({
        db: c.get("db"),
        ids: body.ids,
        remove: availabilityService.deleteSlot,
      }),
    )
  })
  .get("/slots/:id", async (c) => {
    const row = await availabilityService.getSlotById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Availability slot not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/slots/:id", async (c) => {
    const row = await availabilityService.updateSlot(
      c.get("db"),
      c.req.param("id"),
      updateAvailabilitySlotSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Availability slot not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/slots/:id", async (c) => {
    const row = await availabilityService.deleteSlot(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Availability slot not found" }, 404)
    return c.json({ success: true })
  })
  .get("/closeouts", async (c) => {
    const query = availabilityCloseoutListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await availabilityService.listCloseouts(c.get("db"), query))
  })
  .post("/closeouts", async (c) => {
    return c.json(
      {
        data: await availabilityService.createCloseout(
          c.get("db"),
          insertAvailabilityCloseoutSchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })
  .post("/closeouts/batch-update", async (c) => {
    const body = batchUpdateAvailabilityCloseoutSchema.parse(await c.req.json())
    return c.json(
      await handleBatchUpdate({
        db: c.get("db"),
        ids: body.ids,
        patch: body.patch,
        update: availabilityService.updateCloseout,
      }),
    )
  })
  .post("/closeouts/batch-delete", async (c) => {
    const body = batchIdsSchema.parse(await c.req.json())
    return c.json(
      await handleBatchDelete({
        db: c.get("db"),
        ids: body.ids,
        remove: availabilityService.deleteCloseout,
      }),
    )
  })
  .get("/closeouts/:id", async (c) => {
    const row = await availabilityService.getCloseoutById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Availability closeout not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/closeouts/:id", async (c) => {
    const row = await availabilityService.updateCloseout(
      c.get("db"),
      c.req.param("id"),
      updateAvailabilityCloseoutSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Availability closeout not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/closeouts/:id", async (c) => {
    const row = await availabilityService.deleteCloseout(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Availability closeout not found" }, 404)
    return c.json({ success: true })
  })
  .get("/pickup-points", async (c) => {
    const query = availabilityPickupPointListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await availabilityService.listPickupPoints(c.get("db"), query))
  })
  .post("/pickup-points", async (c) => {
    return c.json(
      {
        data: await availabilityService.createPickupPoint(
          c.get("db"),
          insertAvailabilityPickupPointSchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })
  .post("/pickup-points/batch-update", async (c) => {
    const body = batchUpdateAvailabilityPickupPointSchema.parse(await c.req.json())
    return c.json(
      await handleBatchUpdate({
        db: c.get("db"),
        ids: body.ids,
        patch: body.patch,
        update: availabilityService.updatePickupPoint,
      }),
    )
  })
  .post("/pickup-points/batch-delete", async (c) => {
    const body = batchIdsSchema.parse(await c.req.json())
    return c.json(
      await handleBatchDelete({
        db: c.get("db"),
        ids: body.ids,
        remove: availabilityService.deletePickupPoint,
      }),
    )
  })
  .get("/pickup-points/:id", async (c) => {
    const row = await availabilityService.getPickupPointById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Availability pickup point not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/pickup-points/:id", async (c) => {
    const row = await availabilityService.updatePickupPoint(
      c.get("db"),
      c.req.param("id"),
      updateAvailabilityPickupPointSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Availability pickup point not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/pickup-points/:id", async (c) => {
    const row = await availabilityService.deletePickupPoint(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Availability pickup point not found" }, 404)
    return c.json({ success: true })
  })
  .get("/slot-pickups", async (c) => {
    const query = availabilitySlotPickupListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await availabilityService.listSlotPickups(c.get("db"), query))
  })
  .post("/slot-pickups", async (c) => {
    return c.json(
      {
        data: await availabilityService.createSlotPickup(
          c.get("db"),
          insertAvailabilitySlotPickupSchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })
  .post("/slot-pickups/batch-update", async (c) => {
    const body = batchUpdateAvailabilitySlotPickupSchema.parse(await c.req.json())
    return c.json(
      await handleBatchUpdate({
        db: c.get("db"),
        ids: body.ids,
        patch: body.patch,
        update: availabilityService.updateSlotPickup,
      }),
    )
  })
  .post("/slot-pickups/batch-delete", async (c) => {
    const body = batchIdsSchema.parse(await c.req.json())
    return c.json(
      await handleBatchDelete({
        db: c.get("db"),
        ids: body.ids,
        remove: availabilityService.deleteSlotPickup,
      }),
    )
  })
  .get("/slot-pickups/:id", async (c) => {
    const row = await availabilityService.getSlotPickupById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Availability slot pickup not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/slot-pickups/:id", async (c) => {
    const row = await availabilityService.updateSlotPickup(
      c.get("db"),
      c.req.param("id"),
      updateAvailabilitySlotPickupSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Availability slot pickup not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/slot-pickups/:id", async (c) => {
    const row = await availabilityService.deleteSlotPickup(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Availability slot pickup not found" }, 404)
    return c.json({ success: true })
  })
  .get("/meeting-configs", async (c) => {
    const query = productMeetingConfigListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await availabilityService.listMeetingConfigs(c.get("db"), query))
  })
  .post("/meeting-configs", async (c) => {
    return c.json(
      {
        data: await availabilityService.createMeetingConfig(
          c.get("db"),
          insertProductMeetingConfigSchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })
  .post("/meeting-configs/batch-update", async (c) => {
    const body = batchUpdateProductMeetingConfigSchema.parse(await c.req.json())
    return c.json(
      await handleBatchUpdate({
        db: c.get("db"),
        ids: body.ids,
        patch: body.patch,
        update: availabilityService.updateMeetingConfig,
      }),
    )
  })
  .post("/meeting-configs/batch-delete", async (c) => {
    const body = batchIdsSchema.parse(await c.req.json())
    return c.json(
      await handleBatchDelete({
        db: c.get("db"),
        ids: body.ids,
        remove: availabilityService.deleteMeetingConfig,
      }),
    )
  })
  .get("/meeting-configs/:id", async (c) => {
    const row = await availabilityService.getMeetingConfigById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Product meeting config not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/meeting-configs/:id", async (c) => {
    const row = await availabilityService.updateMeetingConfig(
      c.get("db"),
      c.req.param("id"),
      updateProductMeetingConfigSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Product meeting config not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/meeting-configs/:id", async (c) => {
    const row = await availabilityService.deleteMeetingConfig(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Product meeting config not found" }, 404)
    return c.json({ success: true })
  })
  .get("/pickup-groups", async (c) => {
    const query = pickupGroupListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await availabilityService.listPickupGroups(c.get("db"), query))
  })
  .post("/pickup-groups", async (c) => {
    return c.json(
      {
        data: await availabilityService.createPickupGroup(
          c.get("db"),
          insertPickupGroupSchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })
  .post("/pickup-groups/batch-update", async (c) => {
    const body = batchUpdatePickupGroupSchema.parse(await c.req.json())
    return c.json(
      await handleBatchUpdate({
        db: c.get("db"),
        ids: body.ids,
        patch: body.patch,
        update: availabilityService.updatePickupGroup,
      }),
    )
  })
  .post("/pickup-groups/batch-delete", async (c) => {
    const body = batchIdsSchema.parse(await c.req.json())
    return c.json(
      await handleBatchDelete({
        db: c.get("db"),
        ids: body.ids,
        remove: availabilityService.deletePickupGroup,
      }),
    )
  })
  .get("/pickup-groups/:id", async (c) => {
    const row = await availabilityService.getPickupGroupById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Pickup group not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/pickup-groups/:id", async (c) => {
    const row = await availabilityService.updatePickupGroup(
      c.get("db"),
      c.req.param("id"),
      updatePickupGroupSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Pickup group not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/pickup-groups/:id", async (c) => {
    const row = await availabilityService.deletePickupGroup(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Pickup group not found" }, 404)
    return c.json({ success: true })
  })
  .get("/pickup-locations", async (c) => {
    const query = pickupLocationListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await availabilityService.listPickupLocations(c.get("db"), query))
  })
  .post("/pickup-locations", async (c) => {
    return c.json(
      {
        data: await availabilityService.createPickupLocation(
          c.get("db"),
          insertPickupLocationSchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })
  .post("/pickup-locations/batch-update", async (c) => {
    const body = batchUpdatePickupLocationSchema.parse(await c.req.json())
    return c.json(
      await handleBatchUpdate({
        db: c.get("db"),
        ids: body.ids,
        patch: body.patch,
        update: availabilityService.updatePickupLocation,
      }),
    )
  })
  .post("/pickup-locations/batch-delete", async (c) => {
    const body = batchIdsSchema.parse(await c.req.json())
    return c.json(
      await handleBatchDelete({
        db: c.get("db"),
        ids: body.ids,
        remove: availabilityService.deletePickupLocation,
      }),
    )
  })
  .get("/pickup-locations/:id", async (c) => {
    const row = await availabilityService.getPickupLocationById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Pickup location not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/pickup-locations/:id", async (c) => {
    const row = await availabilityService.updatePickupLocation(
      c.get("db"),
      c.req.param("id"),
      updatePickupLocationSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Pickup location not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/pickup-locations/:id", async (c) => {
    const row = await availabilityService.deletePickupLocation(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Pickup location not found" }, 404)
    return c.json({ success: true })
  })
  .get("/location-pickup-times", async (c) => {
    const query = locationPickupTimeListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await availabilityService.listLocationPickupTimes(c.get("db"), query))
  })
  .post("/location-pickup-times", async (c) => {
    return c.json(
      {
        data: await availabilityService.createLocationPickupTime(
          c.get("db"),
          insertLocationPickupTimeSchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })
  .post("/location-pickup-times/batch-update", async (c) => {
    const body = batchUpdateLocationPickupTimeSchema.parse(await c.req.json())
    return c.json(
      await handleBatchUpdate({
        db: c.get("db"),
        ids: body.ids,
        patch: body.patch,
        update: availabilityService.updateLocationPickupTime,
      }),
    )
  })
  .post("/location-pickup-times/batch-delete", async (c) => {
    const body = batchIdsSchema.parse(await c.req.json())
    return c.json(
      await handleBatchDelete({
        db: c.get("db"),
        ids: body.ids,
        remove: availabilityService.deleteLocationPickupTime,
      }),
    )
  })
  .get("/location-pickup-times/:id", async (c) => {
    const row = await availabilityService.getLocationPickupTimeById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Location pickup time not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/location-pickup-times/:id", async (c) => {
    const row = await availabilityService.updateLocationPickupTime(
      c.get("db"),
      c.req.param("id"),
      updateLocationPickupTimeSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Location pickup time not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/location-pickup-times/:id", async (c) => {
    const row = await availabilityService.deleteLocationPickupTime(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Location pickup time not found" }, 404)
    return c.json({ success: true })
  })
  .get("/custom-pickup-areas", async (c) => {
    const query = customPickupAreaListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await availabilityService.listCustomPickupAreas(c.get("db"), query))
  })
  .post("/custom-pickup-areas", async (c) => {
    return c.json(
      {
        data: await availabilityService.createCustomPickupArea(
          c.get("db"),
          insertCustomPickupAreaSchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })
  .post("/custom-pickup-areas/batch-update", async (c) => {
    const body = batchUpdateCustomPickupAreaSchema.parse(await c.req.json())
    return c.json(
      await handleBatchUpdate({
        db: c.get("db"),
        ids: body.ids,
        patch: body.patch,
        update: availabilityService.updateCustomPickupArea,
      }),
    )
  })
  .post("/custom-pickup-areas/batch-delete", async (c) => {
    const body = batchIdsSchema.parse(await c.req.json())
    return c.json(
      await handleBatchDelete({
        db: c.get("db"),
        ids: body.ids,
        remove: availabilityService.deleteCustomPickupArea,
      }),
    )
  })
  .get("/custom-pickup-areas/:id", async (c) => {
    const row = await availabilityService.getCustomPickupAreaById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Custom pickup area not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/custom-pickup-areas/:id", async (c) => {
    const row = await availabilityService.updateCustomPickupArea(
      c.get("db"),
      c.req.param("id"),
      updateCustomPickupAreaSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Custom pickup area not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/custom-pickup-areas/:id", async (c) => {
    const row = await availabilityService.deleteCustomPickupArea(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Custom pickup area not found" }, 404)
    return c.json({ success: true })
  })

export type AvailabilityRoutes = typeof availabilityRoutes
