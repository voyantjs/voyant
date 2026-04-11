import {
  hospitalityGuaranteeModeSchema,
  hospitalityHousekeepingTaskStatusSchema,
  hospitalityInventoryModeSchema,
  hospitalityMaintenanceBlockStatusSchema,
  insertMaintenanceBlockSchema,
  insertMealPlanSchema,
  insertRatePlanInventoryOverrideSchema,
  insertRatePlanRoomTypeSchema,
  insertRatePlanSchema,
  insertRoomTypeRateSchema,
  insertRoomTypeSchema,
  insertRoomUnitSchema,
  insertStayRuleSchema,
  ratePlanChargeFrequencySchema,
  roomUnitStatusSchema,
  stayBookingItemStatusSchema,
  stayFolioStatusSchema,
  stayOperationStatusSchema,
} from "@voyantjs/hospitality"
import { z } from "zod"

export const paginatedEnvelope = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    data: z.array(item),
    total: z.number().int(),
    limit: z.number().int(),
    offset: z.number().int(),
  })

export const singleEnvelope = <T extends z.ZodTypeAny>(item: T) => z.object({ data: item })
export const successEnvelope = z.object({ success: z.boolean() })

const nullableInt = z.number().int().nullable()

export const roomTypeRecordSchema = insertRoomTypeSchema.extend({
  id: z.string(),
  code: z.string().nullable(),
  description: z.string().nullable(),
  maxAdults: nullableInt,
  maxChildren: nullableInt,
  maxInfants: nullableInt,
  standardOccupancy: nullableInt,
  maxOccupancy: nullableInt,
  minOccupancy: nullableInt,
  bedroomCount: nullableInt,
  bathroomCount: nullableInt,
  smokingAllowed: z.boolean(),
  active: z.boolean(),
  sortOrder: z.number().int(),
  inventoryMode: hospitalityInventoryModeSchema,
})

export type RoomTypeRecord = z.infer<typeof roomTypeRecordSchema>

export const mealPlanRecordSchema = insertMealPlanSchema.extend({
  id: z.string(),
  description: z.string().nullable(),
  includesBreakfast: z.boolean(),
  includesLunch: z.boolean(),
  includesDinner: z.boolean(),
  includesDrinks: z.boolean(),
  active: z.boolean(),
  sortOrder: z.number().int(),
})

export type MealPlanRecord = z.infer<typeof mealPlanRecordSchema>

export const roomUnitRecordSchema = insertRoomUnitSchema.extend({
  id: z.string(),
  code: z.string().nullable(),
  roomNumber: z.string().nullable(),
  floor: z.string().nullable(),
  wing: z.string().nullable(),
  status: roomUnitStatusSchema,
  viewCode: z.string().nullable(),
  accessibilityCode: z.string().nullable(),
  genderRestriction: z.string().nullable(),
  notes: z.string().nullable(),
})

export type RoomUnitRecord = z.infer<typeof roomUnitRecordSchema>

export const maintenanceBlockRecordSchema = insertMaintenanceBlockSchema.extend({
  id: z.string(),
  roomTypeId: z.string().nullable(),
  roomUnitId: z.string().nullable(),
  status: hospitalityMaintenanceBlockStatusSchema,
  reason: z.string().nullable(),
  notes: z.string().nullable(),
})

export type MaintenanceBlockRecord = z.infer<typeof maintenanceBlockRecordSchema>

export const roomBlockRecordSchema = z.object({
  id: z.string(),
  propertyId: z.string(),
  roomTypeId: z.string().nullable(),
  roomUnitId: z.string().nullable(),
  startsOn: z.string(),
  endsOn: z.string(),
  status: z.enum(["draft", "held", "confirmed", "released", "cancelled"]),
  blockReason: z.string().nullable(),
  quantity: z.number().int(),
  releaseAt: z.string().nullable(),
  notes: z.string().nullable(),
})

export type RoomBlockRecord = z.infer<typeof roomBlockRecordSchema>

