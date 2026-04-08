import { typeId, typeIdRef } from "@voyantjs/db/lib/typeid-column"
import type { KmsEnvelope } from "@voyantjs/db/schema/iam/kms"
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

export const orders = pgTable(
  "orders",
  {
    id: typeId("orders"),
    orderNumber: text("order_number").notNull().unique(),
    offerId: typeIdRef("offer_id").references(() => offers.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    status: orderStatusEnum("status").notNull().default("draft"),
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
    orderedAt: timestamp("ordered_at", { withTimezone: true }),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    notes: text("notes"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_orders_offer").on(table.offerId),
    index("idx_orders_status").on(table.status),
    index("idx_orders_person").on(table.personId),
    index("idx_orders_organization").on(table.organizationId),
    index("idx_orders_opportunity").on(table.opportunityId),
    index("idx_orders_quote").on(table.quoteId),
    index("idx_orders_market").on(table.marketId),
    index("idx_orders_channel").on(table.sourceChannelId),
    index("idx_orders_fx_rate_set").on(table.fxRateSetId),
  ],
)

export const orderParticipants = pgTable(
  "order_participants",
  {
    id: typeId("order_participants"),
    orderId: typeIdRef("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
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
    index("idx_order_participants_order").on(table.orderId),
    index("idx_order_participants_person").on(table.personId),
    index("idx_order_participants_type").on(table.participantType),
  ],
)

export const orderItems = pgTable(
  "order_items",
  {
    id: typeId("order_items"),
    orderId: typeIdRef("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    offerItemId: typeIdRef("offer_item_id").references(() => offerItems.id, {
      onDelete: "set null",
    }),
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
    index("idx_order_items_order").on(table.orderId),
    index("idx_order_items_offer_item").on(table.offerItemId),
    index("idx_order_items_product").on(table.productId),
    index("idx_order_items_option").on(table.optionId),
    index("idx_order_items_unit").on(table.unitId),
    index("idx_order_items_slot").on(table.slotId),
    index("idx_order_items_status").on(table.status),
  ],
)

export const orderItemParticipants = pgTable(
  "order_item_participants",
  {
    id: typeId("order_item_participants"),
    orderItemId: typeIdRef("order_item_id")
      .notNull()
      .references(() => orderItems.id, { onDelete: "cascade" }),
    participantId: typeIdRef("participant_id")
      .notNull()
      .references(() => orderParticipants.id, { onDelete: "cascade" }),
    role: transactionItemParticipantRoleEnum("role").notNull().default("traveler"),
    isPrimary: boolean("is_primary").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_order_item_participants_item").on(table.orderItemId),
    index("idx_order_item_participants_participant").on(table.participantId),
    uniqueIndex("uidx_order_item_participants").on(table.orderItemId, table.participantId),
  ],
)

export const orderTerms = pgTable(
  "order_terms",
  {
    id: typeId("order_terms"),
    offerId: typeIdRef("offer_id").references(() => offers.id, { onDelete: "cascade" }),
    orderId: typeIdRef("order_id").references(() => orders.id, { onDelete: "cascade" }),
    termType: orderTermTypeEnum("term_type").notNull().default("terms_and_conditions"),
    title: text("title").notNull(),
    body: text("body").notNull(),
    language: text("language"),
    required: boolean("required").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    acceptanceStatus: orderTermAcceptanceStatusEnum("acceptance_status")
      .notNull()
      .default("pending"),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    acceptedBy: text("accepted_by"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_order_terms_offer").on(table.offerId),
    index("idx_order_terms_order").on(table.orderId),
    index("idx_order_terms_type").on(table.termType),
    index("idx_order_terms_acceptance").on(table.acceptanceStatus),
  ],
)

export const transactionPiiAccessLog = pgTable(
  "transaction_pii_access_log",
  {
    id: typeId("transaction_pii_access_log"),
    participantKind: text("participant_kind").notNull(),
    parentId: text("parent_id"),
    participantId: text("participant_id"),
    actorId: text("actor_id"),
    actorType: text("actor_type"),
    callerType: text("caller_type"),
    action: transactionPiiAccessActionEnum("action").notNull(),
    outcome: transactionPiiAccessOutcomeEnum("outcome").notNull(),
    reason: text("reason"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_transaction_pii_access_log_parent").on(table.parentId),
    index("idx_transaction_pii_access_log_participant").on(table.participantId),
    index("idx_transaction_pii_access_log_actor").on(table.actorId),
    index("idx_transaction_pii_access_log_created_at").on(table.createdAt),
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
export type Order = typeof orders.$inferSelect
export type NewOrder = typeof orders.$inferInsert
export type OrderParticipant = typeof orderParticipants.$inferSelect
export type NewOrderParticipant = typeof orderParticipants.$inferInsert
export type OrderItem = typeof orderItems.$inferSelect
export type NewOrderItem = typeof orderItems.$inferInsert
export type OrderItemParticipant = typeof orderItemParticipants.$inferSelect
export type NewOrderItemParticipant = typeof orderItemParticipants.$inferInsert
export type OrderTerm = typeof orderTerms.$inferSelect
export type NewOrderTerm = typeof orderTerms.$inferInsert
export type TransactionPiiAccessLog = typeof transactionPiiAccessLog.$inferSelect
export type NewTransactionPiiAccessLog = typeof transactionPiiAccessLog.$inferInsert

export const offersRelations = relations(offers, ({ many }) => ({
  participants: many(offerParticipants),
  items: many(offerItems),
  orders: many(orders),
  terms: many(orderTerms),
}))

export const offerParticipantsRelations = relations(offerParticipants, ({ one, many }) => ({
  offer: one(offers, { fields: [offerParticipants.offerId], references: [offers.id] }),
  itemLinks: many(offerItemParticipants),
}))

export const offerItemsRelations = relations(offerItems, ({ one, many }) => ({
  offer: one(offers, { fields: [offerItems.offerId], references: [offers.id] }),
  participants: many(offerItemParticipants),
}))

export const offerItemParticipantsRelations = relations(offerItemParticipants, ({ one }) => ({
  offerItem: one(offerItems, {
    fields: [offerItemParticipants.offerItemId],
    references: [offerItems.id],
  }),
  participant: one(offerParticipants, {
    fields: [offerItemParticipants.participantId],
    references: [offerParticipants.id],
  }),
}))

export const ordersRelations = relations(orders, ({ one, many }) => ({
  offer: one(offers, { fields: [orders.offerId], references: [offers.id] }),
  participants: many(orderParticipants),
  items: many(orderItems),
  terms: many(orderTerms),
}))

export const orderParticipantsRelations = relations(orderParticipants, ({ one, many }) => ({
  order: one(orders, { fields: [orderParticipants.orderId], references: [orders.id] }),
  itemLinks: many(orderItemParticipants),
}))

export const orderItemsRelations = relations(orderItems, ({ one, many }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  offerItem: one(offerItems, { fields: [orderItems.offerItemId], references: [offerItems.id] }),
  participants: many(orderItemParticipants),
}))

export const orderItemParticipantsRelations = relations(orderItemParticipants, ({ one }) => ({
  orderItem: one(orderItems, {
    fields: [orderItemParticipants.orderItemId],
    references: [orderItems.id],
  }),
  participant: one(orderParticipants, {
    fields: [orderItemParticipants.participantId],
    references: [orderParticipants.id],
  }),
}))

export const orderTermsRelations = relations(orderTerms, ({ one }) => ({
  offer: one(offers, { fields: [orderTerms.offerId], references: [offers.id] }),
  order: one(orders, { fields: [orderTerms.orderId], references: [orders.id] }),
}))
