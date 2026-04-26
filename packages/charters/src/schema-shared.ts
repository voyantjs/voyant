import { pgEnum } from "drizzle-orm/pg-core"

export const charterStatusEnum = pgEnum("charter_status", [
  "draft",
  "awaiting_review",
  "live",
  "archived",
])

export const charterSourceEnum = pgEnum("charter_source", ["local", "external"])

export const yachtClassEnum = pgEnum("charter_yacht_class", [
  "luxury_motor",
  "luxury_sailing",
  "expedition",
  "small_cruise",
])

export const voyageSalesStatusEnum = pgEnum("charter_voyage_sales_status", [
  "open",
  "on_request",
  "wait_list",
  "sold_out",
  "closed",
])

export const suiteCategoryEnum = pgEnum("charter_suite_category", [
  "standard",
  "deluxe",
  "suite",
  "penthouse",
  "owners",
  "signature",
])

export const suiteAvailabilityEnum = pgEnum("charter_suite_availability", [
  "available",
  "limited",
  "on_request",
  "wait_list",
  "sold_out",
])

export const charterBookingModeEnum = pgEnum("charter_booking_mode", ["per_suite", "whole_yacht"])