export const roomInventoryRecordSchema = z.object({
  id: z.string(),
  propertyId: z.string(),
  roomTypeId: z.string(),
  date: z.string(),
  totalUnits: z.number().int(),
  availableUnits: z.number().int(),
  heldUnits: z.number().int(),
  soldUnits: z.number().int(),
  outOfOrderUnits: z.number().int(),
  overbookLimit: z.number().int().nullable(),
  stopSell: z.boolean(),
  notes: z.string().nullable(),
})

export type RoomInventoryRecord = z.infer<typeof roomInventoryRecordSchema>

export const ratePlanRecordSchema = insertRatePlanSchema.extend({
  id: z.string(),
  description: z.string().nullable(),
  mealPlanId: z.string().nullable(),
  priceCatalogId: z.string().nullable(),
  cancellationPolicyId: z.string().nullable(),
  chargeFrequency: ratePlanChargeFrequencySchema,
  guaranteeMode: hospitalityGuaranteeModeSchema,
  commissionable: z.boolean(),
  refundable: z.boolean(),
  active: z.boolean(),
  sortOrder: z.number().int(),
})

export type RatePlanRecord = z.infer<typeof ratePlanRecordSchema>

export const ratePlanRoomTypeRecordSchema = insertRatePlanRoomTypeSchema.extend({
  id: z.string(),
  productId: z.string().nullable(),
  optionId: z.string().nullable(),
  unitId: z.string().nullable(),
  active: z.boolean(),
  sortOrder: z.number().int(),
})

export type RatePlanRoomTypeRecord = z.infer<typeof ratePlanRoomTypeRecordSchema>

export const ratePlanInventoryOverrideRecordSchema = insertRatePlanInventoryOverrideSchema.extend({
  id: z.string(),
  minNightsOverride: nullableInt,
  maxNightsOverride: nullableInt,
  notes: z.string().nullable(),
})

export type RatePlanInventoryOverrideRecord = z.infer<typeof ratePlanInventoryOverrideRecordSchema>

export const roomTypeRateRecordSchema = insertRoomTypeRateSchema.extend({
  id: z.string(),
  priceScheduleId: z.string().nullable(),
  baseAmountCents: nullableInt,
  extraAdultAmountCents: nullableInt,
  extraChildAmountCents: nullableInt,
  extraInfantAmountCents: nullableInt,
  active: z.boolean(),
  notes: z.string().nullable(),
})

export type RoomTypeRateRecord = z.infer<typeof roomTypeRateRecordSchema>

export const stayRuleRecordSchema = insertStayRuleSchema.extend({
  id: z.string(),
  ratePlanId: z.string().nullable(),
  roomTypeId: z.string().nullable(),
  validFrom: z.string().nullable(),
  validTo: z.string().nullable(),
  minNights: nullableInt,
  maxNights: nullableInt,
  minAdvanceDays: nullableInt,
  maxAdvanceDays: nullableInt,
  releaseDays: nullableInt,
  arrivalWeekdays: z.array(z.string()).nullable(),
  departureWeekdays: z.array(z.string()).nullable(),
  notes: z.string().nullable(),
  active: z.boolean(),
  priority: z.number().int(),
})

export type StayRuleRecord = z.infer<typeof stayRuleRecordSchema>

export const stayBookingItemRecordSchema = z.object({
  id: z.string(),
  bookingItemId: z.string(),
  propertyId: z.string(),
  roomTypeId: z.string(),
  roomUnitId: z.string().nullable(),
  ratePlanId: z.string(),
  mealPlanId: z.string().nullable(),
  checkInDate: z.string(),
  checkOutDate: z.string(),
  nightCount: z.number().int(),
  roomCount: z.number().int(),
  adults: z.number().int(),
  children: z.number().int(),
  infants: z.number().int(),
  confirmationCode: z.string().nullable(),
  voucherCode: z.string().nullable(),
  status: stayBookingItemStatusSchema,
  notes: z.string().nullable(),
})

export type StayBookingItemRecord = z.infer<typeof stayBookingItemRecordSchema>

export const stayOperationRecordSchema = z.object({
  id: z.string(),
  stayBookingItemId: z.string(),
  propertyId: z.string(),
  roomUnitId: z.string().nullable(),
  operationStatus: stayOperationStatusSchema,
  expectedArrivalAt: z.string().nullable(),
  expectedDepartureAt: z.string().nullable(),
  checkedInAt: z.string().nullable(),
  checkedOutAt: z.string().nullable(),
  noShowRecordedAt: z.string().nullable(),
  notes: z.string().nullable(),
})

