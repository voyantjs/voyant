import { availabilitySlots, availabilityStartTimes } from "@voyantjs/availability/schema"
import { typeId, typeIdRef } from "@voyantjs/db/lib/typeid-column"
import { productOptions, products } from "@voyantjs/products/schema"
import { suppliers } from "@voyantjs/suppliers/schema"
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
} from "drizzle-orm/pg-core"

export const channelKindEnum = pgEnum("channel_kind", [
  "direct",
  "affiliate",
  "ota",
  "reseller",
  "marketplace",
  "api_partner",
])

export const channelStatusEnum = pgEnum("channel_status", [
  "active",
  "inactive",
  "pending",
  "archived",
])

export const channelContractStatusEnum = pgEnum("channel_contract_status", [
  "draft",
  "active",
  "expired",
  "terminated",
])

export const distributionPaymentOwnerEnum = pgEnum("distribution_payment_owner", [
  "operator",
  "channel",
  "split",
])

export const distributionCancellationOwnerEnum = pgEnum("distribution_cancellation_owner", [
  "operator",
  "channel",
  "mixed",
])

export const channelCommissionScopeEnum = pgEnum("channel_commission_scope", [
  "booking",
  "product",
  "rate",
  "category",
])

export const channelCommissionTypeEnum = pgEnum("channel_commission_type", ["fixed", "percentage"])

export const channelWebhookStatusEnum = pgEnum("channel_webhook_status", [
  "pending",
  "processed",
  "failed",
  "ignored",
])

export const channelAllotmentReleaseModeEnum = pgEnum("channel_allotment_release_mode", [
  "automatic",
  "manual",
])

export const channelAllotmentUnsoldActionEnum = pgEnum("channel_allotment_unsold_action", [
  "release_to_general_pool",
  "expire",
  "retain",
])

export const channelSettlementRunStatusEnum = pgEnum("channel_settlement_run_status", [
  "draft",
  "open",
  "posted",
  "paid",
  "void",
])

export const channelSettlementItemStatusEnum = pgEnum("channel_settlement_item_status", [
  "pending",
  "approved",
  "disputed",
  "paid",
  "void",
])

export const channelReconciliationRunStatusEnum = pgEnum("channel_reconciliation_run_status", [
  "draft",
  "running",
  "completed",
  "archived",
])

export const channelReconciliationIssueTypeEnum = pgEnum("channel_reconciliation_issue_type", [
  "missing_booking",
  "status_mismatch",
  "amount_mismatch",
  "cancel_mismatch",
  "missing_payout",
  "other",
])

export const channelReconciliationSeverityEnum = pgEnum("channel_reconciliation_severity", [
  "info",
  "warning",
  "error",
])

export const channelReconciliationResolutionStatusEnum = pgEnum(
  "channel_reconciliation_resolution_status",
  ["open", "ignored", "resolved"],
)

export const channelReleaseExecutionStatusEnum = pgEnum("channel_release_execution_status", [
  "pending",
  "completed",
  "skipped",
  "failed",
])

export const channelReleaseExecutionActionEnum = pgEnum("channel_release_execution_action", [
  "released",
  "expired",
  "retained",
  "manual_override",
])

export const channelSettlementPolicyFrequencyEnum = pgEnum("channel_settlement_policy_frequency", [
  "manual",
  "daily",
  "weekly",
  "monthly",
])

export const channelReconciliationPolicyFrequencyEnum = pgEnum(
  "channel_reconciliation_policy_frequency",
  ["manual", "daily", "weekly", "monthly"],
)

export const channelReleaseScheduleKindEnum = pgEnum("channel_release_schedule_kind", [
  "manual",
  "hourly",
  "daily",
])

export const channelRemittanceExceptionStatusEnum = pgEnum("channel_remittance_exception_status", [
  "open",
  "investigating",
  "resolved",
  "ignored",
])

export const channelSettlementApprovalStatusEnum = pgEnum("channel_settlement_approval_status", [
  "pending",
  "approved",
  "rejected",
])

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
    index("idx_channels_kind").on(table.kind),
    index("idx_channels_status").on(table.status),
  ],
)

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
    index("idx_channel_contracts_channel").on(table.channelId),
    index("idx_channel_contracts_supplier").on(table.supplierId),
    index("idx_channel_contracts_status").on(table.status),
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
    index("idx_channel_commission_rules_contract").on(table.contractId),
    index("idx_channel_commission_rules_product").on(table.productId),
    index("idx_channel_commission_rules_scope").on(table.scope),
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
    index("idx_channel_product_mappings_channel").on(table.channelId),
    index("idx_channel_product_mappings_product").on(table.productId),
    index("idx_channel_product_mappings_active").on(table.active),
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
    index("idx_channel_booking_links_channel").on(table.channelId),
    index("idx_channel_booking_links_booking").on(table.bookingId),
    index("idx_channel_booking_links_external_booking").on(table.externalBookingId),
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
    index("idx_channel_webhook_events_channel").on(table.channelId),
    index("idx_channel_webhook_events_status").on(table.status),
    index("idx_channel_webhook_events_external_event").on(table.externalEventId),
  ],
)

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

