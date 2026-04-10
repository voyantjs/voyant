import {
  booleanQueryParam,
  hospitalityHousekeepingTaskStatusSchema,
  hospitalityMaintenanceBlockStatusSchema,
  hospitalityRoomBlockStatusSchema,
  nullableDate,
  nullableInt,
  nullableMoney,
  nullableString,
  paginationSchema,
  stayBookingItemStatusSchema,
  stayCheckpointTypeSchema,
  stayFolioStatusSchema,
  stayOperationStatusSchema,
  stayServicePostKindSchema,
  z,
} from "./validation-shared.js"

export const stayRuleCoreSchema = z.object({
  propertyId: z.string(),
  ratePlanId: z.string().nullable().optional(),
  roomTypeId: z.string().nullable().optional(),
  validFrom: nullableDate,
  validTo: nullableDate,
  minNights: nullableInt,
  maxNights: nullableInt,
  minAdvanceDays: nullableInt,
  maxAdvanceDays: nullableInt,
  closedToArrival: z.boolean().default(false),
  closedToDeparture: z.boolean().default(false),
  arrivalWeekdays: z.array(z.string()).nullable().optional(),
  departureWeekdays: z.array(z.string()).nullable().optional(),
  releaseDays: nullableInt,
  active: z.boolean().default(true),
  priority: z.number().int().default(0),
  notes: nullableString,
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
})
export const insertStayRuleSchema = stayRuleCoreSchema
export const updateStayRuleSchema = stayRuleCoreSchema.partial()
export const stayRuleListQuerySchema = paginationSchema.extend({
  propertyId: z.string().optional(),
  ratePlanId: z.string().optional(),
  roomTypeId: z.string().optional(),
  active: booleanQueryParam.optional(),
})

export const roomInventoryCoreSchema = z.object({
  propertyId: z.string(),
  roomTypeId: z.string(),
  date: z.string().date(),
  totalUnits: z.number().int().min(0).default(0),
  availableUnits: z.number().int().min(0).default(0),
  heldUnits: z.number().int().min(0).default(0),
  soldUnits: z.number().int().min(0).default(0),
  outOfOrderUnits: z.number().int().min(0).default(0),
  overbookLimit: nullableInt,
  stopSell: z.boolean().default(false),
  notes: nullableString,
})
export const insertRoomInventorySchema = roomInventoryCoreSchema
export const updateRoomInventorySchema = roomInventoryCoreSchema.partial()
export const roomInventoryListQuerySchema = paginationSchema.extend({
  propertyId: z.string().optional(),
  roomTypeId: z.string().optional(),
  dateFrom: nullableDate,
  dateTo: nullableDate,
  stopSell: booleanQueryParam.optional(),
})

export const ratePlanInventoryOverrideCoreSchema = z.object({
  ratePlanId: z.string(),
  roomTypeId: z.string(),
  date: z.string().date(),
  stopSell: z.boolean().default(false),
  closedToArrival: z.boolean().default(false),
  closedToDeparture: z.boolean().default(false),
  minNightsOverride: nullableInt,
  maxNightsOverride: nullableInt,
  notes: nullableString,
})
export const insertRatePlanInventoryOverrideSchema = ratePlanInventoryOverrideCoreSchema
export const updateRatePlanInventoryOverrideSchema = ratePlanInventoryOverrideCoreSchema.partial()
export const ratePlanInventoryOverrideListQuerySchema = paginationSchema.extend({
  ratePlanId: z.string().optional(),
  roomTypeId: z.string().optional(),
  dateFrom: nullableDate,
  dateTo: nullableDate,
})

export const stayBookingItemCoreSchema = z.object({
  bookingItemId: z.string(),
  propertyId: z.string(),
  roomTypeId: z.string(),
  roomUnitId: z.string().nullable().optional(),
  ratePlanId: z.string(),
  checkInDate: z.string().date(),
  checkOutDate: z.string().date(),
  nightCount: z.number().int().min(1).default(1),
  roomCount: z.number().int().min(1).default(1),
  adults: z.number().int().min(0).default(1),
  children: z.number().int().min(0).default(0),
  infants: z.number().int().min(0).default(0),
  mealPlanId: z.string().nullable().optional(),
  confirmationCode: nullableString,
  voucherCode: nullableString,
  status: stayBookingItemStatusSchema.default("reserved"),
  notes: nullableString,
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
})
export const insertStayBookingItemSchema = stayBookingItemCoreSchema
export const updateStayBookingItemSchema = stayBookingItemCoreSchema.partial()
export const stayBookingItemListQuerySchema = paginationSchema.extend({
  bookingItemId: z.string().optional(),
  propertyId: z.string().optional(),
  roomTypeId: z.string().optional(),
  roomUnitId: z.string().optional(),
  ratePlanId: z.string().optional(),
  status: stayBookingItemStatusSchema.optional(),
  dateFrom: nullableDate,
  dateTo: nullableDate,
})

