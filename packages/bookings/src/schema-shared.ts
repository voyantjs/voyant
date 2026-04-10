import { pgEnum } from "drizzle-orm/pg-core"

export const bookingStatusEnum = pgEnum("booking_status", [
  "draft",
  "on_hold",
  "confirmed",
  "in_progress",
  "completed",
  "expired",
  "cancelled",
])

export const supplierConfirmationStatusEnum = pgEnum("supplier_confirmation_status", [
  "pending",
  "confirmed",
  "rejected",
  "cancelled",
])

export const bookingActivityTypeEnum = pgEnum("booking_activity_type", [
  "booking_created",
  "booking_reserved",
  "booking_converted",
  "booking_confirmed",
  "hold_extended",
  "hold_expired",
  "status_change",
  "item_update",
  "allocation_released",
  "fulfillment_issued",
  "fulfillment_updated",
  "redemption_recorded",
  "supplier_update",
  "passenger_update",
  "note_added",
])

export const bookingDocumentTypeEnum = pgEnum("booking_document_type", [
  "visa",
  "insurance",
  "health",
  "passport_copy",
  "other",
])

export const bookingSourceTypeEnum = pgEnum("booking_source_type", [
  "direct",
  "manual",
  "affiliate",
  "ota",
  "reseller",
  "api_partner",
  "internal",
])

export const bookingParticipantTypeEnum = pgEnum("booking_participant_type", [
  "traveler",
  "booker",
  "contact",
  "occupant",
  "staff",
  "other",
])

export const bookingTravelerCategoryEnum = pgEnum("booking_traveler_category", [
  "adult",
  "child",
  "infant",
  "senior",
  "other",
])

export const bookingItemTypeEnum = pgEnum("booking_item_type", [
  "unit",
  "extra",
  "service",
  "fee",
  "tax",
  "discount",
  "adjustment",
  "accommodation",
  "transport",
  "other",
])

export const bookingItemStatusEnum = pgEnum("booking_item_status", [
  "draft",
  "on_hold",
  "confirmed",
  "cancelled",
  "expired",
  "fulfilled",
])

export const bookingAllocationTypeEnum = pgEnum("booking_allocation_type", [
  "unit",
  "pickup",
  "resource",
])

export const bookingAllocationStatusEnum = pgEnum("booking_allocation_status", [
  "held",
  "confirmed",
  "released",
  "expired",
  "cancelled",
  "fulfilled",
])

export const bookingFulfillmentTypeEnum = pgEnum("booking_fulfillment_type", [
  "voucher",
  "ticket",
  "pdf",
  "qr_code",
  "barcode",
  "mobile",
  "other",
])

export const bookingFulfillmentDeliveryChannelEnum = pgEnum(
  "booking_fulfillment_delivery_channel",
  ["download", "email", "api", "wallet", "other"],
)

export const bookingFulfillmentStatusEnum = pgEnum("booking_fulfillment_status", [
  "pending",
  "issued",
  "reissued",
  "revoked",
  "failed",
])

export const bookingRedemptionMethodEnum = pgEnum("booking_redemption_method", [
  "manual",
  "scan",
  "api",
  "other",
])

export const bookingItemParticipantRoleEnum = pgEnum("booking_item_participant_role", [
  "traveler",
  "occupant",
  "primary_contact",
  "service_assignee",
  "beneficiary",
  "other",
])

export const bookingPiiAccessActionEnum = pgEnum("booking_pii_access_action", [
  "read",
  "update",
  "delete",
])

export const bookingPiiAccessOutcomeEnum = pgEnum("booking_pii_access_outcome", [
  "allowed",
  "denied",
])
