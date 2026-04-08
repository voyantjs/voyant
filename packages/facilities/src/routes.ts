import {
  insertAddressForEntitySchema,
  insertContactPointForEntitySchema,
  updateAddressSchema as updateIdentityAddressSchema,
  updateContactPointSchema as updateIdentityContactPointSchema,
} from "@voyantjs/identity/validation"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { Hono } from "hono"

import { facilitiesService } from "./service.js"
import {
  facilityContactListQuerySchema,
  facilityFeatureListQuerySchema,
  facilityListQuerySchema,
  facilityOperationScheduleListQuerySchema,
  insertFacilityContactSchema,
  insertFacilityFeatureSchema,
  insertFacilityOperationScheduleSchema,
  insertFacilitySchema,
  insertPropertyGroupMemberSchema,
  insertPropertyGroupSchema,
  insertPropertySchema,
  propertyGroupListQuerySchema,
  propertyGroupMemberListQuerySchema,
  propertyListQuerySchema,
  updateFacilityContactSchema,
  updateFacilityFeatureSchema,
  updateFacilityOperationScheduleSchema,
  updateFacilitySchema,
  updatePropertyGroupMemberSchema,
  updatePropertyGroupSchema,
  updatePropertySchema,
} from "./validation.js"

type Env = {
  Variables: {
    db: PostgresJsDatabase
    userId?: string
  }
}