export const stayDailyRateCoreSchema = z.object({
  stayBookingItemId: z.string(),
  date: z.string().date(),
  sellCurrency: z.string().length(3),
  sellAmountCents: nullableMoney,
  costCurrency: z.string().length(3).nullable().optional(),
  costAmountCents: nullableMoney,
  taxAmountCents: nullableMoney,
  feeAmountCents: nullableMoney,
  commissionAmountCents: nullableMoney,
})
export const insertStayDailyRateSchema = stayDailyRateCoreSchema
export const updateStayDailyRateSchema = stayDailyRateCoreSchema.partial()
export const stayDailyRateListQuerySchema = paginationSchema.extend({
  stayBookingItemId: z.string().optional(),
  dateFrom: nullableDate,
  dateTo: nullableDate,
})

export const roomBlockCoreSchema = z.object({
  propertyId: z.string(),
  roomTypeId: z.string().nullable().optional(),
  roomUnitId: z.string().nullable().optional(),
  startsOn: z.string().date(),
  endsOn: z.string().date(),
  status: hospitalityRoomBlockStatusSchema.default("draft"),
  blockReason: nullableString,
  quantity: z.number().int().min(1).default(1),
  releaseAt: z.string().datetime().nullable().optional(),
  notes: nullableString,
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
})
export const insertRoomBlockSchema = roomBlockCoreSchema
export const updateRoomBlockSchema = roomBlockCoreSchema.partial()
export const roomBlockListQuerySchema = paginationSchema.extend({
  propertyId: z.string().optional(),
  roomTypeId: z.string().optional(),
  roomUnitId: z.string().optional(),
  status: hospitalityRoomBlockStatusSchema.optional(),
  startsOn: nullableDate,
  endsOn: nullableDate,
})

export const roomUnitStatusEventCoreSchema = z.object({
  roomUnitId: z.string(),
  statusCode: z.string().min(1),
  housekeepingStatus: nullableString,
  effectiveFrom: z.string().datetime().nullable().optional(),
  effectiveTo: z.string().datetime().nullable().optional(),
  notes: nullableString,
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
})
export const insertRoomUnitStatusEventSchema = roomUnitStatusEventCoreSchema
export const updateRoomUnitStatusEventSchema = roomUnitStatusEventCoreSchema.partial()
export const roomUnitStatusEventListQuerySchema = paginationSchema.extend({
  roomUnitId: z.string().optional(),
  statusCode: z.string().optional(),
})

export const maintenanceBlockCoreSchema = z.object({
  propertyId: z.string(),
  roomTypeId: z.string().nullable().optional(),
  roomUnitId: z.string().nullable().optional(),
  startsOn: z.string().date(),
  endsOn: z.string().date(),
  status: hospitalityMaintenanceBlockStatusSchema.default("open"),
  reason: nullableString,
  notes: nullableString,
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
})
export const insertMaintenanceBlockSchema = maintenanceBlockCoreSchema
export const updateMaintenanceBlockSchema = maintenanceBlockCoreSchema.partial()
export const maintenanceBlockListQuerySchema = paginationSchema.extend({
  propertyId: z.string().optional(),
  roomTypeId: z.string().optional(),
  roomUnitId: z.string().optional(),
  status: hospitalityMaintenanceBlockStatusSchema.optional(),
  startsOn: nullableDate,
  endsOn: nullableDate,
})

export const housekeepingTaskCoreSchema = z.object({
  propertyId: z.string(),
  roomUnitId: z.string(),
  stayBookingItemId: z.string().nullable().optional(),
  taskType: z.string().min(1),
  status: hospitalityHousekeepingTaskStatusSchema.default("open"),
  priority: z.number().int().default(0),
  dueAt: z.string().datetime().nullable().optional(),
  startedAt: z.string().datetime().nullable().optional(),
  completedAt: z.string().datetime().nullable().optional(),
  assignedTo: nullableString,
  notes: nullableString,
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
})
export const insertHousekeepingTaskSchema = housekeepingTaskCoreSchema
export const updateHousekeepingTaskSchema = housekeepingTaskCoreSchema.partial()
export const housekeepingTaskListQuerySchema = paginationSchema.extend({
  propertyId: z.string().optional(),
  roomUnitId: z.string().optional(),
  stayBookingItemId: z.string().optional(),
  status: hospitalityHousekeepingTaskStatusSchema.optional(),
  taskType: z.string().optional(),
})

