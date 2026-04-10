import { pgEnum } from "drizzle-orm/pg-core"

export const offerStatusEnum = pgEnum("offer_status", [
  "draft",
  "published",
  "sent",
  "accepted",
  "expired",
  "withdrawn",
  "converted",
])

export const orderStatusEnum = pgEnum("order_status", [
  "draft",
  "pending",
  "confirmed",
  "fulfilled",
  "cancelled",
  "expired",
])

export const transactionParticipantTypeEnum = pgEnum("transaction_participant_type", [
  "traveler",
  "booker",
  "contact",
  "occupant",
  "staff",
  "other",
])

export const transactionTravelerCategoryEnum = pgEnum("transaction_traveler_category", [
  "adult",
  "child",
  "infant",
  "senior",
  "other",
])

export const transactionItemTypeEnum = pgEnum("transaction_item_type", [
  "unit",
  "service",
  "extra",
  "fee",
  "tax",
  "discount",
  "adjustment",
  "accommodation",
  "transport",
  "other",
])

export const transactionItemStatusEnum = pgEnum("transaction_item_status", [
  "draft",
  "priced",
  "confirmed",
  "cancelled",
  "fulfilled",
])

export const transactionItemParticipantRoleEnum = pgEnum("transaction_item_participant_role", [
  "traveler",
  "occupant",
  "primary_contact",
  "beneficiary",
  "service_assignee",
  "other",
])

export const transactionPiiAccessActionEnum = pgEnum("transaction_pii_access_action", [
  "read",
  "update",
  "delete",
])

export const transactionPiiAccessOutcomeEnum = pgEnum("transaction_pii_access_outcome", [
  "allowed",
  "denied",
])

export const orderTermTypeEnum = pgEnum("order_term_type", [
  "terms_and_conditions",
  "cancellation",
  "guarantee",
  "payment",
  "pricing",
  "commission",
  "other",
])

export const orderTermAcceptanceStatusEnum = pgEnum("order_term_acceptance_status", [
  "not_required",
  "pending",
  "accepted",
  "declined",
])