export type StayOperationRecord = z.infer<typeof stayOperationRecordSchema>

export const stayFolioRecordSchema = z.object({
  id: z.string(),
  stayOperationId: z.string(),
  currencyCode: z.string(),
  status: stayFolioStatusSchema,
  openedAt: z.string().nullable(),
  closedAt: z.string().nullable(),
  notes: z.string().nullable(),
})

export type StayFolioRecord = z.infer<typeof stayFolioRecordSchema>

export const housekeepingTaskRecordSchema = z.object({
  id: z.string(),
  propertyId: z.string(),
  roomUnitId: z.string(),
  stayBookingItemId: z.string().nullable(),
  taskType: z.string(),
  status: hospitalityHousekeepingTaskStatusSchema,
  priority: z.number().int(),
  dueAt: z.string().nullable(),
  startedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  assignedTo: z.string().nullable(),
  notes: z.string().nullable(),
})

export type HousekeepingTaskRecord = z.infer<typeof housekeepingTaskRecordSchema>

export const roomTypeListResponse = paginatedEnvelope(roomTypeRecordSchema)
export const roomTypeSingleResponse = singleEnvelope(roomTypeRecordSchema)
export const mealPlanListResponse = paginatedEnvelope(mealPlanRecordSchema)
export const mealPlanSingleResponse = singleEnvelope(mealPlanRecordSchema)
export const roomUnitListResponse = paginatedEnvelope(roomUnitRecordSchema)
export const roomUnitSingleResponse = singleEnvelope(roomUnitRecordSchema)
export const maintenanceBlockListResponse = paginatedEnvelope(maintenanceBlockRecordSchema)
export const maintenanceBlockSingleResponse = singleEnvelope(maintenanceBlockRecordSchema)
export const roomBlockListResponse = paginatedEnvelope(roomBlockRecordSchema)
export const roomBlockSingleResponse = singleEnvelope(roomBlockRecordSchema)
export const roomInventoryListResponse = paginatedEnvelope(roomInventoryRecordSchema)
export const roomInventorySingleResponse = singleEnvelope(roomInventoryRecordSchema)
export const ratePlanListResponse = paginatedEnvelope(ratePlanRecordSchema)
export const ratePlanSingleResponse = singleEnvelope(ratePlanRecordSchema)
export const ratePlanRoomTypeListResponse = paginatedEnvelope(ratePlanRoomTypeRecordSchema)
export const ratePlanRoomTypeSingleResponse = singleEnvelope(ratePlanRoomTypeRecordSchema)
export const ratePlanInventoryOverrideListResponse = paginatedEnvelope(
  ratePlanInventoryOverrideRecordSchema,
)
export const ratePlanInventoryOverrideSingleResponse = singleEnvelope(
  ratePlanInventoryOverrideRecordSchema,
)
export const roomTypeRateListResponse = paginatedEnvelope(roomTypeRateRecordSchema)
export const roomTypeRateSingleResponse = singleEnvelope(roomTypeRateRecordSchema)
export const stayRuleListResponse = paginatedEnvelope(stayRuleRecordSchema)
export const stayRuleSingleResponse = singleEnvelope(stayRuleRecordSchema)
export const stayBookingItemListResponse = paginatedEnvelope(stayBookingItemRecordSchema)
export const stayBookingItemSingleResponse = singleEnvelope(stayBookingItemRecordSchema)
export const stayOperationListResponse = paginatedEnvelope(stayOperationRecordSchema)
export const stayOperationSingleResponse = singleEnvelope(stayOperationRecordSchema)
export const stayFolioListResponse = paginatedEnvelope(stayFolioRecordSchema)
export const stayFolioSingleResponse = singleEnvelope(stayFolioRecordSchema)
export const housekeepingTaskListResponse = paginatedEnvelope(housekeepingTaskRecordSchema)
export const housekeepingTaskSingleResponse = singleEnvelope(housekeepingTaskRecordSchema)
