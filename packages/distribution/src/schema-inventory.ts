import { availabilitySlots, availabilityStartTimes } from "@voyantjs/availability/schema"
import { typeId, typeIdRef } from "@voyantjs/db/lib/typeid-column"
import { productOptions, products } from "@voyantjs/products/schema"
import { boolean, date, index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core"

import { channelContracts, channels } from "./schema-core"
import {
  channelAllotmentReleaseModeEnum,
  channelAllotmentUnsoldActionEnum,
  channelReleaseExecutionActionEnum,
  channelReleaseExecutionStatusEnum,
} from "./schema-shared"

export const channelInventoryAllotments = pgTable(
  "channel_inventory_allotments",
  {
    id: typeId("channel_inventory_allotments"),
    channelId: typeIdRef("channel_id")
      .notNull()
      .references(() => channels.id, { onDelete: "cascade" }),
    contractId: typeIdRef("contract_id").references(() => channelContracts.id, {
      onDelete: "set null",
    }),
    productId: typeIdRef("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    optionId: typeIdRef("option_id").references(() => productOptions.id, { onDelete: "set null" }),
    startTimeId: typeIdRef("start_time_id").references(() => availabilityStartTimes.id, {
      onDelete: "set null",
    }),
    validFrom: date("valid_from"),
    validTo: date("valid_to"),
    guaranteedCapacity: integer("guaranteed_capacity"),
    maxCapacity: integer("max_capacity"),
    active: boolean("active").notNull().default(true),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_channel_inventory_allotments_channel").on(table.channelId),
    index("idx_channel_inventory_allotments_contract").on(table.contractId),
    index("idx_channel_inventory_allotments_product").on(table.productId),
    index("idx_channel_inventory_allotments_option").on(table.optionId),
    index("idx_channel_inventory_allotments_start_time").on(table.startTimeId),
    index("idx_channel_inventory_allotments_active").on(table.active),
  ],
)

export const channelInventoryAllotmentTargets = pgTable(
  "channel_inventory_allotment_targets",
  {
    id: typeId("channel_inventory_allotment_targets"),
    allotmentId: typeIdRef("allotment_id")
      .notNull()
      .references(() => channelInventoryAllotments.id, { onDelete: "cascade" }),
    slotId: typeIdRef("slot_id").references(() => availabilitySlots.id, { onDelete: "cascade" }),
    startTimeId: typeIdRef("start_time_id").references(() => availabilityStartTimes.id, {
      onDelete: "set null",
    }),
    dateLocal: date("date_local"),
    guaranteedCapacity: integer("guaranteed_capacity"),
    maxCapacity: integer("max_capacity"),
    soldCapacity: integer("sold_capacity"),
    remainingCapacity: integer("remaining_capacity"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_channel_inventory_allotment_targets_allotment").on(table.allotmentId),
    index("idx_channel_inventory_allotment_targets_slot").on(table.slotId),
    index("idx_channel_inventory_allotment_targets_start_time").on(table.startTimeId),
    index("idx_channel_inventory_allotment_targets_date").on(table.dateLocal),
    index("idx_channel_inventory_allotment_targets_active").on(table.active),
  ],
)

export const channelInventoryReleaseRules = pgTable(
  "channel_inventory_release_rules",
  {
    id: typeId("channel_inventory_release_rules"),
    allotmentId: typeIdRef("allotment_id")
      .notNull()
      .references(() => channelInventoryAllotments.id, { onDelete: "cascade" }),
    releaseMode: channelAllotmentReleaseModeEnum("release_mode").notNull().default("automatic"),
    releaseDaysBeforeStart: integer("release_days_before_start"),
    releaseHoursBeforeStart: integer("release_hours_before_start"),
    unsoldAction: channelAllotmentUnsoldActionEnum("unsold_action")
      .notNull()
      .default("release_to_general_pool"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_channel_inventory_release_rules_allotment").on(table.allotmentId),
    index("idx_channel_inventory_release_rules_mode").on(table.releaseMode),
  ],
)

export const channelInventoryReleaseExecutions = pgTable(
  "channel_inventory_release_executions",
  {
    id: typeId("channel_inventory_release_executions"),
    allotmentId: typeIdRef("allotment_id")
      .notNull()
      .references(() => channelInventoryAllotments.id, { onDelete: "cascade" }),
    releaseRuleId: typeIdRef("release_rule_id").references(() => channelInventoryReleaseRules.id, {
      onDelete: "set null",
    }),
    targetId: typeIdRef("target_id").references(() => channelInventoryAllotmentTargets.id, {
      onDelete: "set null",
    }),
    slotId: typeIdRef("slot_id").references(() => availabilitySlots.id, { onDelete: "set null" }),
    actionTaken: channelReleaseExecutionActionEnum("action_taken").notNull().default("released"),
    status: channelReleaseExecutionStatusEnum("status").notNull().default("pending"),
    releasedCapacity: integer("released_capacity"),
    executedAt: timestamp("executed_at", { withTimezone: true }),
    notes: text("notes"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_channel_inventory_release_executions_allotment").on(table.allotmentId),
    index("idx_channel_inventory_release_executions_rule").on(table.releaseRuleId),
    index("idx_channel_inventory_release_executions_target").on(table.targetId),
    index("idx_channel_inventory_release_executions_status").on(table.status),
  ],
)

export type ChannelInventoryAllotment = typeof channelInventoryAllotments.$inferSelect
export type NewChannelInventoryAllotment = typeof channelInventoryAllotments.$inferInsert
export type ChannelInventoryAllotmentTarget = typeof channelInventoryAllotmentTargets.$inferSelect
export type NewChannelInventoryAllotmentTarget =
  typeof channelInventoryAllotmentTargets.$inferInsert
export type ChannelInventoryReleaseRule = typeof channelInventoryReleaseRules.$inferSelect
export type NewChannelInventoryReleaseRule = typeof channelInventoryReleaseRules.$inferInsert
export type ChannelInventoryReleaseExecution = typeof channelInventoryReleaseExecutions.$inferSelect
export type NewChannelInventoryReleaseExecution =
  typeof channelInventoryReleaseExecutions.$inferInsert
