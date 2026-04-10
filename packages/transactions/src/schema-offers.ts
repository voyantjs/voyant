import { typeId, typeIdRef } from "@voyantjs/db/lib/typeid-column"
import type { KmsEnvelope } from "@voyantjs/db/schema/iam/kms"
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"

import {
  offerStatusEnum,
  transactionItemParticipantRoleEnum,
  transactionItemStatusEnum,
  transactionItemTypeEnum,
  transactionParticipantTypeEnum,
  transactionTravelerCategoryEnum,
} from "./schema-shared"

export const offers = pgTable(
  "offers",
  {
    id: typeId("offers"),
    offerNumber: text("offer_number").notNull().unique(),
    title: text("title").notNull(),
    status: offerStatusEnum("status").notNull().default("draft"),
    personId: text("person_id"),
    organizationId: text("organization_id"),
    opportunityId: text("opportunity_id"),
    quoteId: text("quote_id"),
    marketId: text("market_id"),
    sourceChannelId: text("source_channel_id"),
    currency: text("currency").notNull(),
    baseCurrency: text("base_currency"),
    fxRateSetId: text("fx_rate_set_id"),
    subtotalAmountCents: integer("subtotal_amount_cents").notNull().default(0),
    taxAmountCents: integer("tax_amount_cents").notNull().default(0),
    feeAmountCents: integer("fee_amount_cents").notNull().default(0),
    totalAmountCents: integer("total_amount_cents").notNull().default(0),
    costAmountCents: integer("cost_amount_cents").notNull().default(0),
    validFrom: date("valid_from"),
    validUntil: date("valid_until"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    convertedAt: timestamp("converted_at", { withTimezone: true }),
    notes: text("notes"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_offers_status").on(table.status),
    index("idx_offers_person").on(table.personId),
    index("idx_offers_organization").on(table.organizationId),
    index("idx_offers_opportunity").on(table.opportunityId),
    index("idx_offers_quote").on(table.quoteId),
    index("idx_offers_market").on(table.marketId),
    index("idx_offers_channel").on(table.sourceChannelId),
    index("idx_offers_fx_rate_set").on(table.fxRateSetId),
    index("idx_offers_valid_until").on(table.validUntil),
  ],
)

export const offerParticipants = pgTable(
  "offer_participants",
  {
    id: typeId("offer_participants"),
    offerId: typeIdRef("offer_id")
      .notNull()
      .references(() => offers.id, { onDelete: "cascade" }),
    personId: text("person_id"),
    participantType: transactionParticipantTypeEnum("participant_type")
      .notNull()
      .default("traveler"),
    travelerCategory: transactionTravelerCategoryEnum("traveler_category"),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email"),
    phone: text("phone"),
    preferredLanguage: text("preferred_language"),
    identityEncrypted: jsonb("identity_encrypted").$type<KmsEnvelope>(),
    isPrimary: boolean("is_primary").notNull().default(false),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_offer_participants_offer").on(table.offerId),
    index("idx_offer_participants_person").on(table.personId),
    index("idx_offer_participants_type").on(table.participantType),
  ],
)

export const offerItems = pgTable(
  "offer_items",
  {
    id: typeId("offer_items"),
    offerId: typeIdRef("offer_id")
      .notNull()
      .references(() => offers.id, { onDelete: "cascade" }),
    productId: text("product_id"),
    optionId: text("option_id"),
    unitId: text("unit_id"),
    slotId: text("slot_id"),
    title: text("title").notNull(),
    description: text("description"),
    itemType: transactionItemTypeEnum("item_type").notNull().default("unit"),
    status: transactionItemStatusEnum("status").notNull().default("draft"),
    serviceDate: date("service_date"),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    quantity: integer("quantity").notNull().default(1),
    sellCurrency: text("sell_currency").notNull(),
    unitSellAmountCents: integer("unit_sell_amount_cents"),
    totalSellAmountCents: integer("total_sell_amount_cents"),
    taxAmountCents: integer("tax_amount_cents"),
    feeAmountCents: integer("fee_amount_cents"),
    costCurrency: text("cost_currency"),
    unitCostAmountCents: integer("unit_cost_amount_cents"),
    totalCostAmountCents: integer("total_cost_amount_cents"),
    notes: text("notes"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_offer_items_offer").on(table.offerId),
    index("idx_offer_items_product").on(table.productId),
    index("idx_offer_items_option").on(table.optionId),
    index("idx_offer_items_unit").on(table.unitId),
    index("idx_offer_items_slot").on(table.slotId),
    index("idx_offer_items_status").on(table.status),
  ],
)

export const offerItemParticipants = pgTable(
  "offer_item_participants",
  {
    id: typeId("offer_item_participants"),
    offerItemId: typeIdRef("offer_item_id")
      .notNull()
      .references(() => offerItems.id, { onDelete: "cascade" }),
    participantId: typeIdRef("participant_id")
      .notNull()
      .references(() => offerParticipants.id, { onDelete: "cascade" }),
    role: transactionItemParticipantRoleEnum("role").notNull().default("traveler"),
    isPrimary: boolean("is_primary").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_offer_item_participants_item").on(table.offerItemId),
    index("idx_offer_item_participants_participant").on(table.participantId),
    uniqueIndex("uidx_offer_item_participants").on(table.offerItemId, table.participantId),
  ],
)

export type Offer = typeof offers.$inferSelect
export type NewOffer = typeof offers.$inferInsert
export type OfferParticipant = typeof offerParticipants.$inferSelect
export type NewOfferParticipant = typeof offerParticipants.$inferInsert
export type OfferItem = typeof offerItems.$inferSelect
export type NewOfferItem = typeof offerItems.$inferInsert
export type OfferItemParticipant = typeof offerItemParticipants.$inferSelect
export type NewOfferItemParticipant = typeof offerItemParticipants.$inferInsert
