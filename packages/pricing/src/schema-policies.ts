import { typeId, typeIdRef } from "@voyantjs/db/lib/typeid-column"
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"

import { cancellationChargeTypeEnum, cancellationPolicyTypeEnum } from "./schema-shared"

export const cancellationPolicies = pgTable(
  "cancellation_policies",
  {
    id: typeId("cancellation_policies"),
    code: text("code"),
    name: text("name").notNull(),
    policyType: cancellationPolicyTypeEnum("policy_type").notNull().default("custom"),
    simpleCutoffHours: integer("simple_cutoff_hours"),
    isDefault: boolean("is_default").notNull().default(false),
    active: boolean("active").notNull().default(true),
    notes: text("notes"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_cancellation_policies_active").on(table.active),
    index("idx_cancellation_policies_default").on(table.isDefault),
    uniqueIndex("uidx_cancellation_policies_code").on(table.code),
  ],
)

export const cancellationPolicyRules = pgTable(
  "cancellation_policy_rules",
  {
    id: typeId("cancellation_policy_rules"),
    cancellationPolicyId: typeIdRef("cancellation_policy_id")
      .notNull()
      .references(() => cancellationPolicies.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
    cutoffMinutesBefore: integer("cutoff_minutes_before"),
    chargeType: cancellationChargeTypeEnum("charge_type").notNull().default("none"),
    chargeAmountCents: integer("charge_amount_cents"),
    chargePercentBasisPoints: integer("charge_percent_basis_points"),
    active: boolean("active").notNull().default(true),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_cancellation_policy_rules_policy").on(table.cancellationPolicyId),
    index("idx_cancellation_policy_rules_active").on(table.active),
  ],
)

export type CancellationPolicy = typeof cancellationPolicies.$inferSelect
export type NewCancellationPolicy = typeof cancellationPolicies.$inferInsert
export type CancellationPolicyRule = typeof cancellationPolicyRules.$inferSelect
export type NewCancellationPolicyRule = typeof cancellationPolicyRules.$inferInsert
