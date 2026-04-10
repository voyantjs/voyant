import { Hono } from "hono"
import {
  batchIdsSchema,
  createBatchUpdateSchema,
  type Env,
  handleBatchDelete,
  handleBatchUpdate,
  notFound,
} from "./routes-shared.js"
import { availabilityService } from "./service.js"
import {
  availabilityPickupPointListQuerySchema,
  availabilitySlotPickupListQuerySchema,
  customPickupAreaListQuerySchema,
  insertAvailabilityPickupPointSchema,
  insertAvailabilitySlotPickupSchema,
  insertCustomPickupAreaSchema,
  insertLocationPickupTimeSchema,
  insertPickupGroupSchema,
  insertPickupLocationSchema,
  insertProductMeetingConfigSchema,
  locationPickupTimeListQuerySchema,
  pickupGroupListQuerySchema,
  pickupLocationListQuerySchema,
  productMeetingConfigListQuerySchema,
  updateAvailabilityPickupPointSchema,
  updateAvailabilitySlotPickupSchema,
  updateCustomPickupAreaSchema,
  updateLocationPickupTimeSchema,
  updatePickupGroupSchema,
  updatePickupLocationSchema,
  updateProductMeetingConfigSchema,
} from "./validation.js"

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

export const availabilityPickupRoutes = new Hono<Env>()
  .get("/pickup-points", async (c) => {
    const query = availabilityPickupPointListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await availabilityService.listPickupPoints(c.get("db"), query))
  })
  .post("/pickup-points", async (c) =>
    c.json(
      {
        data: await availabilityService.createPickupPoint(
          c.get("db"),
          insertAvailabilityPickupPointSchema.parse(await c.req.json()),
        ),
      },
      201,
    ),
  )
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
    return row ? c.json({ data: row }) : notFound(c, "Availability pickup point not found")
  })
  .patch("/pickup-points/:id", async (c) => {
    const row = await availabilityService.updatePickupPoint(
      c.get("db"),
      c.req.param("id"),
      updateAvailabilityPickupPointSchema.parse(await c.req.json()),
    )
    return row ? c.json({ data: row }) : notFound(c, "Availability pickup point not found")
  })
  .delete("/pickup-points/:id", async (c) => {
    const row = await availabilityService.deletePickupPoint(c.get("db"), c.req.param("id"))
    return row ? c.json({ success: true }) : notFound(c, "Availability pickup point not found")
  })
  .get("/slot-pickups", async (c) => {
    const query = availabilitySlotPickupListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await availabilityService.listSlotPickups(c.get("db"), query))
  })
  .post("/slot-pickups", async (c) =>
    c.json(
      {
        data: await availabilityService.createSlotPickup(
          c.get("db"),
          insertAvailabilitySlotPickupSchema.parse(await c.req.json()),
        ),
      },
      201,
    ),
  )
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
    return row ? c.json({ data: row }) : notFound(c, "Availability slot pickup not found")
  })
  .patch("/slot-pickups/:id", async (c) => {
    const row = await availabilityService.updateSlotPickup(
      c.get("db"),
      c.req.param("id"),
      updateAvailabilitySlotPickupSchema.parse(await c.req.json()),
    )
    return row ? c.json({ data: row }) : notFound(c, "Availability slot pickup not found")
  })
  .delete("/slot-pickups/:id", async (c) => {
    const row = await availabilityService.deleteSlotPickup(c.get("db"), c.req.param("id"))
    return row ? c.json({ success: true }) : notFound(c, "Availability slot pickup not found")
  })
  .get("/meeting-configs", async (c) => {
    const query = productMeetingConfigListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await availabilityService.listMeetingConfigs(c.get("db"), query))
  })
  .post("/meeting-configs", async (c) =>
    c.json(
      {
        data: await availabilityService.createMeetingConfig(
          c.get("db"),
          insertProductMeetingConfigSchema.parse(await c.req.json()),
        ),
      },
      201,
    ),
  )
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
    return row ? c.json({ data: row }) : notFound(c, "Product meeting config not found")
  })
  .patch("/meeting-configs/:id", async (c) => {
    const row = await availabilityService.updateMeetingConfig(
      c.get("db"),
      c.req.param("id"),
      updateProductMeetingConfigSchema.parse(await c.req.json()),
    )
    return row ? c.json({ data: row }) : notFound(c, "Product meeting config not found")
  })
  .delete("/meeting-configs/:id", async (c) => {
    const row = await availabilityService.deleteMeetingConfig(c.get("db"), c.req.param("id"))
    return row ? c.json({ success: true }) : notFound(c, "Product meeting config not found")
  })
  .get("/pickup-groups", async (c) => {
    const query = pickupGroupListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await availabilityService.listPickupGroups(c.get("db"), query))
  })
  .post("/pickup-groups", async (c) =>
    c.json(
      {
        data: await availabilityService.createPickupGroup(
          c.get("db"),
          insertPickupGroupSchema.parse(await c.req.json()),
        ),
      },
      201,
    ),
  )
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
    return row ? c.json({ data: row }) : notFound(c, "Pickup group not found")
  })
  .patch("/pickup-groups/:id", async (c) => {
    const row = await availabilityService.updatePickupGroup(
      c.get("db"),
      c.req.param("id"),
      updatePickupGroupSchema.parse(await c.req.json()),
    )
    return row ? c.json({ data: row }) : notFound(c, "Pickup group not found")
  })
  .delete("/pickup-groups/:id", async (c) => {
    const row = await availabilityService.deletePickupGroup(c.get("db"), c.req.param("id"))
    return row ? c.json({ success: true }) : notFound(c, "Pickup group not found")
  })
  .get("/pickup-locations", async (c) => {
    const query = pickupLocationListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await availabilityService.listPickupLocations(c.get("db"), query))
  })
  .post("/pickup-locations", async (c) =>
    c.json(
      {
        data: await availabilityService.createPickupLocation(
          c.get("db"),
          insertPickupLocationSchema.parse(await c.req.json()),
        ),
      },
      201,
    ),
  )
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
    return row ? c.json({ data: row }) : notFound(c, "Pickup location not found")
  })
  .patch("/pickup-locations/:id", async (c) => {
    const row = await availabilityService.updatePickupLocation(
      c.get("db"),
      c.req.param("id"),
      updatePickupLocationSchema.parse(await c.req.json()),
    )
    return row ? c.json({ data: row }) : notFound(c, "Pickup location not found")
  })
  .delete("/pickup-locations/:id", async (c) => {
    const row = await availabilityService.deletePickupLocation(c.get("db"), c.req.param("id"))
    return row ? c.json({ success: true }) : notFound(c, "Pickup location not found")
  })
  .get("/location-pickup-times", async (c) => {
    const query = locationPickupTimeListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await availabilityService.listLocationPickupTimes(c.get("db"), query))
  })
  .post("/location-pickup-times", async (c) =>
    c.json(
      {
        data: await availabilityService.createLocationPickupTime(
          c.get("db"),
          insertLocationPickupTimeSchema.parse(await c.req.json()),
        ),
      },
      201,
    ),
  )
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
    return row ? c.json({ data: row }) : notFound(c, "Location pickup time not found")
  })
  .patch("/location-pickup-times/:id", async (c) => {
    const row = await availabilityService.updateLocationPickupTime(
      c.get("db"),
      c.req.param("id"),
      updateLocationPickupTimeSchema.parse(await c.req.json()),
    )
    return row ? c.json({ data: row }) : notFound(c, "Location pickup time not found")
  })
  .delete("/location-pickup-times/:id", async (c) => {
    const row = await availabilityService.deleteLocationPickupTime(c.get("db"), c.req.param("id"))
    return row ? c.json({ success: true }) : notFound(c, "Location pickup time not found")
  })
  .get("/custom-pickup-areas", async (c) => {
    const query = customPickupAreaListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await availabilityService.listCustomPickupAreas(c.get("db"), query))
  })
  .post("/custom-pickup-areas", async (c) =>
    c.json(
      {
        data: await availabilityService.createCustomPickupArea(
          c.get("db"),
          insertCustomPickupAreaSchema.parse(await c.req.json()),
        ),
      },
      201,
    ),
  )
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
    return row ? c.json({ data: row }) : notFound(c, "Custom pickup area not found")
  })
  .patch("/custom-pickup-areas/:id", async (c) => {
    const row = await availabilityService.updateCustomPickupArea(
      c.get("db"),
      c.req.param("id"),
      updateCustomPickupAreaSchema.parse(await c.req.json()),
    )
    return row ? c.json({ data: row }) : notFound(c, "Custom pickup area not found")
  })
  .delete("/custom-pickup-areas/:id", async (c) => {
    const row = await availabilityService.deleteCustomPickupArea(c.get("db"), c.req.param("id"))
    return row ? c.json({ success: true }) : notFound(c, "Custom pickup area not found")
  })
