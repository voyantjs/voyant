import { pgEnum } from "drizzle-orm/pg-core"

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
