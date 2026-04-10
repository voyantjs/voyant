import { typeId, typeIdRef } from "@voyantjs/db/lib/typeid-column"
import { facilities } from "@voyantjs/facilities/schema"
import { identityAddresses } from "@voyantjs/identity/schema"
import { boolean, date, index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core"

import { groundDrivers, groundOperators, groundVehicles } from "./schema-operators"
import {
  groundDispatchStatusEnum,
  groundServiceLevelEnum,
  groundVehicleCategoryEnum,
  groundVehicleClassEnum,
} from "./schema-shared"

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

export type GroundTransferPreference = typeof groundTransferPreferences.$inferSelect
export type NewGroundTransferPreference = typeof groundTransferPreferences.$inferInsert
export type GroundDispatch = typeof groundDispatches.$inferSelect
export type NewGroundDispatch = typeof groundDispatches.$inferInsert