export const stayOperationCoreSchema = z.object({
  stayBookingItemId: z.string(),
  propertyId: z.string(),
  roomUnitId: z.string().nullable().optional(),
  operationStatus: stayOperationStatusSchema.default("reserved"),
  expectedArrivalAt: z.string().datetime().nullable().optional(),
  expectedDepartureAt: z.string().datetime().nullable().optional(),
  checkedInAt: z.string().datetime().nullable().optional(),
  checkedOutAt: z.string().datetime().nullable().optional(),
  noShowRecordedAt: z.string().datetime().nullable().optional(),
  notes: nullableString,
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
})
export const insertStayOperationSchema = stayOperationCoreSchema
export const updateStayOperationSchema = stayOperationCoreSchema.partial()
export const stayOperationListQuerySchema = paginationSchema.extend({
  stayBookingItemId: z.string().optional(),
  propertyId: z.string().optional(),
  roomUnitId: z.string().optional(),
  operationStatus: stayOperationStatusSchema.optional(),
})

export const stayCheckpointCoreSchema = z.object({
  stayOperationId: z.string(),
  checkpointType: stayCheckpointTypeSchema.default("note"),
  occurredAt: z.string().datetime().nullable().optional(),
  roomUnitId: z.string().nullable().optional(),
  notes: nullableString,
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
})
export const insertStayCheckpointSchema = stayCheckpointCoreSchema
export const updateStayCheckpointSchema = stayCheckpointCoreSchema.partial()
export const stayCheckpointListQuerySchema = paginationSchema.extend({
  stayOperationId: z.string().optional(),
  checkpointType: stayCheckpointTypeSchema.optional(),
})

export const stayServicePostCoreSchema = z.object({
  stayOperationId: z.string(),
  bookingItemId: z.string().nullable().optional(),
  serviceDate: z.string().date(),
  kind: stayServicePostKindSchema.default("other"),
  description: z.string().min(1),
  quantity: z.number().int().min(1).default(1),
  currencyCode: z.string().length(3),
  sellAmountCents: z.number().int().default(0),
  costAmountCents: nullableMoney,
  notes: nullableString,
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
})
export const insertStayServicePostSchema = stayServicePostCoreSchema
export const updateStayServicePostSchema = stayServicePostCoreSchema.partial()
export const stayServicePostListQuerySchema = paginationSchema.extend({
  stayOperationId: z.string().optional(),
  bookingItemId: z.string().optional(),
  kind: stayServicePostKindSchema.optional(),
  serviceDateFrom: nullableDate,
  serviceDateTo: nullableDate,
})

export const stayFolioCoreSchema = z.object({
  stayOperationId: z.string(),
  currencyCode: z.string().length(3),
  status: stayFolioStatusSchema.default("open"),
  openedAt: z.string().datetime().nullable().optional(),
  closedAt: z.string().datetime().nullable().optional(),
  notes: nullableString,
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
})
export const insertStayFolioSchema = stayFolioCoreSchema
export const updateStayFolioSchema = stayFolioCoreSchema.partial()
export const stayFolioListQuerySchema = paginationSchema.extend({
  stayOperationId: z.string().optional(),
  status: stayFolioStatusSchema.optional(),
})

export const stayFolioLineCoreSchema = z.object({
  stayFolioId: z.string(),
  servicePostId: z.string().nullable().optional(),
  postedAt: z.string().datetime().nullable().optional(),
  lineType: z.string().min(1),
  description: z.string().min(1),
  quantity: z.number().int().min(1).default(1),
  amountCents: z.number().int().default(0),
  taxAmountCents: nullableMoney,
  feeAmountCents: nullableMoney,
  notes: nullableString,
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
})
export const insertStayFolioLineSchema = stayFolioLineCoreSchema
export const updateStayFolioLineSchema = stayFolioLineCoreSchema.partial()
export const stayFolioLineListQuerySchema = paginationSchema.extend({
  stayFolioId: z.string().optional(),
  servicePostId: z.string().optional(),
})
