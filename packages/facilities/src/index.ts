import type { Module } from "@voyantjs/core"
import type { HonoModule } from "@voyantjs/hono/module"

import { facilitiesRoutes } from "./routes.js"
import { facilitiesService } from "./service.js"

export type { FacilitiesRoutes } from "./routes.js"

export const facilitiesModule: Module = {
  name: "facilities",
}

export const facilitiesHonoModule: HonoModule = {
  module: facilitiesModule,
  routes: facilitiesRoutes,
}

export type {
  Facility,
  FacilityAddressProjection,
  FacilityContact,
  FacilityFeature,
  FacilityOperationSchedule,
  NewFacility,
  NewFacilityAddressProjection,
  NewFacilityContact,
  NewFacilityFeature,
  NewFacilityOperationSchedule,
  NewProperty,
  NewPropertyGroup,
  NewPropertyGroupMember,
  Property,
  PropertyGroup,
  PropertyGroupMember,
} from "./schema.js"
export {
  facilities,
  facilityAddressProjections,
  facilityFeatures,
  facilityOperationSchedules,
  properties,
  propertyGroupMembers,
  propertyGroups,
} from "./schema.js"
export {
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
export { facilitiesService }
