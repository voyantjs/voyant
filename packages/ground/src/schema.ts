import { typeId, typeIdRef } from "@voyantjs/db/lib/typeid-column"
import { facilities } from "@voyantjs/facilities/schema"
import { identityAddresses } from "@voyantjs/identity/schema"
import { relations } from "drizzle-orm"
import {
  boolean,
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

export const groundVehicleCategoryEnum = pgEnum("ground_vehicle_category", [
  "car",
  "sedan",
  "suv",
  "van",
  "minibus",
  "bus",
  "boat",
  "train",
  "other",
])

export const groundVehicleClassEnum = pgEnum("ground_vehicle_class", [
  "economy",
  "standard",
  "premium",
  "luxury",
  "accessible",
  "other",
])

export const groundServiceLevelEnum = pgEnum("ground_service_level", [
  "private",
  "shared",
  "vip",
  "shuttle",
  "other",
])

export const groundDispatchStatusEnum = pgEnum("ground_dispatch_status", [
  "draft",
  "scheduled",
  "assigned",
  "en_route",
  "arrived",
  "picked_up",
  "completed",
  "cancelled",
  "no_show",
])

export const groundExecutionEventTypeEnum = pgEnum("ground_execution_event_type", [
  "scheduled",
  "assigned",
  "driver_en_route",
  "driver_arrived",
  "pickup_completed",
  "dropoff_completed",
  "cancelled",
  "issue",
  "note",
])

export const groundAssignmentSourceEnum = pgEnum("ground_assignment_source", [
  "manual",
  "suggested",
  "auto",
])

export const groundDispatchLegTypeEnum = pgEnum("ground_dispatch_leg_type", [
  "pickup",
  "stop",
  "dropoff",
  "deadhead",
])

export const groundDriverShiftStatusEnum = pgEnum("ground_driver_shift_status", [
  "scheduled",
  "available",
  "on_duty",
  "completed",
  "cancelled",
])

export const groundIncidentSeverityEnum = pgEnum("ground_incident_severity", [
  "info",
  "warning",
  "critical",
])

export const groundIncidentResolutionStatusEnum = pgEnum("ground_incident_resolution_status", [
  "open",
  "mitigated",
  "resolved",
  "cancelled",
])

export const groundCheckpointStatusEnum = pgEnum("ground_checkpoint_status", [
  "pending",
  "reached",
  "missed",
  "cancelled",
])

export const groundOperators = pgTable(
  "ground_operators",
  {
    id: typeId("ground_operators"),
    supplierId: text("supplier_id"),
    facilityId: typeIdRef("facility_id").references(() => facilities.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    code: text("code"),
    active: boolean("active").notNull().default(true),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_ground_operators_supplier").on(table.supplierId),
    index("idx_ground_operators_facility").on(table.facilityId),
    index("idx_ground_operators_active").on(table.active),
  ],
)

export const groundVehicles = pgTable(
  "ground_vehicles",
  {
    id: typeId("ground_vehicles"),
    resourceId: text("resource_id").notNull(),
    operatorId: typeIdRef("operator_id").references(() => groundOperators.id, {
      onDelete: "set null",
    }),
    category: groundVehicleCategoryEnum("category").notNull().default("other"),
    vehicleClass: groundVehicleClassEnum("vehicle_class").notNull().default("standard"),
    passengerCapacity: integer("passenger_capacity"),
    checkedBagCapacity: integer("checked_bag_capacity"),
    carryOnCapacity: integer("carry_on_capacity"),
    wheelchairCapacity: integer("wheelchair_capacity"),
    childSeatCapacity: integer("child_seat_capacity"),
    isAccessible: boolean("is_accessible").notNull().default(false),
    active: boolean("active").notNull().default(true),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("uidx_ground_vehicles_resource").on(table.resourceId),
    index("idx_ground_vehicles_operator").on(table.operatorId),
    index("idx_ground_vehicles_category").on(table.category),
    index("idx_ground_vehicles_active").on(table.active),
  ],
)

export const groundDrivers = pgTable(
  "ground_drivers",
  {
    id: typeId("ground_drivers"),
    resourceId: text("resource_id").notNull(),
    operatorId: typeIdRef("operator_id").references(() => groundOperators.id, {
      onDelete: "set null",
    }),
    licenseNumber: text("license_number"),
    spokenLanguages: jsonb("spoken_languages").$type<string[]>().notNull().default([]),
    isGuide: boolean("is_guide").notNull().default(false),
    isMeetAndGreetCapable: boolean("is_meet_and_greet_capable").notNull().default(false),
    active: boolean("active").notNull().default(true),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("uidx_ground_drivers_resource").on(table.resourceId),
    index("idx_ground_drivers_operator").on(table.operatorId),
    index("idx_ground_drivers_active").on(table.active),
  ],
)

export const groundTransferPreferences = pgTable(
  "ground_transfer_preferences",
  {
    id: typeId("ground_transfer_preferences"),
    bookingId: text("booking_id").notNull(),
    bookingItemId: text("booking_item_id"),
    pickupFacilityId: typeIdRef("pickup_facility_id").references(() => facilities.id, {
      onDelete: "set null",
    }),
    dropoffFacilityId: typeIdRef("dropoff_facility_id").references(() => facilities.id, {
      onDelete: "set null",
    }),
    pickupAddressId: typeIdRef("pickup_address_id").references(() => identityAddresses.id, {
      onDelete: "set null",
    }),
    dropoffAddressId: typeIdRef("dropoff_address_id").references(() => identityAddresses.id, {
      onDelete: "set null",
    }),
    requestedVehicleCategory: groundVehicleCategoryEnum("requested_vehicle_category"),
    requestedVehicleClass: groundVehicleClassEnum("requested_vehicle_class"),
    serviceLevel: groundServiceLevelEnum("service_level").notNull().default("private"),
    passengerCount: integer("passenger_count"),
    checkedBags: integer("checked_bags"),
    carryOnBags: integer("carry_on_bags"),
    wheelchairCount: integer("wheelchair_count"),
    childSeatCount: integer("child_seat_count"),
    driverLanguage: text("driver_language"),
    meetAndGreet: boolean("meet_and_greet").notNull().default(false),
    accessibilityNotes: text("accessibility_notes"),
    pickupNotes: text("pickup_notes"),
    dropoffNotes: text("dropoff_notes"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_ground_transfer_preferences_booking").on(table.bookingId),
    index("idx_ground_transfer_preferences_booking_item").on(table.bookingItemId),
    index("idx_ground_transfer_preferences_service_level").on(table.serviceLevel),
  ],
)

export const groundDispatches = pgTable(
  "ground_dispatches",
  {
    id: typeId("ground_dispatches"),
    transferPreferenceId: typeIdRef("transfer_preference_id")
      .notNull()
      .references(() => groundTransferPreferences.id, { onDelete: "cascade" }),
    bookingId: text("booking_id").notNull(),
    bookingItemId: text("booking_item_id"),
    operatorId: typeIdRef("operator_id").references(() => groundOperators.id, {
      onDelete: "set null",
    }),
    vehicleId: typeIdRef("vehicle_id").references(() => groundVehicles.id, {
      onDelete: "set null",
    }),
    driverId: typeIdRef("driver_id").references(() => groundDrivers.id, { onDelete: "set null" }),
    serviceDate: date("service_date"),
    scheduledPickupAt: timestamp("scheduled_pickup_at", { withTimezone: true }),
    scheduledDropoffAt: timestamp("scheduled_dropoff_at", { withTimezone: true }),
    actualPickupAt: timestamp("actual_pickup_at", { withTimezone: true }),
    actualDropoffAt: timestamp("actual_dropoff_at", { withTimezone: true }),
    status: groundDispatchStatusEnum("status").notNull().default("draft"),
    passengerCount: integer("passenger_count"),
    checkedBags: integer("checked_bags"),
    carryOnBags: integer("carry_on_bags"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_ground_dispatches_preference").on(table.transferPreferenceId),
    index("idx_ground_dispatches_booking").on(table.bookingId),
    index("idx_ground_dispatches_booking_item").on(table.bookingItemId),
    index("idx_ground_dispatches_operator").on(table.operatorId),
    index("idx_ground_dispatches_vehicle").on(table.vehicleId),
    index("idx_ground_dispatches_driver").on(table.driverId),
    index("idx_ground_dispatches_status").on(table.status),
    index("idx_ground_dispatches_service_date").on(table.serviceDate),
  ],
)

export const groundExecutionEvents = pgTable(
  "ground_execution_events",
  {
    id: typeId("ground_execution_events"),
    dispatchId: typeIdRef("dispatch_id")
      .notNull()
      .references(() => groundDispatches.id, { onDelete: "cascade" }),
    eventType: groundExecutionEventTypeEnum("event_type").notNull().default("note"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
    facilityId: typeIdRef("facility_id").references(() => facilities.id, { onDelete: "set null" }),
    addressId: typeIdRef("address_id").references(() => identityAddresses.id, {
      onDelete: "set null",
    }),
    notes: text("notes"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_ground_execution_events_dispatch").on(table.dispatchId),
    index("idx_ground_execution_events_type").on(table.eventType),
    index("idx_ground_execution_events_occurred_at").on(table.occurredAt),
  ],
)

export const groundDispatchAssignments = pgTable(
  "ground_dispatch_assignments",
  {
    id: typeId("ground_dispatch_assignments"),
    dispatchId: typeIdRef("dispatch_id")
      .notNull()
      .references(() => groundDispatches.id, { onDelete: "cascade" }),
    operatorId: typeIdRef("operator_id").references(() => groundOperators.id, {
      onDelete: "set null",
    }),
    vehicleId: typeIdRef("vehicle_id").references(() => groundVehicles.id, {
      onDelete: "set null",
    }),
    driverId: typeIdRef("driver_id").references(() => groundDrivers.id, { onDelete: "set null" }),
    assignmentSource: groundAssignmentSourceEnum("assignment_source").notNull().default("manual"),
    assignedAt: timestamp("assigned_at", { withTimezone: true }).notNull().defaultNow(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    notes: text("notes"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_ground_dispatch_assignments_dispatch").on(table.dispatchId),
    index("idx_ground_dispatch_assignments_operator").on(table.operatorId),
    index("idx_ground_dispatch_assignments_vehicle").on(table.vehicleId),
    index("idx_ground_dispatch_assignments_driver").on(table.driverId),
    index("idx_ground_dispatch_assignments_source").on(table.assignmentSource),
  ],
)

export const groundDispatchLegs = pgTable(
  "ground_dispatch_legs",
  {
    id: typeId("ground_dispatch_legs"),
    dispatchId: typeIdRef("dispatch_id")
      .notNull()
      .references(() => groundDispatches.id, { onDelete: "cascade" }),
    sequence: integer("sequence").notNull().default(0),
    legType: groundDispatchLegTypeEnum("leg_type").notNull().default("pickup"),
    facilityId: typeIdRef("facility_id").references(() => facilities.id, { onDelete: "set null" }),
    addressId: typeIdRef("address_id").references(() => identityAddresses.id, {
      onDelete: "set null",
    }),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    actualAt: timestamp("actual_at", { withTimezone: true }),
    notes: text("notes"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_ground_dispatch_legs_dispatch").on(table.dispatchId),
    index("idx_ground_dispatch_legs_sequence").on(table.sequence),
    index("idx_ground_dispatch_legs_type").on(table.legType),
  ],
)

export const groundDispatchPassengers = pgTable(
  "ground_dispatch_passengers",
  {
    id: typeId("ground_dispatch_passengers"),
    dispatchId: typeIdRef("dispatch_id")
      .notNull()
      .references(() => groundDispatches.id, { onDelete: "cascade" }),
    participantId: text("participant_id"),
    displayName: text("display_name"),
    seatLabel: text("seat_label"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_ground_dispatch_passengers_dispatch").on(table.dispatchId),
    index("idx_ground_dispatch_passengers_participant").on(table.participantId),
  ],
)

export const groundDriverShifts = pgTable(
  "ground_driver_shifts",
  {
    id: typeId("ground_driver_shifts"),
    driverId: typeIdRef("driver_id")
      .notNull()
      .references(() => groundDrivers.id, { onDelete: "cascade" }),
    operatorId: typeIdRef("operator_id").references(() => groundOperators.id, {
      onDelete: "set null",
    }),
    facilityId: typeIdRef("facility_id").references(() => facilities.id, { onDelete: "set null" }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    status: groundDriverShiftStatusEnum("status").notNull().default("scheduled"),
    notes: text("notes"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_ground_driver_shifts_driver").on(table.driverId),
    index("idx_ground_driver_shifts_operator").on(table.operatorId),
    index("idx_ground_driver_shifts_facility").on(table.facilityId),
    index("idx_ground_driver_shifts_status").on(table.status),
  ],
)

export const groundServiceIncidents = pgTable(
  "ground_service_incidents",
  {
    id: typeId("ground_service_incidents"),
    dispatchId: typeIdRef("dispatch_id")
      .notNull()
      .references(() => groundDispatches.id, { onDelete: "cascade" }),
    severity: groundIncidentSeverityEnum("severity").notNull().default("warning"),
    incidentType: text("incident_type").notNull(),
    resolutionStatus: groundIncidentResolutionStatusEnum("resolution_status")
      .notNull()
      .default("open"),
    openedAt: timestamp("opened_at", { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    notes: text("notes"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_ground_service_incidents_dispatch").on(table.dispatchId),
    index("idx_ground_service_incidents_severity").on(table.severity),
    index("idx_ground_service_incidents_resolution").on(table.resolutionStatus),
  ],
)

export const groundDispatchCheckpoints = pgTable(
  "ground_dispatch_checkpoints",
  {
    id: typeId("ground_dispatch_checkpoints"),
    dispatchId: typeIdRef("dispatch_id")
      .notNull()
      .references(() => groundDispatches.id, { onDelete: "cascade" }),
    sequence: integer("sequence").notNull().default(0),
    checkpointType: text("checkpoint_type").notNull(),
    status: groundCheckpointStatusEnum("status").notNull().default("pending"),
    plannedAt: timestamp("planned_at", { withTimezone: true }),
    actualAt: timestamp("actual_at", { withTimezone: true }),
    facilityId: typeIdRef("facility_id").references(() => facilities.id, { onDelete: "set null" }),
    addressId: typeIdRef("address_id").references(() => identityAddresses.id, {
      onDelete: "set null",
    }),
    notes: text("notes"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_ground_dispatch_checkpoints_dispatch").on(table.dispatchId),
    index("idx_ground_dispatch_checkpoints_sequence").on(table.sequence),
    index("idx_ground_dispatch_checkpoints_status").on(table.status),
  ],
)

export type GroundOperator = typeof groundOperators.$inferSelect
export type NewGroundOperator = typeof groundOperators.$inferInsert
export type GroundVehicle = typeof groundVehicles.$inferSelect
export type NewGroundVehicle = typeof groundVehicles.$inferInsert
export type GroundDriver = typeof groundDrivers.$inferSelect
export type NewGroundDriver = typeof groundDrivers.$inferInsert
export type GroundTransferPreference = typeof groundTransferPreferences.$inferSelect
export type NewGroundTransferPreference = typeof groundTransferPreferences.$inferInsert
export type GroundDispatch = typeof groundDispatches.$inferSelect
export type NewGroundDispatch = typeof groundDispatches.$inferInsert
export type GroundExecutionEvent = typeof groundExecutionEvents.$inferSelect
export type NewGroundExecutionEvent = typeof groundExecutionEvents.$inferInsert
export type GroundDispatchAssignment = typeof groundDispatchAssignments.$inferSelect
export type NewGroundDispatchAssignment = typeof groundDispatchAssignments.$inferInsert
export type GroundDispatchLeg = typeof groundDispatchLegs.$inferSelect
export type NewGroundDispatchLeg = typeof groundDispatchLegs.$inferInsert
export type GroundDispatchPassenger = typeof groundDispatchPassengers.$inferSelect
export type NewGroundDispatchPassenger = typeof groundDispatchPassengers.$inferInsert
export type GroundDriverShift = typeof groundDriverShifts.$inferSelect
export type NewGroundDriverShift = typeof groundDriverShifts.$inferInsert
export type GroundServiceIncident = typeof groundServiceIncidents.$inferSelect
export type NewGroundServiceIncident = typeof groundServiceIncidents.$inferInsert
export type GroundDispatchCheckpoint = typeof groundDispatchCheckpoints.$inferSelect
export type NewGroundDispatchCheckpoint = typeof groundDispatchCheckpoints.$inferInsert

export const groundOperatorsRelations = relations(groundOperators, ({ one, many }) => ({
  facility: one(facilities, { fields: [groundOperators.facilityId], references: [facilities.id] }),
  vehicles: many(groundVehicles),
  drivers: many(groundDrivers),
}))

export const groundVehiclesRelations = relations(groundVehicles, ({ one }) => ({
  operator: one(groundOperators, {
    fields: [groundVehicles.operatorId],
    references: [groundOperators.id],
  }),
}))

export const groundDriversRelations = relations(groundDrivers, ({ one }) => ({
  operator: one(groundOperators, {
    fields: [groundDrivers.operatorId],
    references: [groundOperators.id],
  }),
}))

export const groundTransferPreferencesRelations = relations(
  groundTransferPreferences,
  ({ one, many }) => ({
    pickupFacility: one(facilities, {
      fields: [groundTransferPreferences.pickupFacilityId],
      references: [facilities.id],
    }),
    dropoffFacility: one(facilities, {
      fields: [groundTransferPreferences.dropoffFacilityId],
      references: [facilities.id],
    }),
    pickupAddress: one(identityAddresses, {
      fields: [groundTransferPreferences.pickupAddressId],
      references: [identityAddresses.id],
    }),
    dropoffAddress: one(identityAddresses, {
      fields: [groundTransferPreferences.dropoffAddressId],
      references: [identityAddresses.id],
    }),
    dispatches: many(groundDispatches),
  }),
)

export const groundDispatchesRelations = relations(groundDispatches, ({ one, many }) => ({
  transferPreference: one(groundTransferPreferences, {
    fields: [groundDispatches.transferPreferenceId],
    references: [groundTransferPreferences.id],
  }),
  operator: one(groundOperators, {
    fields: [groundDispatches.operatorId],
    references: [groundOperators.id],
  }),
  vehicle: one(groundVehicles, {
    fields: [groundDispatches.vehicleId],
    references: [groundVehicles.id],
  }),
  driver: one(groundDrivers, {
    fields: [groundDispatches.driverId],
    references: [groundDrivers.id],
  }),
  executionEvents: many(groundExecutionEvents),
  assignments: many(groundDispatchAssignments),
  legs: many(groundDispatchLegs),
  passengers: many(groundDispatchPassengers),
  incidents: many(groundServiceIncidents),
  checkpoints: many(groundDispatchCheckpoints),
}))

export const groundExecutionEventsRelations = relations(groundExecutionEvents, ({ one }) => ({
  dispatch: one(groundDispatches, {
    fields: [groundExecutionEvents.dispatchId],
    references: [groundDispatches.id],
  }),
  facility: one(facilities, {
    fields: [groundExecutionEvents.facilityId],
    references: [facilities.id],
  }),
  address: one(identityAddresses, {
    fields: [groundExecutionEvents.addressId],
    references: [identityAddresses.id],
  }),
}))

export const groundDispatchAssignmentsRelations = relations(
  groundDispatchAssignments,
  ({ one }) => ({
    dispatch: one(groundDispatches, {
      fields: [groundDispatchAssignments.dispatchId],
      references: [groundDispatches.id],
    }),
    operator: one(groundOperators, {
      fields: [groundDispatchAssignments.operatorId],
      references: [groundOperators.id],
    }),
    vehicle: one(groundVehicles, {
      fields: [groundDispatchAssignments.vehicleId],
      references: [groundVehicles.id],
    }),
    driver: one(groundDrivers, {
      fields: [groundDispatchAssignments.driverId],
      references: [groundDrivers.id],
    }),
  }),
)

export const groundDispatchLegsRelations = relations(groundDispatchLegs, ({ one }) => ({
  dispatch: one(groundDispatches, {
    fields: [groundDispatchLegs.dispatchId],
    references: [groundDispatches.id],
  }),
  facility: one(facilities, {
    fields: [groundDispatchLegs.facilityId],
    references: [facilities.id],
  }),
  address: one(identityAddresses, {
    fields: [groundDispatchLegs.addressId],
    references: [identityAddresses.id],
  }),
}))

export const groundDispatchPassengersRelations = relations(groundDispatchPassengers, ({ one }) => ({
  dispatch: one(groundDispatches, {
    fields: [groundDispatchPassengers.dispatchId],
    references: [groundDispatches.id],
  }),
}))

export const groundDriverShiftsRelations = relations(groundDriverShifts, ({ one }) => ({
  driver: one(groundDrivers, {
    fields: [groundDriverShifts.driverId],
    references: [groundDrivers.id],
  }),
  operator: one(groundOperators, {
    fields: [groundDriverShifts.operatorId],
    references: [groundOperators.id],
  }),
  facility: one(facilities, {
    fields: [groundDriverShifts.facilityId],
    references: [facilities.id],
  }),
}))

export const groundServiceIncidentsRelations = relations(groundServiceIncidents, ({ one }) => ({
  dispatch: one(groundDispatches, {
    fields: [groundServiceIncidents.dispatchId],
    references: [groundDispatches.id],
  }),
}))

export const groundDispatchCheckpointsRelations = relations(
  groundDispatchCheckpoints,
  ({ one }) => ({
    dispatch: one(groundDispatches, {
      fields: [groundDispatchCheckpoints.dispatchId],
      references: [groundDispatches.id],
    }),
    facility: one(facilities, {
      fields: [groundDispatchCheckpoints.facilityId],
      references: [facilities.id],
    }),
    address: one(identityAddresses, {
      fields: [groundDispatchCheckpoints.addressId],
      references: [identityAddresses.id],
    }),
  }),
)
