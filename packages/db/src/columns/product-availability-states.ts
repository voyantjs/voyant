import { boolean, date, integer, jsonb, text, time, timestamp } from "drizzle-orm/pg-core"

/**
 * Core product availability config columns shared between db-main and db-marketplace.
 */
export function productAvailabilityConfigCoreColumns() {
  return {
    // Rolling availability window
    rollingSalesWindowDays: integer("rolling_sales_window_days"),
    advanceBookingMinDays: integer("advance_booking_min_days"),
    advanceBookingMaxDays: integer("advance_booking_max_days"),
    // Cutoff settings
    cutoffHours: integer("cutoff_hours"),
    sameDayBookingAllowed: boolean("same_day_booking_allowed").default(true),
    // Default capacity
    defaultCapacity: integer("default_capacity"),
    defaultMinCapacity: integer("default_min_capacity"),
    // Session settings
    allowMultipleSessions: boolean("allow_multiple_sessions").default(false),
    defaultSessionDuration: integer("default_session_duration"),
    // Waitlist settings
    enableWaitlist: boolean("enable_waitlist").default(true),
    waitlistCapacity: integer("waitlist_capacity"),
    // On-request settings
    onRequestOnly: boolean("on_request_only").default(false),
    // Audit
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  }
}

/**
 * Core availability sessions columns shared between db-main and db-marketplace.
 */
export function availabilitySessionsCoreColumns() {
  return {
    name: text("name").notNull(),
    slotKey: text("slot_key").notNull(),
    startTime: time("start_time").notNull(),
    endTime: time("end_time"),
    duration: integer("duration"),
    capacity: integer("capacity"),
    minCapacity: integer("min_capacity"),
    daysOfWeek: jsonb("days_of_week").$type<number[]>().default([1, 2, 3, 4, 5, 6, 7]),
    validFrom: date("valid_from"),
    validUntil: date("valid_until"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  }
}

/**
 * Core blackout dates columns shared between db-main and db-marketplace.
 */
export function blackoutDatesCoreColumns() {
  return {
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    reasonText: text("reason_text"),
    displayMessage: text("display_message"),
    isPublic: boolean("is_public").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  }
}

/**
 * Core departure availability states columns shared between db-main and db-marketplace.
 */
export function departureAvailabilityStatesCoreColumns() {
  return {
    date: date("date").notNull(),
    slotKey: text("slot_key"),
    capacity: integer("capacity"),
    booked: integer("booked").default(0).notNull(),
    available: integer("available"),
    waitlistCount: integer("waitlist_count").default(0).notNull(),
    statusReason: text("status_reason"),
    isManualOverride: boolean("is_manual_override").default(false).notNull(),
    overrideAt: timestamp("override_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  }
}
