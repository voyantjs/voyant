import { bookingItems } from "@voyantjs/bookings/schema"
import { typeId, typeIdRef } from "@voyantjs/db/lib/typeid-column"
import { properties } from "@voyantjs/facilities/schema"
import { relations } from "drizzle-orm"
import {
  boolean,
  char,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"

export const hospitalityInventoryModeEnum = pgEnum("hospitality_inventory_mode", [
  "pooled",
  "serialized",
  "virtual",
])

export const roomUnitStatusEnum = pgEnum("room_unit_status", [
  "active",
  "inactive",
  "out_of_order",
  "archived",
])

export const ratePlanChargeFrequencyEnum = pgEnum("rate_plan_charge_frequency", [
  "per_night",
  "per_stay",
  "per_person_per_night",
  "per_person_per_stay",
])

export const hospitalityGuaranteeModeEnum = pgEnum("hospitality_guarantee_mode", [
  "none",
  "card_hold",
  "deposit",
  "full_prepay",
  "on_request",
])

export const stayBookingItemStatusEnum = pgEnum("stay_booking_item_status", [
  "reserved",
  "checked_in",
  "checked_out",
  "cancelled",
  "no_show",
])

export const hospitalityRoomBlockStatusEnum = pgEnum("hospitality_room_block_status", [
  "draft",
  "held",
  "confirmed",
  "released",
  "cancelled",
])

export const hospitalityHousekeepingTaskStatusEnum = pgEnum(
  "hospitality_housekeeping_task_status",
  ["open", "in_progress", "completed", "cancelled"],
)

export const hospitalityMaintenanceBlockStatusEnum = pgEnum(
  "hospitality_maintenance_block_status",
  ["open", "in_progress", "resolved", "cancelled"],
)

export const stayOperationStatusEnum = pgEnum("stay_operation_status", [
  "reserved",
  "expected_arrival",
  "checked_in",
  "checked_out",
  "no_show",
  "cancelled",
])

export const stayCheckpointTypeEnum = pgEnum("stay_checkpoint_type", [
  "arrival",
  "room_assigned",
  "check_in",
  "room_move",
  "charge_posted",
  "check_out",
  "no_show",
  "note",
])

export const stayServicePostKindEnum = pgEnum("stay_service_post_kind", [
  "lodging",
  "meal",
  "minibar",
  "fee",
  "adjustment",
  "other",
])

export const stayFolioStatusEnum = pgEnum("stay_folio_status", [
  "open",
  "closed",
  "transferred",
  "void",
])

export const roomTypes = pgTable(
  "room_types",
  {
    id: typeId("room_types"),
    propertyId: typeIdRef("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    code: text("code"),
    name: text("name").notNull(),
    description: text("description"),
    inventoryMode: hospitalityInventoryModeEnum("inventory_mode").notNull().default("pooled"),
    roomClass: text("room_class"),
    maxAdults: integer("max_adults"),
    maxChildren: integer("max_children"),
    maxInfants: integer("max_infants"),
    standardOccupancy: integer("standard_occupancy"),
    maxOccupancy: integer("max_occupancy"),
    minOccupancy: integer("min_occupancy"),
    bedroomCount: integer("bedroom_count"),
    bathroomCount: integer("bathroom_count"),
    areaValue: integer("area_value"),
    areaUnit: text("area_unit"),
    accessibilityNotes: text("accessibility_notes"),
    smokingAllowed: boolean("smoking_allowed").notNull().default(false),
    active: boolean("active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_room_types_property").on(table.propertyId),
    index("idx_room_types_active").on(table.active),
    index("idx_room_types_inventory_mode").on(table.inventoryMode),
    uniqueIndex("uidx_room_types_property_code").on(table.propertyId, table.code),
  ],
)

export const roomTypeBedConfigs = pgTable(
  "room_type_bed_configs",
  {
    id: typeId("room_type_bed_configs"),
    roomTypeId: typeIdRef("room_type_id")
      .notNull()
      .references(() => roomTypes.id, { onDelete: "cascade" }),
    bedType: text("bed_type").notNull(),
    quantity: integer("quantity").notNull().default(1),
    isPrimary: boolean("is_primary").notNull().default(false),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_room_type_bed_configs_room_type").on(table.roomTypeId),
    index("idx_room_type_bed_configs_primary").on(table.isPrimary),
  ],
)

export const roomUnits = pgTable(
  "room_units",
  {
    id: typeId("room_units"),
    propertyId: typeIdRef("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    roomTypeId: typeIdRef("room_type_id")
      .notNull()
      .references(() => roomTypes.id, { onDelete: "cascade" }),
    code: text("code"),
    roomNumber: text("room_number"),
    floor: text("floor"),
    wing: text("wing"),
    status: roomUnitStatusEnum("status").notNull().default("active"),
    viewCode: text("view_code"),
    accessibilityCode: text("accessibility_code"),
    genderRestriction: text("gender_restriction"),
    notes: text("notes"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_room_units_property").on(table.propertyId),
    index("idx_room_units_room_type").on(table.roomTypeId),
    index("idx_room_units_status").on(table.status),
    uniqueIndex("uidx_room_units_property_code").on(table.propertyId, table.code),
  ],
)

export const mealPlans = pgTable(
  "meal_plans",
  {
    id: typeId("meal_plans"),
    propertyId: typeIdRef("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    includesBreakfast: boolean("includes_breakfast").notNull().default(false),
    includesLunch: boolean("includes_lunch").notNull().default(false),
    includesDinner: boolean("includes_dinner").notNull().default(false),
    includesDrinks: boolean("includes_drinks").notNull().default(false),
    active: boolean("active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_meal_plans_property").on(table.propertyId),
    index("idx_meal_plans_active").on(table.active),
    uniqueIndex("uidx_meal_plans_property_code").on(table.propertyId, table.code),
  ],
)

export const ratePlans = pgTable(
  "rate_plans",
  {
    id: typeId("rate_plans"),
    propertyId: typeIdRef("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    mealPlanId: typeIdRef("meal_plan_id").references(() => mealPlans.id, { onDelete: "set null" }),
    priceCatalogId: text("price_catalog_id"),
    cancellationPolicyId: text("cancellation_policy_id"),
    marketId: text("market_id"),
    currencyCode: text("currency_code").notNull(),
    chargeFrequency: ratePlanChargeFrequencyEnum("charge_frequency").notNull().default("per_night"),
    guaranteeMode: hospitalityGuaranteeModeEnum("guarantee_mode").notNull().default("none"),
    commissionable: boolean("commissionable").notNull().default(true),
    refundable: boolean("refundable").notNull().default(true),
    active: boolean("active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_rate_plans_property").on(table.propertyId),
    index("idx_rate_plans_meal_plan").on(table.mealPlanId),
    index("idx_rate_plans_catalog").on(table.priceCatalogId),
    index("idx_rate_plans_policy").on(table.cancellationPolicyId),
    index("idx_rate_plans_market").on(table.marketId),
    index("idx_rate_plans_active").on(table.active),
    uniqueIndex("uidx_rate_plans_property_code").on(table.propertyId, table.code),
  ],
)

export const ratePlanRoomTypes = pgTable(
  "rate_plan_room_types",
  {
    id: typeId("rate_plan_room_types"),
    ratePlanId: typeIdRef("rate_plan_id")
      .notNull()
      .references(() => ratePlans.id, { onDelete: "cascade" }),
    roomTypeId: typeIdRef("room_type_id")
      .notNull()
      .references(() => roomTypes.id, { onDelete: "cascade" }),
    productId: text("product_id"),
    optionId: text("option_id"),
    unitId: text("unit_id"),
    active: boolean("active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_rate_plan_room_types_rate_plan").on(table.ratePlanId),
    index("idx_rate_plan_room_types_room_type").on(table.roomTypeId),
    index("idx_rate_plan_room_types_product").on(table.productId),
    index("idx_rate_plan_room_types_option").on(table.optionId),
    index("idx_rate_plan_room_types_unit").on(table.unitId),
    uniqueIndex("uidx_rate_plan_room_types_pair").on(table.ratePlanId, table.roomTypeId),
  ],
)

export const stayRules = pgTable(
  "stay_rules",
  {
    id: typeId("stay_rules"),
    propertyId: typeIdRef("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    ratePlanId: typeIdRef("rate_plan_id").references(() => ratePlans.id, { onDelete: "cascade" }),
    roomTypeId: typeIdRef("room_type_id").references(() => roomTypes.id, { onDelete: "cascade" }),
    validFrom: date("valid_from"),
    validTo: date("valid_to"),
    minNights: integer("min_nights"),
    maxNights: integer("max_nights"),
    minAdvanceDays: integer("min_advance_days"),
    maxAdvanceDays: integer("max_advance_days"),
    closedToArrival: boolean("closed_to_arrival").notNull().default(false),
    closedToDeparture: boolean("closed_to_departure").notNull().default(false),
    arrivalWeekdays: jsonb("arrival_weekdays").$type<string[]>(),
    departureWeekdays: jsonb("departure_weekdays").$type<string[]>(),
    releaseDays: integer("release_days"),
    active: boolean("active").notNull().default(true),
    priority: integer("priority").notNull().default(0),
    notes: text("notes"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_stay_rules_property").on(table.propertyId),
    index("idx_stay_rules_rate_plan").on(table.ratePlanId),
    index("idx_stay_rules_room_type").on(table.roomTypeId),
    index("idx_stay_rules_active").on(table.active),
  ],
)

export const roomInventory = pgTable(
  "room_inventory",
  {
    id: typeId("room_inventory"),
    propertyId: typeIdRef("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    roomTypeId: typeIdRef("room_type_id")
      .notNull()
      .references(() => roomTypes.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    totalUnits: integer("total_units").notNull().default(0),
    availableUnits: integer("available_units").notNull().default(0),
    heldUnits: integer("held_units").notNull().default(0),
    soldUnits: integer("sold_units").notNull().default(0),
    outOfOrderUnits: integer("out_of_order_units").notNull().default(0),
    overbookLimit: integer("overbook_limit"),
    stopSell: boolean("stop_sell").notNull().default(false),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_room_inventory_property").on(table.propertyId),
    index("idx_room_inventory_room_type").on(table.roomTypeId),
    index("idx_room_inventory_date").on(table.date),
    uniqueIndex("uidx_room_inventory_room_type_date").on(table.roomTypeId, table.date),
  ],
)

export const ratePlanInventoryOverrides = pgTable(
  "rate_plan_inventory_overrides",
  {
    id: typeId("rate_plan_inventory_overrides"),
    ratePlanId: typeIdRef("rate_plan_id")
      .notNull()
      .references(() => ratePlans.id, { onDelete: "cascade" }),
    roomTypeId: typeIdRef("room_type_id")
      .notNull()
      .references(() => roomTypes.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    stopSell: boolean("stop_sell").notNull().default(false),
    closedToArrival: boolean("closed_to_arrival").notNull().default(false),
    closedToDeparture: boolean("closed_to_departure").notNull().default(false),
    minNightsOverride: integer("min_nights_override"),
    maxNightsOverride: integer("max_nights_override"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_rate_plan_inventory_overrides_rate_plan").on(table.ratePlanId),
    index("idx_rate_plan_inventory_overrides_room_type").on(table.roomTypeId),
    index("idx_rate_plan_inventory_overrides_date").on(table.date),
    uniqueIndex("uidx_rate_plan_inventory_overrides_unique").on(
      table.ratePlanId,
      table.roomTypeId,
      table.date,
    ),
  ],
)

export const stayBookingItems = pgTable(
  "stay_booking_items",
  {
    id: typeId("stay_booking_items"),
    bookingItemId: typeIdRef("booking_item_id")
      .notNull()
      .references(() => bookingItems.id, { onDelete: "cascade" }),
    propertyId: typeIdRef("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    roomTypeId: typeIdRef("room_type_id")
      .notNull()
      .references(() => roomTypes.id, { onDelete: "cascade" }),
    roomUnitId: typeIdRef("room_unit_id").references(() => roomUnits.id, { onDelete: "set null" }),
    ratePlanId: typeIdRef("rate_plan_id")
      .notNull()
      .references(() => ratePlans.id, { onDelete: "cascade" }),
    checkInDate: date("check_in_date").notNull(),
    checkOutDate: date("check_out_date").notNull(),
    nightCount: integer("night_count").notNull().default(1),
    roomCount: integer("room_count").notNull().default(1),
    adults: integer("adults").notNull().default(1),
    children: integer("children").notNull().default(0),
    infants: integer("infants").notNull().default(0),
    mealPlanId: typeIdRef("meal_plan_id").references(() => mealPlans.id, { onDelete: "set null" }),
    confirmationCode: text("confirmation_code"),
    voucherCode: text("voucher_code"),
    status: stayBookingItemStatusEnum("status").notNull().default("reserved"),
    notes: text("notes"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_stay_booking_items_booking_item").on(table.bookingItemId),
    index("idx_stay_booking_items_property").on(table.propertyId),
    index("idx_stay_booking_items_room_type").on(table.roomTypeId),
    index("idx_stay_booking_items_room_unit").on(table.roomUnitId),
    index("idx_stay_booking_items_rate_plan").on(table.ratePlanId),
    uniqueIndex("uidx_stay_booking_items_booking_item").on(table.bookingItemId),
  ],
)

export const stayDailyRates = pgTable(
  "stay_daily_rates",
  {
    id: typeId("stay_daily_rates"),
    stayBookingItemId: typeIdRef("stay_booking_item_id")
      .notNull()
      .references(() => stayBookingItems.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    sellCurrency: text("sell_currency").notNull(),
    sellAmountCents: integer("sell_amount_cents"),
    costCurrency: text("cost_currency"),
    costAmountCents: integer("cost_amount_cents"),
    taxAmountCents: integer("tax_amount_cents"),
    feeAmountCents: integer("fee_amount_cents"),
    commissionAmountCents: integer("commission_amount_cents"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_stay_daily_rates_stay_booking_item").on(table.stayBookingItemId),
    index("idx_stay_daily_rates_date").on(table.date),
    uniqueIndex("uidx_stay_daily_rates_item_date").on(table.stayBookingItemId, table.date),
  ],
)

export const roomTypeRates = pgTable(
  "room_type_rates",
  {
    id: typeId("room_type_rates"),
    ratePlanId: typeIdRef("rate_plan_id")
      .notNull()
      .references(() => ratePlans.id, { onDelete: "cascade" }),
    roomTypeId: typeIdRef("room_type_id")
      .notNull()
      .references(() => roomTypes.id, { onDelete: "cascade" }),
    priceScheduleId: text("price_schedule_id"),
    currencyCode: char("currency_code", { length: 3 }).notNull(),
    baseAmountCents: integer("base_amount_cents"),
    extraAdultAmountCents: integer("extra_adult_amount_cents"),
    extraChildAmountCents: integer("extra_child_amount_cents"),
    extraInfantAmountCents: integer("extra_infant_amount_cents"),
    active: boolean("active").notNull().default(true),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_room_type_rates_rate_plan").on(table.ratePlanId),
    index("idx_room_type_rates_room_type").on(table.roomTypeId),
    index("idx_room_type_rates_price_schedule").on(table.priceScheduleId),
    index("idx_room_type_rates_active").on(table.active),
    uniqueIndex("uidx_room_type_rates_plan_room_schedule").on(
      table.ratePlanId,
      table.roomTypeId,
      table.priceScheduleId,
    ),
  ],
)

export const roomBlocks = pgTable(
  "room_blocks",
  {
    id: typeId("room_blocks"),
    propertyId: typeIdRef("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    roomTypeId: typeIdRef("room_type_id").references(() => roomTypes.id, { onDelete: "set null" }),
    roomUnitId: typeIdRef("room_unit_id").references(() => roomUnits.id, { onDelete: "set null" }),
    startsOn: date("starts_on").notNull(),
    endsOn: date("ends_on").notNull(),
    status: hospitalityRoomBlockStatusEnum("status").notNull().default("draft"),
    blockReason: text("block_reason"),
    quantity: integer("quantity").notNull().default(1),
    releaseAt: timestamp("release_at", { withTimezone: true }),
    notes: text("notes"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_room_blocks_property").on(table.propertyId),
    index("idx_room_blocks_room_type").on(table.roomTypeId),
    index("idx_room_blocks_room_unit").on(table.roomUnitId),
    index("idx_room_blocks_status").on(table.status),
    index("idx_room_blocks_dates").on(table.startsOn, table.endsOn),
  ],
)

export const roomUnitStatusEvents = pgTable(
  "room_unit_status_events",
  {
    id: typeId("room_unit_status_events"),
    roomUnitId: typeIdRef("room_unit_id")
      .notNull()
      .references(() => roomUnits.id, { onDelete: "cascade" }),
    statusCode: text("status_code").notNull(),
    housekeepingStatus: text("housekeeping_status"),
    effectiveFrom: timestamp("effective_from", { withTimezone: true }).notNull().defaultNow(),
    effectiveTo: timestamp("effective_to", { withTimezone: true }),
    notes: text("notes"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_room_unit_status_events_room_unit").on(table.roomUnitId),
    index("idx_room_unit_status_events_status").on(table.statusCode),
    index("idx_room_unit_status_events_effective_from").on(table.effectiveFrom),
  ],
)

export const maintenanceBlocks = pgTable(
  "maintenance_blocks",
  {
    id: typeId("maintenance_blocks"),
    propertyId: typeIdRef("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    roomTypeId: typeIdRef("room_type_id").references(() => roomTypes.id, { onDelete: "set null" }),
    roomUnitId: typeIdRef("room_unit_id").references(() => roomUnits.id, { onDelete: "set null" }),
    startsOn: date("starts_on").notNull(),
    endsOn: date("ends_on").notNull(),
    status: hospitalityMaintenanceBlockStatusEnum("status").notNull().default("open"),
    reason: text("reason"),
    notes: text("notes"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_maintenance_blocks_property").on(table.propertyId),
    index("idx_maintenance_blocks_room_type").on(table.roomTypeId),
    index("idx_maintenance_blocks_room_unit").on(table.roomUnitId),
    index("idx_maintenance_blocks_status").on(table.status),
    index("idx_maintenance_blocks_dates").on(table.startsOn, table.endsOn),
  ],
)

export const housekeepingTasks = pgTable(
  "housekeeping_tasks",
  {
    id: typeId("housekeeping_tasks"),
    propertyId: typeIdRef("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    roomUnitId: typeIdRef("room_unit_id")
      .notNull()
      .references(() => roomUnits.id, { onDelete: "cascade" }),
    stayBookingItemId: typeIdRef("stay_booking_item_id").references(() => stayBookingItems.id, {
      onDelete: "set null",
    }),
    taskType: text("task_type").notNull(),
    status: hospitalityHousekeepingTaskStatusEnum("status").notNull().default("open"),
    priority: integer("priority").notNull().default(0),
    dueAt: timestamp("due_at", { withTimezone: true }),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    assignedTo: text("assigned_to"),
    notes: text("notes"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_housekeeping_tasks_property").on(table.propertyId),
    index("idx_housekeeping_tasks_room_unit").on(table.roomUnitId),
    index("idx_housekeeping_tasks_stay_booking_item").on(table.stayBookingItemId),
    index("idx_housekeeping_tasks_status").on(table.status),
    index("idx_housekeeping_tasks_due_at").on(table.dueAt),
  ],
)

export const stayOperations = pgTable(
  "stay_operations",
  {
    id: typeId("stay_operations"),
    stayBookingItemId: typeIdRef("stay_booking_item_id")
      .notNull()
      .references(() => stayBookingItems.id, { onDelete: "cascade" }),
    propertyId: typeIdRef("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    roomUnitId: typeIdRef("room_unit_id").references(() => roomUnits.id, { onDelete: "set null" }),
    operationStatus: stayOperationStatusEnum("operation_status").notNull().default("reserved"),
    expectedArrivalAt: timestamp("expected_arrival_at", { withTimezone: true }),
    expectedDepartureAt: timestamp("expected_departure_at", { withTimezone: true }),
    checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
    checkedOutAt: timestamp("checked_out_at", { withTimezone: true }),
    noShowRecordedAt: timestamp("no_show_recorded_at", { withTimezone: true }),
    notes: text("notes"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("uidx_stay_operations_stay_booking_item").on(table.stayBookingItemId),
    index("idx_stay_operations_property").on(table.propertyId),
    index("idx_stay_operations_room_unit").on(table.roomUnitId),
    index("idx_stay_operations_status").on(table.operationStatus),
  ],
)

export const stayCheckpoints = pgTable(
  "stay_checkpoints",
  {
    id: typeId("stay_checkpoints"),
    stayOperationId: typeIdRef("stay_operation_id")
      .notNull()
      .references(() => stayOperations.id, { onDelete: "cascade" }),
    checkpointType: stayCheckpointTypeEnum("checkpoint_type").notNull().default("note"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
    roomUnitId: typeIdRef("room_unit_id").references(() => roomUnits.id, { onDelete: "set null" }),
    notes: text("notes"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_stay_checkpoints_operation").on(table.stayOperationId),
    index("idx_stay_checkpoints_type").on(table.checkpointType),
    index("idx_stay_checkpoints_occurred_at").on(table.occurredAt),
  ],
)

export const stayServicePosts = pgTable(
  "stay_service_posts",
  {
    id: typeId("stay_service_posts"),
    stayOperationId: typeIdRef("stay_operation_id")
      .notNull()
      .references(() => stayOperations.id, { onDelete: "cascade" }),
    bookingItemId: typeIdRef("booking_item_id").references(() => bookingItems.id, {
      onDelete: "set null",
    }),
    serviceDate: date("service_date").notNull(),
    kind: stayServicePostKindEnum("kind").notNull().default("other"),
    description: text("description").notNull(),
    quantity: integer("quantity").notNull().default(1),
    currencyCode: text("currency_code").notNull(),
    sellAmountCents: integer("sell_amount_cents").notNull().default(0),
    costAmountCents: integer("cost_amount_cents"),
    notes: text("notes"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_stay_service_posts_operation").on(table.stayOperationId),
    index("idx_stay_service_posts_booking_item").on(table.bookingItemId),
    index("idx_stay_service_posts_service_date").on(table.serviceDate),
    index("idx_stay_service_posts_kind").on(table.kind),
  ],
)

export const stayFolios = pgTable(
  "stay_folios",
  {
    id: typeId("stay_folios"),
    stayOperationId: typeIdRef("stay_operation_id")
      .notNull()
      .references(() => stayOperations.id, { onDelete: "cascade" }),
    currencyCode: text("currency_code").notNull(),
    status: stayFolioStatusEnum("status").notNull().default("open"),
    openedAt: timestamp("opened_at", { withTimezone: true }).notNull().defaultNow(),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    notes: text("notes"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_stay_folios_operation").on(table.stayOperationId),
    index("idx_stay_folios_status").on(table.status),
  ],
)

export const stayFolioLines = pgTable(
  "stay_folio_lines",
  {
    id: typeId("stay_folio_lines"),
    stayFolioId: typeIdRef("stay_folio_id")
      .notNull()
      .references(() => stayFolios.id, { onDelete: "cascade" }),
    servicePostId: typeIdRef("service_post_id").references(() => stayServicePosts.id, {
      onDelete: "set null",
    }),
    postedAt: timestamp("posted_at", { withTimezone: true }).notNull().defaultNow(),
    lineType: text("line_type").notNull(),
    description: text("description").notNull(),
    quantity: integer("quantity").notNull().default(1),
    amountCents: integer("amount_cents").notNull().default(0),
    taxAmountCents: integer("tax_amount_cents"),
    feeAmountCents: integer("fee_amount_cents"),
    notes: text("notes"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_stay_folio_lines_folio").on(table.stayFolioId),
    index("idx_stay_folio_lines_service_post").on(table.servicePostId),
    index("idx_stay_folio_lines_posted_at").on(table.postedAt),
  ],
)

export type RoomType = typeof roomTypes.$inferSelect
export type NewRoomType = typeof roomTypes.$inferInsert
export type RoomTypeBedConfig = typeof roomTypeBedConfigs.$inferSelect
export type NewRoomTypeBedConfig = typeof roomTypeBedConfigs.$inferInsert
export type RoomUnit = typeof roomUnits.$inferSelect
export type NewRoomUnit = typeof roomUnits.$inferInsert
export type MealPlan = typeof mealPlans.$inferSelect
export type NewMealPlan = typeof mealPlans.$inferInsert
export type RatePlan = typeof ratePlans.$inferSelect
export type NewRatePlan = typeof ratePlans.$inferInsert
export type RatePlanRoomType = typeof ratePlanRoomTypes.$inferSelect
export type NewRatePlanRoomType = typeof ratePlanRoomTypes.$inferInsert
export type StayRule = typeof stayRules.$inferSelect
export type NewStayRule = typeof stayRules.$inferInsert
export type RoomInventory = typeof roomInventory.$inferSelect
export type NewRoomInventory = typeof roomInventory.$inferInsert
export type RatePlanInventoryOverride = typeof ratePlanInventoryOverrides.$inferSelect
export type NewRatePlanInventoryOverride = typeof ratePlanInventoryOverrides.$inferInsert
export type StayBookingItem = typeof stayBookingItems.$inferSelect
export type NewStayBookingItem = typeof stayBookingItems.$inferInsert
export type StayDailyRate = typeof stayDailyRates.$inferSelect
export type NewStayDailyRate = typeof stayDailyRates.$inferInsert
export type RoomTypeRate = typeof roomTypeRates.$inferSelect
export type NewRoomTypeRate = typeof roomTypeRates.$inferInsert
export type RoomBlock = typeof roomBlocks.$inferSelect
export type NewRoomBlock = typeof roomBlocks.$inferInsert
export type RoomUnitStatusEvent = typeof roomUnitStatusEvents.$inferSelect
export type NewRoomUnitStatusEvent = typeof roomUnitStatusEvents.$inferInsert
export type MaintenanceBlock = typeof maintenanceBlocks.$inferSelect
export type NewMaintenanceBlock = typeof maintenanceBlocks.$inferInsert
export type HousekeepingTask = typeof housekeepingTasks.$inferSelect
export type NewHousekeepingTask = typeof housekeepingTasks.$inferInsert
export type StayOperation = typeof stayOperations.$inferSelect
export type NewStayOperation = typeof stayOperations.$inferInsert
export type StayCheckpoint = typeof stayCheckpoints.$inferSelect
export type NewStayCheckpoint = typeof stayCheckpoints.$inferInsert
export type StayServicePost = typeof stayServicePosts.$inferSelect
export type NewStayServicePost = typeof stayServicePosts.$inferInsert
export type StayFolio = typeof stayFolios.$inferSelect
export type NewStayFolio = typeof stayFolios.$inferInsert
export type StayFolioLine = typeof stayFolioLines.$inferSelect
export type NewStayFolioLine = typeof stayFolioLines.$inferInsert

export const roomTypesRelations = relations(roomTypes, ({ one, many }) => ({
  property: one(properties, { fields: [roomTypes.propertyId], references: [properties.id] }),
  bedConfigs: many(roomTypeBedConfigs),
  roomUnits: many(roomUnits),
  ratePlanRoomTypes: many(ratePlanRoomTypes),
  roomTypeRates: many(roomTypeRates),
  stayRules: many(stayRules),
  inventory: many(roomInventory),
  inventoryOverrides: many(ratePlanInventoryOverrides),
  stayBookingItems: many(stayBookingItems),
}))

export const roomTypeBedConfigsRelations = relations(roomTypeBedConfigs, ({ one }) => ({
  roomType: one(roomTypes, {
    fields: [roomTypeBedConfigs.roomTypeId],
    references: [roomTypes.id],
  }),
}))

export const roomUnitsRelations = relations(roomUnits, ({ one, many }) => ({
  property: one(properties, { fields: [roomUnits.propertyId], references: [properties.id] }),
  roomType: one(roomTypes, { fields: [roomUnits.roomTypeId], references: [roomTypes.id] }),
  stayBookingItems: many(stayBookingItems),
  roomBlocks: many(roomBlocks),
  statusEvents: many(roomUnitStatusEvents),
  maintenanceBlocks: many(maintenanceBlocks),
  housekeepingTasks: many(housekeepingTasks),
  stayOperations: many(stayOperations),
  stayCheckpoints: many(stayCheckpoints),
}))

export const mealPlansRelations = relations(mealPlans, ({ one, many }) => ({
  property: one(properties, { fields: [mealPlans.propertyId], references: [properties.id] }),
  ratePlans: many(ratePlans),
  stayBookingItems: many(stayBookingItems),
}))

export const ratePlansRelations = relations(ratePlans, ({ one, many }) => ({
  property: one(properties, { fields: [ratePlans.propertyId], references: [properties.id] }),
  mealPlan: one(mealPlans, { fields: [ratePlans.mealPlanId], references: [mealPlans.id] }),
  roomTypes: many(ratePlanRoomTypes),
  roomTypeRates: many(roomTypeRates),
  stayRules: many(stayRules),
  inventoryOverrides: many(ratePlanInventoryOverrides),
  stayBookingItems: many(stayBookingItems),
}))

export const ratePlanRoomTypesRelations = relations(ratePlanRoomTypes, ({ one }) => ({
  ratePlan: one(ratePlans, {
    fields: [ratePlanRoomTypes.ratePlanId],
    references: [ratePlans.id],
  }),
  roomType: one(roomTypes, {
    fields: [ratePlanRoomTypes.roomTypeId],
    references: [roomTypes.id],
  }),
}))

export const stayRulesRelations = relations(stayRules, ({ one }) => ({
  property: one(properties, { fields: [stayRules.propertyId], references: [properties.id] }),
  ratePlan: one(ratePlans, { fields: [stayRules.ratePlanId], references: [ratePlans.id] }),
  roomType: one(roomTypes, { fields: [stayRules.roomTypeId], references: [roomTypes.id] }),
}))

export const roomInventoryRelations = relations(roomInventory, ({ one }) => ({
  property: one(properties, { fields: [roomInventory.propertyId], references: [properties.id] }),
  roomType: one(roomTypes, { fields: [roomInventory.roomTypeId], references: [roomTypes.id] }),
}))

export const ratePlanInventoryOverridesRelations = relations(
  ratePlanInventoryOverrides,
  ({ one }) => ({
    ratePlan: one(ratePlans, {
      fields: [ratePlanInventoryOverrides.ratePlanId],
      references: [ratePlans.id],
    }),
    roomType: one(roomTypes, {
      fields: [ratePlanInventoryOverrides.roomTypeId],
      references: [roomTypes.id],
    }),
  }),
)

export const roomTypeRatesRelations = relations(roomTypeRates, ({ one }) => ({
  ratePlan: one(ratePlans, {
    fields: [roomTypeRates.ratePlanId],
    references: [ratePlans.id],
  }),
  roomType: one(roomTypes, {
    fields: [roomTypeRates.roomTypeId],
    references: [roomTypes.id],
  }),
}))

export const stayBookingItemsRelations = relations(stayBookingItems, ({ one, many }) => ({
  bookingItem: one(bookingItems, {
    fields: [stayBookingItems.bookingItemId],
    references: [bookingItems.id],
  }),
  property: one(properties, {
    fields: [stayBookingItems.propertyId],
    references: [properties.id],
  }),
  roomType: one(roomTypes, { fields: [stayBookingItems.roomTypeId], references: [roomTypes.id] }),
  roomUnit: one(roomUnits, { fields: [stayBookingItems.roomUnitId], references: [roomUnits.id] }),
  ratePlan: one(ratePlans, { fields: [stayBookingItems.ratePlanId], references: [ratePlans.id] }),
  mealPlan: one(mealPlans, { fields: [stayBookingItems.mealPlanId], references: [mealPlans.id] }),
  dailyRates: many(stayDailyRates),
  housekeepingTasks: many(housekeepingTasks),
  operations: many(stayOperations),
}))

export const stayDailyRatesRelations = relations(stayDailyRates, ({ one }) => ({
  stayBookingItem: one(stayBookingItems, {
    fields: [stayDailyRates.stayBookingItemId],
    references: [stayBookingItems.id],
  }),
}))

export const roomBlocksRelations = relations(roomBlocks, ({ one }) => ({
  property: one(properties, { fields: [roomBlocks.propertyId], references: [properties.id] }),
  roomType: one(roomTypes, { fields: [roomBlocks.roomTypeId], references: [roomTypes.id] }),
  roomUnit: one(roomUnits, { fields: [roomBlocks.roomUnitId], references: [roomUnits.id] }),
}))

export const roomUnitStatusEventsRelations = relations(roomUnitStatusEvents, ({ one }) => ({
  roomUnit: one(roomUnits, {
    fields: [roomUnitStatusEvents.roomUnitId],
    references: [roomUnits.id],
  }),
}))

export const maintenanceBlocksRelations = relations(maintenanceBlocks, ({ one }) => ({
  property: one(properties, {
    fields: [maintenanceBlocks.propertyId],
    references: [properties.id],
  }),
  roomType: one(roomTypes, {
    fields: [maintenanceBlocks.roomTypeId],
    references: [roomTypes.id],
  }),
  roomUnit: one(roomUnits, {
    fields: [maintenanceBlocks.roomUnitId],
    references: [roomUnits.id],
  }),
}))

export const housekeepingTasksRelations = relations(housekeepingTasks, ({ one }) => ({
  property: one(properties, {
    fields: [housekeepingTasks.propertyId],
    references: [properties.id],
  }),
  roomUnit: one(roomUnits, {
    fields: [housekeepingTasks.roomUnitId],
    references: [roomUnits.id],
  }),
  stayBookingItem: one(stayBookingItems, {
    fields: [housekeepingTasks.stayBookingItemId],
    references: [stayBookingItems.id],
  }),
}))

export const stayOperationsRelations = relations(stayOperations, ({ one, many }) => ({
  stayBookingItem: one(stayBookingItems, {
    fields: [stayOperations.stayBookingItemId],
    references: [stayBookingItems.id],
  }),
  property: one(properties, {
    fields: [stayOperations.propertyId],
    references: [properties.id],
  }),
  roomUnit: one(roomUnits, { fields: [stayOperations.roomUnitId], references: [roomUnits.id] }),
  checkpoints: many(stayCheckpoints),
  servicePosts: many(stayServicePosts),
  folios: many(stayFolios),
}))

export const stayCheckpointsRelations = relations(stayCheckpoints, ({ one }) => ({
  stayOperation: one(stayOperations, {
    fields: [stayCheckpoints.stayOperationId],
    references: [stayOperations.id],
  }),
  roomUnit: one(roomUnits, { fields: [stayCheckpoints.roomUnitId], references: [roomUnits.id] }),
}))

export const stayServicePostsRelations = relations(stayServicePosts, ({ one, many }) => ({
  stayOperation: one(stayOperations, {
    fields: [stayServicePosts.stayOperationId],
    references: [stayOperations.id],
  }),
  bookingItem: one(bookingItems, {
    fields: [stayServicePosts.bookingItemId],
    references: [bookingItems.id],
  }),
  folioLines: many(stayFolioLines),
}))

export const stayFoliosRelations = relations(stayFolios, ({ one, many }) => ({
  stayOperation: one(stayOperations, {
    fields: [stayFolios.stayOperationId],
    references: [stayOperations.id],
  }),
  lines: many(stayFolioLines),
}))

export const stayFolioLinesRelations = relations(stayFolioLines, ({ one }) => ({
  stayFolio: one(stayFolios, {
    fields: [stayFolioLines.stayFolioId],
    references: [stayFolios.id],
  }),
  servicePost: one(stayServicePosts, {
    fields: [stayFolioLines.servicePostId],
    references: [stayServicePosts.id],
  }),
}))
