import { typeId, typeIdRef } from "@voyantjs/db/lib/typeid-column"
import { boolean, index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core"

import { channelContracts, channels } from "./schema-core"
import { channelInventoryReleaseRules } from "./schema-inventory"
import {
  channelReconciliationPolicyFrequencyEnum,
  channelReleaseScheduleKindEnum,
  channelSettlementPolicyFrequencyEnum,
} from "./schema-shared"

export const channelSettlementPolicies = pgTable(
  "channel_settlement_policies",
  {
    id: typeId("channel_settlement_policies"),
    channelId: typeIdRef("channel_id")
      .notNull()
      .references(() => channels.id, { onDelete: "cascade" }),
    contractId: typeIdRef("contract_id").references(() => channelContracts.id, {
      onDelete: "set null",
    }),
    frequency: channelSettlementPolicyFrequencyEnum("frequency").notNull().default("manual"),
    autoGenerate: boolean("auto_generate").notNull().default(false),
    approvalRequired: boolean("approval_required").notNull().default(false),
    remittanceDaysAfterPeriodEnd: integer("remittance_days_after_period_end"),
    minimumPayoutAmountCents: integer("minimum_payout_amount_cents"),
    currencyCode: text("currency_code"),
    active: boolean("active").notNull().default(true),
    notes: text("notes"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_channel_settlement_policies_channel").on(table.channelId),
    index("idx_channel_settlement_policies_contract").on(table.contractId),
    index("idx_channel_settlement_policies_frequency").on(table.frequency),
    index("idx_channel_settlement_policies_active").on(table.active),
  ],
)

export const channelReconciliationPolicies = pgTable(
  "channel_reconciliation_policies",
  {
    id: typeId("channel_reconciliation_policies"),
    channelId: typeIdRef("channel_id")
      .notNull()
      .references(() => channels.id, { onDelete: "cascade" }),
    contractId: typeIdRef("contract_id").references(() => channelContracts.id, {
      onDelete: "set null",
    }),
    frequency: channelReconciliationPolicyFrequencyEnum("frequency").notNull().default("manual"),
    autoRun: boolean("auto_run").notNull().default(false),
    compareGrossAmounts: boolean("compare_gross_amounts").notNull().default(true),
    compareStatuses: boolean("compare_statuses").notNull().default(true),
    compareCancellations: boolean("compare_cancellations").notNull().default(true),
    amountToleranceCents: integer("amount_tolerance_cents"),
    active: boolean("active").notNull().default(true),
    notes: text("notes"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_channel_reconciliation_policies_channel").on(table.channelId),
    index("idx_channel_reconciliation_policies_contract").on(table.contractId),
    index("idx_channel_reconciliation_policies_frequency").on(table.frequency),
    index("idx_channel_reconciliation_policies_active").on(table.active),
  ],
)

export const channelReleaseSchedules = pgTable(
  "channel_release_schedules",
  {
    id: typeId("channel_release_schedules"),
    releaseRuleId: typeIdRef("release_rule_id")
      .notNull()
      .references(() => channelInventoryReleaseRules.id, { onDelete: "cascade" }),
    scheduleKind: channelReleaseScheduleKindEnum("schedule_kind").notNull().default("manual"),
    nextRunAt: timestamp("next_run_at", { withTimezone: true }),
    lastRunAt: timestamp("last_run_at", { withTimezone: true }),
    active: boolean("active").notNull().default(true),
    notes: text("notes"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_channel_release_schedules_rule").on(table.releaseRuleId),
    index("idx_channel_release_schedules_kind").on(table.scheduleKind),
    index("idx_channel_release_schedules_active").on(table.active),
  ],
)

export type ChannelSettlementPolicy = typeof channelSettlementPolicies.$inferSelect
export type NewChannelSettlementPolicy = typeof channelSettlementPolicies.$inferInsert
export type ChannelReconciliationPolicy = typeof channelReconciliationPolicies.$inferSelect
export type NewChannelReconciliationPolicy = typeof channelReconciliationPolicies.$inferInsert
export type ChannelReleaseSchedule = typeof channelReleaseSchedules.$inferSelect
export type NewChannelReleaseSchedule = typeof channelReleaseSchedules.$inferInsert
