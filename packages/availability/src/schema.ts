import { typeId, typeIdRef } from "@voyantjs/db/lib/typeid-column"
import { relations } from "drizzle-orm"
import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

export const availabilitySlotStatusEnum = pgEnum("availability_slot_status", [
  "open",
  "closed",
  "sold_out",
  "cancelled",
])

export const meetingModeEnum = pgEnum("meeting_mode", [
  "meeting_only",
  "pickup_only",
  "meet_or_pickup",
])

export const pickupGroupKindEnum = pgEnum("pickup_group_kind", ["pickup", "dropoff", "meeting"])

export const pickupTimingModeEnum = pgEnum("pickup_timing_mode", [
  "fixed_time",
  "offset_from_start",
])

export const availabilityRules = pgTable(
  "availability_rules",
  {
    id: typeId("availability_rules"),
    productId: text("product_id").notNull(),
    optionId: text("option_id"),
    facilityId: text("facility_id"),
    timezone: text("timezone").notNull(),
    recurrenceRule: text("recurrence_rule").notNull(),
    maxCapacity: integer("max_capacity").notNull(),
    maxPickupCapacity: integer("max_pickup_capacity"),
    minTotalPax: integer("min_total_pax"),
    cutoffMinutes: integer("cutoff_minutes"),
    earlyBookingLimitMinutes: integer("early_booking_limit_minutes"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_availability_rules_product").on(table.productId),
    index("idx_availability_rules_option").on(table.optionId),
    index("idx_availability_rules_facility").on(table.facilityId),
    index("idx_availability_rules_active").on(table.active),
  ],
)

export const availabilityStartTimes = pgTable(
  "availability_start_times",
  {
    id: typeId("availability_start_times"),
    productId: text("product_id").notNull(),
    optionId: text("option_id"),
    facilityId: text("facility_id"),
    label: text("label"),
    startTimeLocal: text("start_time_local").notNull(),
    durationMinutes: integer("duration_minutes"),
    sortOrder: integer("sort_order").notNull().default(0),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_availability_start_times_product").on(table.productId),
    index("idx_availability_start_times_option").on(table.optionId),
    index("idx_availability_start_times_facility").on(table.facilityId),
    index("idx_availability_start_times_active").on(table.active),
  ],
)

export const availabilitySlots = pgTable(
  "availability_slots",
  {
    id: typeId("availability_slots"),
    productId: text("product_id").notNull(),
    optionId: text("option_id"),
    facilityId: text("facility_id"),
    availabilityRuleId: typeIdRef("availability_rule_id").references(() => availabilityRules.id, {
      onDelete: "set null",
    }),
    startTimeId: typeIdRef("start_time_id").references(() => availabilityStartTimes.id, {
      onDelete: "set null",
    }),
    dateLocal: date("date_local").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    timezone: text("timezone").notNull(),
    status: availabilitySlotStatusEnum("status").notNull().default("open"),
    unlimited: boolean("unlimited").notNull().default(false),
    initialPax: integer("initial_pax"),
    remainingPax: integer("remaining_pax"),
    initialPickups: integer("initial_pickups"),
    remainingPickups: integer("remaining_pickups"),
    remainingResources: integer("remaining_resources"),
    pastCutoff: boolean("past_cutoff").notNull().default(false),
    tooEarly: boolean("too_early").notNull().default(false),
    nights: integer("nights"),
    days: integer("days"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_availability_slots_product").on(table.productId),
    index("idx_availability_slots_option").on(table.optionId),
    index("idx_availability_slots_facility").on(table.facilityId),
    index("idx_availability_slots_rule").on(table.availabilityRuleId),
    index("idx_availability_slots_start_time").on(table.startTimeId),
    index("idx_availability_slots_date").on(table.dateLocal),
    index("idx_availability_slots_status").on(table.status),
  ],
)

export const availabilityCloseouts = pgTable(
  "availability_closeouts",
  {
    id: typeId("availability_closeouts"),
    productId: text("product_id").notNull(),
    slotId: typeIdRef("slot_id").references(() => availabilitySlots.id, { onDelete: "set null" }),
    dateLocal: date("date_local").notNull(),
    reason: text("reason"),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_availability_closeouts_product").on(table.productId),
    index("idx_availability_closeouts_slot").on(table.slotId),
    index("idx_availability_closeouts_date").on(table.dateLocal),
  ],
)

export const availabilityPickupPoints = pgTable(
  "availability_pickup_points",
  {
    id: typeId("availability_pickup_points"),
    productId: text("product_id").notNull(),
    facilityId: text("facility_id"),
    name: text("name").notNull(),
    description: text("description"),
    locationText: text("location_text"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_availability_pickup_points_product").on(table.productId),
    index("idx_availability_pickup_points_facility").on(table.facilityId),
    index("idx_availability_pickup_points_active").on(table.active),
  ],
)

export const availabilitySlotPickups = pgTable(
  "availability_slot_pickups",
  {
    id: typeId("availability_slot_pickups"),
    slotId: typeIdRef("slot_id")
      .notNull()
      .references(() => availabilitySlots.id, { onDelete: "cascade" }),
    pickupPointId: typeIdRef("pickup_point_id")
      .notNull()
      .references(() => availabilityPickupPoints.id, { onDelete: "cascade" }),
    initialCapacity: integer("initial_capacity"),
    remainingCapacity: integer("remaining_capacity"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_availability_slot_pickups_slot").on(table.slotId),
    index("idx_availability_slot_pickups_pickup_point").on(table.pickupPointId),
  ],
)

export const productMeetingConfigs = pgTable(
  "product_meeting_configs",
  {
    id: typeId("product_meeting_configs"),
    productId: text("product_id").notNull(),
    optionId: text("option_id"),
    facilityId: text("facility_id"),
    mode: meetingModeEnum("mode").notNull().default("meeting_only"),
    allowCustomPickup: boolean("allow_custom_pickup").notNull().default(false),
    allowCustomDropoff: boolean("allow_custom_dropoff").notNull().default(false),
    requiresPickupSelection: boolean("requires_pickup_selection").notNull().default(false),
    requiresDropoffSelection: boolean("requires_dropoff_selection").notNull().default(false),
    usePickupAllotment: boolean("use_pickup_allotment").notNull().default(false),
    meetingInstructions: text("meeting_instructions"),
    pickupInstructions: text("pickup_instructions"),
    dropoffInstructions: text("dropoff_instructions"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_product_meeting_configs_product").on(table.productId),
    index("idx_product_meeting_configs_option").on(table.optionId),
    index("idx_product_meeting_configs_facility").on(table.facilityId),
    index("idx_product_meeting_configs_active").on(table.active),
  ],
)

export const pickupGroups = pgTable(
  "pickup_groups",
  {
    id: typeId("pickup_groups"),
    meetingConfigId: typeIdRef("meeting_config_id")
      .notNull()
      .references(() => productMeetingConfigs.id, { onDelete: "cascade" }),
    kind: pickupGroupKindEnum("kind").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    active: boolean("active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_pickup_groups_meeting_config").on(table.meetingConfigId),
    index("idx_pickup_groups_kind").on(table.kind),
    index("idx_pickup_groups_active").on(table.active),
  ],
)

export const pickupLocations = pgTable(
  "pickup_locations",
  {
    id: typeId("pickup_locations"),
    groupId: typeIdRef("group_id")
      .notNull()
      .references(() => pickupGroups.id, { onDelete: "cascade" }),
    facilityId: text("facility_id"),
    name: text("name").notNull(),
    description: text("description"),
    locationText: text("location_text"),
    leadTimeMinutes: integer("lead_time_minutes"),
    active: boolean("active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_pickup_locations_group").on(table.groupId),
    index("idx_pickup_locations_facility").on(table.facilityId),
    index("idx_pickup_locations_active").on(table.active),
  ],
)

export const locationPickupTimes = pgTable(
  "location_pickup_times",
  {
    id: typeId("location_pickup_times"),
    pickupLocationId: typeIdRef("pickup_location_id")
      .notNull()
      .references(() => pickupLocations.id, { onDelete: "cascade" }),
    slotId: typeIdRef("slot_id").references(() => availabilitySlots.id, { onDelete: "cascade" }),
    startTimeId: typeIdRef("start_time_id").references(() => availabilityStartTimes.id, {
      onDelete: "set null",
    }),
    timingMode: pickupTimingModeEnum("timing_mode").notNull().default("fixed_time"),
    localTime: text("local_time"),
    offsetMinutes: integer("offset_minutes"),
    instructions: text("instructions"),
    initialCapacity: integer("initial_capacity"),
    remainingCapacity: integer("remaining_capacity"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_location_pickup_times_pickup_location").on(table.pickupLocationId),
    index("idx_location_pickup_times_slot").on(table.slotId),
    index("idx_location_pickup_times_start_time").on(table.startTimeId),
    index("idx_location_pickup_times_active").on(table.active),
  ],
)

export const customPickupAreas = pgTable(
  "custom_pickup_areas",
  {
    id: typeId("custom_pickup_areas"),
    meetingConfigId: typeIdRef("meeting_config_id")
      .notNull()
      .references(() => productMeetingConfigs.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    geographicText: text("geographic_text"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_custom_pickup_areas_meeting_config").on(table.meetingConfigId),
    index("idx_custom_pickup_areas_active").on(table.active),
  ],
)

export type AvailabilityRule = typeof availabilityRules.$inferSelect
export type NewAvailabilityRule = typeof availabilityRules.$inferInsert
export type AvailabilityStartTime = typeof availabilityStartTimes.$inferSelect
export type NewAvailabilityStartTime = typeof availabilityStartTimes.$inferInsert
export type AvailabilitySlot = typeof availabilitySlots.$inferSelect
export type NewAvailabilitySlot = typeof availabilitySlots.$inferInsert
export type AvailabilityCloseout = typeof availabilityCloseouts.$inferSelect
export type NewAvailabilityCloseout = typeof availabilityCloseouts.$inferInsert
export type AvailabilityPickupPoint = typeof availabilityPickupPoints.$inferSelect
export type NewAvailabilityPickupPoint = typeof availabilityPickupPoints.$inferInsert
export type AvailabilitySlotPickup = typeof availabilitySlotPickups.$inferSelect
export type NewAvailabilitySlotPickup = typeof availabilitySlotPickups.$inferInsert
export type ProductMeetingConfig = typeof productMeetingConfigs.$inferSelect
export type NewProductMeetingConfig = typeof productMeetingConfigs.$inferInsert
export type PickupGroup = typeof pickupGroups.$inferSelect
export type NewPickupGroup = typeof pickupGroups.$inferInsert
export type PickupLocation = typeof pickupLocations.$inferSelect
export type NewPickupLocation = typeof pickupLocations.$inferInsert
export type LocationPickupTime = typeof locationPickupTimes.$inferSelect
export type NewLocationPickupTime = typeof locationPickupTimes.$inferInsert
export type CustomPickupArea = typeof customPickupAreas.$inferSelect
export type NewCustomPickupArea = typeof customPickupAreas.$inferInsert

export const availabilityRulesRelations = relations(availabilityRules, ({ many }) => ({
  slots: many(availabilitySlots),
}))

export const availabilityStartTimesRelations = relations(availabilityStartTimes, ({ many }) => ({
  slots: many(availabilitySlots),
  locationPickupTimes: many(locationPickupTimes),
}))

export const availabilitySlotsRelations = relations(availabilitySlots, ({ one, many }) => ({
  rule: one(availabilityRules, {
    fields: [availabilitySlots.availabilityRuleId],
    references: [availabilityRules.id],
  }),
  startTime: one(availabilityStartTimes, {
    fields: [availabilitySlots.startTimeId],
    references: [availabilityStartTimes.id],
  }),
  pickups: many(availabilitySlotPickups),
  closeouts: many(availabilityCloseouts),
  locationPickupTimes: many(locationPickupTimes),
}))

export const availabilityCloseoutsRelations = relations(availabilityCloseouts, ({ one }) => ({
  slot: one(availabilitySlots, {
    fields: [availabilityCloseouts.slotId],
    references: [availabilitySlots.id],
  }),
}))

export const availabilityPickupPointsRelations = relations(
  availabilityPickupPoints,
  ({ many }) => ({
    slotPickups: many(availabilitySlotPickups),
  }),
)

export const availabilitySlotPickupsRelations = relations(availabilitySlotPickups, ({ one }) => ({
  slot: one(availabilitySlots, {
    fields: [availabilitySlotPickups.slotId],
    references: [availabilitySlots.id],
  }),
  pickupPoint: one(availabilityPickupPoints, {
    fields: [availabilitySlotPickups.pickupPointId],
    references: [availabilityPickupPoints.id],
  }),
}))

export const productMeetingConfigsRelations = relations(productMeetingConfigs, ({ many }) => ({
  pickupGroups: many(pickupGroups),
  customPickupAreas: many(customPickupAreas),
}))

export const pickupGroupsRelations = relations(pickupGroups, ({ one, many }) => ({
  meetingConfig: one(productMeetingConfigs, {
    fields: [pickupGroups.meetingConfigId],
    references: [productMeetingConfigs.id],
  }),
  locations: many(pickupLocations),
}))

export const pickupLocationsRelations = relations(pickupLocations, ({ one, many }) => ({
  group: one(pickupGroups, {
    fields: [pickupLocations.groupId],
    references: [pickupGroups.id],
  }),
  pickupTimes: many(locationPickupTimes),
}))

export const locationPickupTimesRelations = relations(locationPickupTimes, ({ one }) => ({
  pickupLocation: one(pickupLocations, {
    fields: [locationPickupTimes.pickupLocationId],
    references: [pickupLocations.id],
  }),
  slot: one(availabilitySlots, {
    fields: [locationPickupTimes.slotId],
    references: [availabilitySlots.id],
  }),
  startTime: one(availabilityStartTimes, {
    fields: [locationPickupTimes.startTimeId],
    references: [availabilityStartTimes.id],
  }),
}))

export const customPickupAreasRelations = relations(customPickupAreas, ({ one }) => ({
  meetingConfig: one(productMeetingConfigs, {
    fields: [customPickupAreas.meetingConfigId],
    references: [productMeetingConfigs.id],
  }),
}))
