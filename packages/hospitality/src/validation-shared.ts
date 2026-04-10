import { booleanQueryParam } from "@voyantjs/db/helpers"
import { z } from "zod"

export { booleanQueryParam, z }

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})
export const nullableString = z.string().nullable().optional()
export const nullableInt = z.number().int().nullable().optional()
export const nullableDate = z.string().date().nullable().optional()
export const nullableMoney = z.number().int().nullable().optional()
export const hospitalityInventoryModeSchema = z.enum(["pooled", "serialized", "virtual"])
export const roomUnitStatusSchema = z.enum(["active", "inactive", "out_of_order", "archived"])
export const ratePlanChargeFrequencySchema = z.enum([
  "per_night",
  "per_stay",
  "per_person_per_night",
  "per_person_per_stay",
])
export const hospitalityGuaranteeModeSchema = z.enum([
  "none",
  "card_hold",
  "deposit",
  "full_prepay",
  "on_request",
])
export const stayBookingItemStatusSchema = z.enum([
  "reserved",
  "checked_in",
  "checked_out",
  "cancelled",
  "no_show",
])
export const hospitalityRoomBlockStatusSchema = z.enum([
  "draft",
  "held",
  "confirmed",
  "released",
  "cancelled",
])
export const hospitalityHousekeepingTaskStatusSchema = z.enum([
  "open",
  "in_progress",
  "completed",
  "cancelled",
])
export const hospitalityMaintenanceBlockStatusSchema = z.enum([
  "open",
  "in_progress",
  "resolved",
  "cancelled",
])
export const stayOperationStatusSchema = z.enum([
  "reserved",
  "expected_arrival",
  "checked_in",
  "checked_out",
  "no_show",
  "cancelled",
])
export const stayCheckpointTypeSchema = z.enum([
  "arrival",
  "room_assigned",
  "check_in",
  "room_move",
  "charge_posted",
  "check_out",
  "no_show",
  "note",
])
export const stayServicePostKindSchema = z.enum([
  "lodging",
  "meal",
  "minibar",
  "fee",
  "adjustment",
  "other",
])
export const stayFolioStatusSchema = z.enum(["open", "closed", "transferred", "void"])