export const facilitiesRoutes = new Hono<Env>()
  .get("/facilities", async (c) => {
    const query = facilityListQuerySchema.parse(Object.fromEntries(new URL(c.req.url).searchParams))
    return c.json(await facilitiesService.listFacilities(c.get("db"), query))
  })
  .post("/facilities", async (c) => {
    return c.json(
      {
        data: await facilitiesService.createFacility(
          c.get("db"),
          insertFacilitySchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })
  .get("/facilities/:id", async (c) => {
    const row = await facilitiesService.getFacilityById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Facility not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/facilities/:id", async (c) => {
    const row = await facilitiesService.updateFacility(
      c.get("db"),
      c.req.param("id"),
      updateFacilitySchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Facility not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/facilities/:id", async (c) => {
    const row = await facilitiesService.deleteFacility(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Facility not found" }, 404)
    return c.json({ success: true })
  })
  .get("/facilities/:id/contact-points", async (c) => {
    return c.json({
      data: await facilitiesService.listContactPoints(c.get("db"), c.req.param("id")),
    })
  })
  .post("/facilities/:id/contact-points", async (c) => {
    const row = await facilitiesService.createContactPoint(
      c.get("db"),
      c.req.param("id"),
      insertContactPointForEntitySchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Facility not found" }, 404)
    return c.json({ data: row }, 201)
  })
  .patch("/contact-points/:id", async (c) => {
    const row = await facilitiesService.updateContactPoint(
      c.get("db"),
      c.req.param("id"),
      updateIdentityContactPointSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Contact point not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/contact-points/:id", async (c) => {
    const row = await facilitiesService.deleteContactPoint(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Contact point not found" }, 404)
    return c.json({ success: true })
  })
  .get("/facilities/:id/addresses", async (c) => {
    return c.json({ data: await facilitiesService.listAddresses(c.get("db"), c.req.param("id")) })
  })
  .post("/facilities/:id/addresses", async (c) => {
    const row = await facilitiesService.createAddress(
      c.get("db"),
      c.req.param("id"),
      insertAddressForEntitySchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Facility not found" }, 404)
    return c.json({ data: row }, 201)
  })
  .patch("/addresses/:id", async (c) => {
    const row = await facilitiesService.updateAddress(
      c.get("db"),
      c.req.param("id"),
      updateIdentityAddressSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Address not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/addresses/:id", async (c) => {
    const row = await facilitiesService.deleteAddress(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Address not found" }, 404)
    return c.json({ success: true })
  })
  .get("/facility-contacts", async (c) => {
    const query = facilityContactListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await facilitiesService.listFacilityContacts(c.get("db"), query))
  })
  .post("/facilities/:id/contacts", async (c) => {
    const row = await facilitiesService.createFacilityContact(
      c.get("db"),
      c.req.param("id"),
      insertFacilityContactSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Facility not found" }, 404)
    return c.json({ data: row }, 201)
  })
  .patch("/facility-contacts/:id", async (c) => {
    const row = await facilitiesService.updateFacilityContact(
      c.get("db"),
      c.req.param("id"),
      updateFacilityContactSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Facility contact not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/facility-contacts/:id", async (c) => {
    const row = await facilitiesService.deleteFacilityContact(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Facility contact not found" }, 404)
    return c.json({ success: true })
  })
  .get("/facility-features", async (c) => {
    const query = facilityFeatureListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await facilitiesService.listFacilityFeatures(c.get("db"), query))
  })
  .post("/facilities/:id/features", async (c) => {
    const row = await facilitiesService.createFacilityFeature(
      c.get("db"),
      c.req.param("id"),
      insertFacilityFeatureSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Facility not found" }, 404)
    return c.json({ data: row }, 201)
  })
  .patch("/facility-features/:id", async (c) => {
    const row = await facilitiesService.updateFacilityFeature(
      c.get("db"),
      c.req.param("id"),
      updateFacilityFeatureSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Facility feature not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/facility-features/:id", async (c) => {
    const row = await facilitiesService.deleteFacilityFeature(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Facility feature not found" }, 404)
    return c.json({ success: true })
  })
  .get("/facility-operation-schedules", async (c) => {
    const query = facilityOperationScheduleListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await facilitiesService.listFacilityOperationSchedules(c.get("db"), query))
  })
  .post("/facilities/:id/operation-schedules", async (c) => {
    const row = await facilitiesService.createFacilityOperationSchedule(
      c.get("db"),
      c.req.param("id"),
      insertFacilityOperationScheduleSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Facility not found" }, 404)
    return c.json({ data: row }, 201)
  })
  .patch("/facility-operation-schedules/:id", async (c) => {
    const row = await facilitiesService.updateFacilityOperationSchedule(
      c.get("db"),
      c.req.param("id"),
      updateFacilityOperationScheduleSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Facility operation schedule not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/facility-operation-schedules/:id", async (c) => {
    const row = await facilitiesService.deleteFacilityOperationSchedule(
      c.get("db"),
      c.req.param("id"),
    )
    if (!row) return c.json({ error: "Facility operation schedule not found" }, 404)
    return c.json({ success: true })
  })
  .get("/properties", async (c) => {
    const query = propertyListQuerySchema.parse(Object.fromEntries(new URL(c.req.url).searchParams))
    return c.json(await facilitiesService.listProperties(c.get("db"), query))
  })
  .post("/properties", async (c) => {
    const row = await facilitiesService.createProperty(
      c.get("db"),
      insertPropertySchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Facility not found" }, 404)
    return c.json({ data: row }, 201)
  })
  .get("/properties/:id", async (c) => {
    const row = await facilitiesService.getPropertyById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Property not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/properties/:id", async (c) => {
    const row = await facilitiesService.updateProperty(
      c.get("db"),
      c.req.param("id"),
      updatePropertySchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Property not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/properties/:id", async (c) => {
    const row = await facilitiesService.deleteProperty(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Property not found" }, 404)
    return c.json({ success: true })
  })
  .get("/property-groups", async (c) => {
    const query = propertyGroupListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await facilitiesService.listPropertyGroups(c.get("db"), query))
  })
  .post("/property-groups", async (c) => {
    const row = await facilitiesService.createPropertyGroup(
      c.get("db"),
      insertPropertyGroupSchema.parse(await c.req.json()),
    )
    return c.json({ data: row }, 201)
  })
  .get("/property-groups/:id", async (c) => {
    const row = await facilitiesService.getPropertyGroupById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Property group not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/property-groups/:id", async (c) => {
    const row = await facilitiesService.updatePropertyGroup(
      c.get("db"),
      c.req.param("id"),
      updatePropertyGroupSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Property group not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/property-groups/:id", async (c) => {
    const row = await facilitiesService.deletePropertyGroup(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Property group not found" }, 404)
    return c.json({ success: true })
  })
  .get("/property-group-members", async (c) => {
    const query = propertyGroupMemberListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await facilitiesService.listPropertyGroupMembers(c.get("db"), query))
  })
  .post("/property-group-members", async (c) => {
    const row = await facilitiesService.createPropertyGroupMember(
      c.get("db"),
      insertPropertyGroupMemberSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Property group or property not found" }, 404)
    return c.json({ data: row }, 201)
  })
  .get("/property-group-members/:id", async (c) => {
    const row = await facilitiesService.getPropertyGroupMemberById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Property group member not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/property-group-members/:id", async (c) => {
    const row = await facilitiesService.updatePropertyGroupMember(
      c.get("db"),
      c.req.param("id"),
      updatePropertyGroupMemberSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Property group member not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/property-group-members/:id", async (c) => {
    const row = await facilitiesService.deletePropertyGroupMember(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Property group member not found" }, 404)
    return c.json({ success: true })
  })

export type FacilitiesRoutes = typeof facilitiesRoutes