export const channelSettlementRuns = pgTable(
  "channel_settlement_runs",
  {
    id: typeId("channel_settlement_runs"),
    channelId: typeIdRef("channel_id")
      .notNull()
      .references(() => channels.id, { onDelete: "cascade" }),
    contractId: typeIdRef("contract_id").references(() => channelContracts.id, {
      onDelete: "set null",
    }),
    status: channelSettlementRunStatusEnum("status").notNull().default("draft"),
    currencyCode: text("currency_code"),
    periodStart: date("period_start"),
    periodEnd: date("period_end"),
    statementReference: text("statement_reference"),
    generatedAt: timestamp("generated_at", { withTimezone: true }),
    postedAt: timestamp("posted_at", { withTimezone: true }),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    notes: text("notes"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_channel_settlement_runs_channel").on(table.channelId),
    index("idx_channel_settlement_runs_contract").on(table.contractId),
    index("idx_channel_settlement_runs_status").on(table.status),
    index("idx_channel_settlement_runs_period").on(table.periodStart, table.periodEnd),
  ],
)

export const channelSettlementItems = pgTable(
  "channel_settlement_items",
  {
    id: typeId("channel_settlement_items"),
    settlementRunId: typeIdRef("settlement_run_id")
      .notNull()
      .references(() => channelSettlementRuns.id, { onDelete: "cascade" }),
    bookingLinkId: typeIdRef("booking_link_id").references(() => channelBookingLinks.id, {
      onDelete: "set null",
    }),
    bookingId: text("booking_id"),
    commissionRuleId: typeIdRef("commission_rule_id").references(() => channelCommissionRules.id, {
      onDelete: "set null",
    }),
    status: channelSettlementItemStatusEnum("status").notNull().default("pending"),
    grossAmountCents: integer("gross_amount_cents").notNull().default(0),
    commissionAmountCents: integer("commission_amount_cents").notNull().default(0),
    netRemittanceAmountCents: integer("net_remittance_amount_cents").notNull().default(0),
    currencyCode: text("currency_code"),
    remittanceDueAt: timestamp("remittance_due_at", { withTimezone: true }),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_channel_settlement_items_run").on(table.settlementRunId),
    index("idx_channel_settlement_items_booking_link").on(table.bookingLinkId),
    index("idx_channel_settlement_items_booking").on(table.bookingId),
    index("idx_channel_settlement_items_status").on(table.status),
  ],
)

export const channelReconciliationRuns = pgTable(
  "channel_reconciliation_runs",
  {
    id: typeId("channel_reconciliation_runs"),
    channelId: typeIdRef("channel_id")
      .notNull()
      .references(() => channels.id, { onDelete: "cascade" }),
    contractId: typeIdRef("contract_id").references(() => channelContracts.id, {
      onDelete: "set null",
    }),
    status: channelReconciliationRunStatusEnum("status").notNull().default("draft"),
    periodStart: date("period_start"),
    periodEnd: date("period_end"),
    externalReportReference: text("external_report_reference"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    notes: text("notes"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_channel_reconciliation_runs_channel").on(table.channelId),
    index("idx_channel_reconciliation_runs_contract").on(table.contractId),
    index("idx_channel_reconciliation_runs_status").on(table.status),
  ],
)

export const channelReconciliationItems = pgTable(
  "channel_reconciliation_items",
  {
    id: typeId("channel_reconciliation_items"),
    reconciliationRunId: typeIdRef("reconciliation_run_id")
      .notNull()
      .references(() => channelReconciliationRuns.id, { onDelete: "cascade" }),
    bookingLinkId: typeIdRef("booking_link_id").references(() => channelBookingLinks.id, {
      onDelete: "set null",
    }),
    bookingId: text("booking_id"),
    externalBookingId: text("external_booking_id"),
    issueType: channelReconciliationIssueTypeEnum("issue_type").notNull().default("other"),
    severity: channelReconciliationSeverityEnum("severity").notNull().default("warning"),
    resolutionStatus: channelReconciliationResolutionStatusEnum("resolution_status")
      .notNull()
      .default("open"),
    notes: text("notes"),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_channel_reconciliation_items_run").on(table.reconciliationRunId),
    index("idx_channel_reconciliation_items_booking_link").on(table.bookingLinkId),
    index("idx_channel_reconciliation_items_booking").on(table.bookingId),
    index("idx_channel_reconciliation_items_issue").on(table.issueType),
    index("idx_channel_reconciliation_items_resolution").on(table.resolutionStatus),
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

export const channelRemittanceExceptions = pgTable(
  "channel_remittance_exceptions",
  {
    id: typeId("channel_remittance_exceptions"),
    channelId: typeIdRef("channel_id")
      .notNull()
      .references(() => channels.id, { onDelete: "cascade" }),
    settlementItemId: typeIdRef("settlement_item_id").references(() => channelSettlementItems.id, {
      onDelete: "set null",
    }),
    reconciliationItemId: typeIdRef("reconciliation_item_id").references(
      () => channelReconciliationItems.id,
      { onDelete: "set null" },
    ),
    exceptionType: text("exception_type").notNull(),
    severity: channelReconciliationSeverityEnum("severity").notNull().default("warning"),
    status: channelRemittanceExceptionStatusEnum("status").notNull().default("open"),
    openedAt: timestamp("opened_at", { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    notes: text("notes"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_channel_remittance_exceptions_channel").on(table.channelId),
    index("idx_channel_remittance_exceptions_settlement_item").on(table.settlementItemId),
    index("idx_channel_remittance_exceptions_reconciliation_item").on(table.reconciliationItemId),
    index("idx_channel_remittance_exceptions_status").on(table.status),
  ],
)

export const channelSettlementApprovals = pgTable(
  "channel_settlement_approvals",
  {
    id: typeId("channel_settlement_approvals"),
    settlementRunId: typeIdRef("settlement_run_id")
      .notNull()
      .references(() => channelSettlementRuns.id, { onDelete: "cascade" }),
    approverUserId: text("approver_user_id"),
    status: channelSettlementApprovalStatusEnum("status").notNull().default("pending"),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    notes: text("notes"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_channel_settlement_approvals_run").on(table.settlementRunId),
    index("idx_channel_settlement_approvals_status").on(table.status),
  ],
)

export type Channel = typeof channels.$inferSelect
export type NewChannel = typeof channels.$inferInsert
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
export type ChannelInventoryAllotment = typeof channelInventoryAllotments.$inferSelect
export type NewChannelInventoryAllotment = typeof channelInventoryAllotments.$inferInsert
export type ChannelInventoryAllotmentTarget = typeof channelInventoryAllotmentTargets.$inferSelect
export type NewChannelInventoryAllotmentTarget =
  typeof channelInventoryAllotmentTargets.$inferInsert
export type ChannelInventoryReleaseRule = typeof channelInventoryReleaseRules.$inferSelect
export type NewChannelInventoryReleaseRule = typeof channelInventoryReleaseRules.$inferInsert
export type ChannelSettlementRun = typeof channelSettlementRuns.$inferSelect
export type NewChannelSettlementRun = typeof channelSettlementRuns.$inferInsert
export type ChannelSettlementItem = typeof channelSettlementItems.$inferSelect
export type NewChannelSettlementItem = typeof channelSettlementItems.$inferInsert
export type ChannelReconciliationRun = typeof channelReconciliationRuns.$inferSelect
export type NewChannelReconciliationRun = typeof channelReconciliationRuns.$inferInsert
export type ChannelReconciliationItem = typeof channelReconciliationItems.$inferSelect
export type NewChannelReconciliationItem = typeof channelReconciliationItems.$inferInsert
export type ChannelInventoryReleaseExecution = typeof channelInventoryReleaseExecutions.$inferSelect
export type NewChannelInventoryReleaseExecution =
  typeof channelInventoryReleaseExecutions.$inferInsert
export type ChannelSettlementPolicy = typeof channelSettlementPolicies.$inferSelect
export type NewChannelSettlementPolicy = typeof channelSettlementPolicies.$inferInsert
export type ChannelReconciliationPolicy = typeof channelReconciliationPolicies.$inferSelect
export type NewChannelReconciliationPolicy = typeof channelReconciliationPolicies.$inferInsert
export type ChannelReleaseSchedule = typeof channelReleaseSchedules.$inferSelect
export type NewChannelReleaseSchedule = typeof channelReleaseSchedules.$inferInsert
export type ChannelRemittanceException = typeof channelRemittanceExceptions.$inferSelect
export type NewChannelRemittanceException = typeof channelRemittanceExceptions.$inferInsert
export type ChannelSettlementApproval = typeof channelSettlementApprovals.$inferSelect
export type NewChannelSettlementApproval = typeof channelSettlementApprovals.$inferInsert

export const channelsRelations = relations(channels, ({ many }) => ({
  contracts: many(channelContracts),
  productMappings: many(channelProductMappings),
  bookingLinks: many(channelBookingLinks),
  webhookEvents: many(channelWebhookEvents),
  inventoryAllotments: many(channelInventoryAllotments),
  settlementRuns: many(channelSettlementRuns),
  reconciliationRuns: many(channelReconciliationRuns),
  settlementPolicies: many(channelSettlementPolicies),
  reconciliationPolicies: many(channelReconciliationPolicies),
  remittanceExceptions: many(channelRemittanceExceptions),
}))

export const channelContractsRelations = relations(channelContracts, ({ one, many }) => ({
  channel: one(channels, { fields: [channelContracts.channelId], references: [channels.id] }),
  supplier: one(suppliers, {
    fields: [channelContracts.supplierId],
    references: [suppliers.id],
  }),
  commissionRules: many(channelCommissionRules),
  inventoryAllotments: many(channelInventoryAllotments),
  settlementRuns: many(channelSettlementRuns),
  reconciliationRuns: many(channelReconciliationRuns),
}))

export const channelCommissionRulesRelations = relations(channelCommissionRules, ({ one }) => ({
  contract: one(channelContracts, {
    fields: [channelCommissionRules.contractId],
    references: [channelContracts.id],
  }),
  product: one(products, {
    fields: [channelCommissionRules.productId],
    references: [products.id],
  }),
}))

export const channelProductMappingsRelations = relations(channelProductMappings, ({ one }) => ({
  channel: one(channels, {
    fields: [channelProductMappings.channelId],
    references: [channels.id],
  }),
  product: one(products, {
    fields: [channelProductMappings.productId],
    references: [products.id],
  }),
}))

export const channelBookingLinksRelations = relations(channelBookingLinks, ({ one }) => ({
  channel: one(channels, {
    fields: [channelBookingLinks.channelId],
    references: [channels.id],
  }),
}))

export const channelInventoryAllotmentsRelations = relations(
  channelInventoryAllotments,
  ({ one, many }) => ({
    channel: one(channels, {
      fields: [channelInventoryAllotments.channelId],
      references: [channels.id],
    }),
    contract: one(channelContracts, {
      fields: [channelInventoryAllotments.contractId],
      references: [channelContracts.id],
    }),
    product: one(products, {
      fields: [channelInventoryAllotments.productId],
      references: [products.id],
    }),
    option: one(productOptions, {
      fields: [channelInventoryAllotments.optionId],
      references: [productOptions.id],
    }),
    startTime: one(availabilityStartTimes, {
      fields: [channelInventoryAllotments.startTimeId],
      references: [availabilityStartTimes.id],
    }),
    targets: many(channelInventoryAllotmentTargets),
    releaseRules: many(channelInventoryReleaseRules),
    releaseExecutions: many(channelInventoryReleaseExecutions),
  }),
)

export const channelInventoryAllotmentTargetsRelations = relations(
  channelInventoryAllotmentTargets,
  ({ one }) => ({
    allotment: one(channelInventoryAllotments, {
      fields: [channelInventoryAllotmentTargets.allotmentId],
      references: [channelInventoryAllotments.id],
    }),
    slot: one(availabilitySlots, {
      fields: [channelInventoryAllotmentTargets.slotId],
      references: [availabilitySlots.id],
    }),
    startTime: one(availabilityStartTimes, {
      fields: [channelInventoryAllotmentTargets.startTimeId],
      references: [availabilityStartTimes.id],
    }),
  }),
)

export const channelInventoryReleaseRulesRelations = relations(
  channelInventoryReleaseRules,
  ({ one, many }) => ({
    allotment: one(channelInventoryAllotments, {
      fields: [channelInventoryReleaseRules.allotmentId],
      references: [channelInventoryAllotments.id],
    }),
    schedules: many(channelReleaseSchedules),
  }),
)

export const channelSettlementRunsRelations = relations(channelSettlementRuns, ({ one, many }) => ({
  channel: one(channels, {
    fields: [channelSettlementRuns.channelId],
    references: [channels.id],
  }),
  contract: one(channelContracts, {
    fields: [channelSettlementRuns.contractId],
    references: [channelContracts.id],
  }),
  items: many(channelSettlementItems),
  approvals: many(channelSettlementApprovals),
}))

export const channelSettlementItemsRelations = relations(channelSettlementItems, ({ one }) => ({
  settlementRun: one(channelSettlementRuns, {
    fields: [channelSettlementItems.settlementRunId],
    references: [channelSettlementRuns.id],
  }),
  bookingLink: one(channelBookingLinks, {
    fields: [channelSettlementItems.bookingLinkId],
    references: [channelBookingLinks.id],
  }),
  commissionRule: one(channelCommissionRules, {
    fields: [channelSettlementItems.commissionRuleId],
    references: [channelCommissionRules.id],
  }),
}))

export const channelReconciliationRunsRelations = relations(
  channelReconciliationRuns,
  ({ one, many }) => ({
    channel: one(channels, {
      fields: [channelReconciliationRuns.channelId],
      references: [channels.id],
    }),
    contract: one(channelContracts, {
      fields: [channelReconciliationRuns.contractId],
      references: [channelContracts.id],
    }),
    items: many(channelReconciliationItems),
  }),
)

export const channelReconciliationItemsRelations = relations(
  channelReconciliationItems,
  ({ one }) => ({
    reconciliationRun: one(channelReconciliationRuns, {
      fields: [channelReconciliationItems.reconciliationRunId],
      references: [channelReconciliationRuns.id],
    }),
    bookingLink: one(channelBookingLinks, {
      fields: [channelReconciliationItems.bookingLinkId],
      references: [channelBookingLinks.id],
    }),
  }),
)

export const channelInventoryReleaseExecutionsRelations = relations(
  channelInventoryReleaseExecutions,
  ({ one }) => ({
    allotment: one(channelInventoryAllotments, {
      fields: [channelInventoryReleaseExecutions.allotmentId],
      references: [channelInventoryAllotments.id],
    }),
    releaseRule: one(channelInventoryReleaseRules, {
      fields: [channelInventoryReleaseExecutions.releaseRuleId],
      references: [channelInventoryReleaseRules.id],
    }),
    target: one(channelInventoryAllotmentTargets, {
      fields: [channelInventoryReleaseExecutions.targetId],
      references: [channelInventoryAllotmentTargets.id],
    }),
    slot: one(availabilitySlots, {
      fields: [channelInventoryReleaseExecutions.slotId],
      references: [availabilitySlots.id],
    }),
  }),
)

export const channelSettlementPoliciesRelations = relations(
  channelSettlementPolicies,
  ({ one }) => ({
    channel: one(channels, {
      fields: [channelSettlementPolicies.channelId],
      references: [channels.id],
    }),
    contract: one(channelContracts, {
      fields: [channelSettlementPolicies.contractId],
      references: [channelContracts.id],
    }),
  }),
)

export const channelReconciliationPoliciesRelations = relations(
  channelReconciliationPolicies,
  ({ one }) => ({
    channel: one(channels, {
      fields: [channelReconciliationPolicies.channelId],
      references: [channels.id],
    }),
    contract: one(channelContracts, {
      fields: [channelReconciliationPolicies.contractId],
      references: [channelContracts.id],
    }),
  }),
)

export const channelReleaseSchedulesRelations = relations(channelReleaseSchedules, ({ one }) => ({
  releaseRule: one(channelInventoryReleaseRules, {
    fields: [channelReleaseSchedules.releaseRuleId],
    references: [channelInventoryReleaseRules.id],
  }),
}))

export const channelRemittanceExceptionsRelations = relations(
  channelRemittanceExceptions,
  ({ one }) => ({
    channel: one(channels, {
      fields: [channelRemittanceExceptions.channelId],
      references: [channels.id],
    }),
    settlementItem: one(channelSettlementItems, {
      fields: [channelRemittanceExceptions.settlementItemId],
      references: [channelSettlementItems.id],
    }),
    reconciliationItem: one(channelReconciliationItems, {
      fields: [channelRemittanceExceptions.reconciliationItemId],
      references: [channelReconciliationItems.id],
    }),
  }),
)

export const channelSettlementApprovalsRelations = relations(
  channelSettlementApprovals,
  ({ one }) => ({
    settlementRun: one(channelSettlementRuns, {
      fields: [channelSettlementApprovals.settlementRunId],
      references: [channelSettlementRuns.id],
    }),
  }),
)

export const channelWebhookEventsRelations = relations(channelWebhookEvents, ({ one }) => ({
  channel: one(channels, {
    fields: [channelWebhookEvents.channelId],
    references: [channels.id],
  }),
}))
