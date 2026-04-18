import { typeId, typeIdRef } from "@voyantjs/db/lib/typeid-column"
import { products } from "@voyantjs/products/schema"
import { suppliers } from "@voyantjs/suppliers/schema"
import { boolean, date, index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core"

import {
  channelCommissionScopeEnum,
  channelCommissionTypeEnum,
  channelContractStatusEnum,
  channelKindEnum,
  channelStatusEnum,
  channelWebhookStatusEnum,
  distributionCancellationOwnerEnum,
  distributionPaymentOwnerEnum,
} from "./schema-shared"

export const channels = pgTable(
  "channels",
  {
    id: typeId("channels"),
    name: text("name").notNull(),
    description: text("description"),
    kind: channelKindEnum("kind").notNull(),
    status: channelStatusEnum("status").notNull().default("active"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_channels_created").on(table.createdAt),
    index("idx_channels_kind_created").on(table.kind, table.createdAt),
    index("idx_channels_status_created").on(table.status, table.createdAt),
  ],
)

export const channelContactProjections = pgTable("channel_contact_projections", {
  channelId: typeIdRef("channel_id")
    .primaryKey()
    .references(() => channels.id, { onDelete: "cascade" }),
  websiteContactPointId: text("website_contact_point_id"),
  primaryNamedContactId: text("primary_named_contact_id"),
  website: text("website"),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const channelContracts = pgTable(
  "channel_contracts",
  {
    id: typeId("channel_contracts"),
    channelId: typeIdRef("channel_id")
      .notNull()
      .references(() => channels.id, { onDelete: "cascade" }),
    supplierId: typeIdRef("supplier_id").references(() => suppliers.id, { onDelete: "set null" }),
    status: channelContractStatusEnum("status").notNull().default("draft"),
    startsAt: date("starts_at").notNull(),
    endsAt: date("ends_at"),
    paymentOwner: distributionPaymentOwnerEnum("payment_owner").notNull().default("operator"),
    cancellationOwner: distributionCancellationOwnerEnum("cancellation_owner")
      .notNull()
      .default("operator"),
    settlementTerms: text("settlement_terms"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_channel_contracts_channel_created").on(table.channelId, table.createdAt),
    index("idx_channel_contracts_supplier_created").on(table.supplierId, table.createdAt),
    index("idx_channel_contracts_status_created").on(table.status, table.createdAt),
  ],
)

export const channelCommissionRules = pgTable(
  "channel_commission_rules",
  {
    id: typeId("channel_commission_rules"),
    contractId: typeIdRef("contract_id")
      .notNull()
      .references(() => channelContracts.id, { onDelete: "cascade" }),
    scope: channelCommissionScopeEnum("scope").notNull(),
    productId: typeIdRef("product_id").references(() => products.id, { onDelete: "set null" }),
    externalRateId: text("external_rate_id"),
    externalCategoryId: text("external_category_id"),
    commissionType: channelCommissionTypeEnum("commission_type").notNull(),
    amountCents: integer("amount_cents"),
    percentBasisPoints: integer("percent_basis_points"),
    validFrom: date("valid_from"),
    validTo: date("valid_to"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_channel_commission_rules_contract_created").on(table.contractId, table.createdAt),
    index("idx_channel_commission_rules_product_created").on(table.productId, table.createdAt),
    index("idx_channel_commission_rules_scope_created").on(table.scope, table.createdAt),
  ],
)

export const channelProductMappings = pgTable(
  "channel_product_mappings",
  {
    id: typeId("channel_product_mappings"),
    channelId: typeIdRef("channel_id")
      .notNull()
      .references(() => channels.id, { onDelete: "cascade" }),
    productId: typeIdRef("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    externalProductId: text("external_product_id"),
    externalRateId: text("external_rate_id"),
    externalCategoryId: text("external_category_id"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_channel_product_mappings_channel_created").on(table.channelId, table.createdAt),
    index("idx_channel_product_mappings_product_created").on(table.productId, table.createdAt),
    index("idx_channel_product_mappings_active_created").on(table.active, table.createdAt),
  ],
)

export const channelBookingLinks = pgTable(
  "channel_booking_links",
  {
    id: typeId("channel_booking_links"),
    channelId: typeIdRef("channel_id")
      .notNull()
      .references(() => channels.id, { onDelete: "cascade" }),
    bookingId: text("booking_id").notNull(),
    externalBookingId: text("external_booking_id"),
    externalReference: text("external_reference"),
    externalStatus: text("external_status"),
    bookedAtExternal: timestamp("booked_at_external", { withTimezone: true }),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_channel_booking_links_channel_created").on(table.channelId, table.createdAt),
    index("idx_channel_booking_links_booking_created").on(table.bookingId, table.createdAt),
    index("idx_channel_booking_links_external_booking_created").on(
      table.externalBookingId,
      table.createdAt,
    ),
  ],
)

export const channelWebhookEvents = pgTable(
  "channel_webhook_events",
  {
    id: typeId("channel_webhook_events"),
    channelId: typeIdRef("channel_id")
      .notNull()
      .references(() => channels.id, { onDelete: "cascade" }),
    eventType: text("event_type").notNull(),
    externalEventId: text("external_event_id"),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    status: channelWebhookStatusEnum("status").notNull().default("pending"),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_channel_webhook_events_channel_received").on(table.channelId, table.receivedAt),
    index("idx_channel_webhook_events_status_received").on(table.status, table.receivedAt),
    index("idx_channel_webhook_events_event_type_received").on(table.eventType, table.receivedAt),
    index("idx_channel_webhook_events_external_event").on(table.externalEventId),
  ],
)

export type Channel = typeof channels.$inferSelect
export type NewChannel = typeof channels.$inferInsert
export type ChannelContactProjection = typeof channelContactProjections.$inferSelect
export type NewChannelContactProjection = typeof channelContactProjections.$inferInsert
export type ChannelContract = typeof channelContracts.$inferSelect
export type NewChannelContract = typeof channelContracts.$inferInsert
export type ChannelCommissionRule = typeof channelCommissionRules.$inferSelect
export type NewChannelCommissionRule = typeof channelCommissionRules.$inferInsert
export type ChannelProductMapping = typeof channelProductMappings.$inferSelect
export type NewChannelProductMapping = typeof channelProductMappings.$inferInsert
export type ChannelBookingLink = typeof channelBookingLinks.$inferSelect
export type NewChannelBookingLink = typeof channelBookingLinks.$inferInsert
export type ChannelWebhookEvent = typeof channelWebhookEvents.$inferSelect
export type NewChannelWebhookEvent = typeof channelWebhookEvents.$inferInsert
