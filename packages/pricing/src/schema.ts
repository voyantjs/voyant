import { typeId, typeIdRef } from "@voyantjs/db/lib/typeid-column"
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

export const pricingCategoryTypeEnum = pgEnum("pricing_category_type", [
  "adult",
  "child",
  "infant",
  "senior",
  "group",
  "room",
  "vehicle",
  "service",
  "other",
])

export const pricingDependencyTypeEnum = pgEnum("pricing_dependency_type", [
  "requires",
  "limits_per_master",
  "limits_sum",
  "excludes",
])

export const cancellationPolicyTypeEnum = pgEnum("cancellation_policy_type", [
  "simple",
  "advanced",
  "non_refundable",
  "custom",
])

export const cancellationChargeTypeEnum = pgEnum("cancellation_charge_type", [
  "none",
  "amount",
  "percentage",
])

export const priceCatalogTypeEnum = pgEnum("price_catalog_type", [
  "public",
  "contract",
  "net",
  "gross",
  "promo",
  "internal",
  "other",
])

export const optionPricingModeEnum = pgEnum("option_pricing_mode", [
  "per_person",
  "per_booking",
  "starting_from",
  "free",
  "on_request",
])

export const optionUnitPricingModeEnum = pgEnum("option_unit_pricing_mode", [
  "per_unit",
  "per_person",
  "per_booking",
  "included",
  "free",
  "on_request",
])

export const optionStartTimeRuleModeEnum = pgEnum("option_start_time_rule_mode", [
  "included",
  "excluded",
  "override",
  "adjustment",
])

export const priceAdjustmentTypeEnum = pgEnum("price_adjustment_type", ["fixed", "percentage"])

export const addonPricingModeEnum = pgEnum("addon_pricing_mode", [
  "included",
  "per_person",
  "per_booking",
  "on_request",
  "unavailable",
])

export const pricingCategories = pgTable(
  "pricing_categories",
  {
    id: typeId("pricing_categories"),
    productId: text("product_id"),
    optionId: text("option_id"),
    unitId: text("unit_id"),
    code: text("code"),
    name: text("name").notNull(),
    categoryType: pricingCategoryTypeEnum("category_type").notNull().default("other"),
    seatOccupancy: integer("seat_occupancy").notNull().default(1),
    groupSize: integer("group_size"),
    isAgeQualified: boolean("is_age_qualified").notNull().default(false),
    minAge: integer("min_age"),
    maxAge: integer("max_age"),
    internalUseOnly: boolean("internal_use_only").notNull().default(false),
    active: boolean("active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_pricing_categories_product").on(table.productId),
    index("idx_pricing_categories_option").on(table.optionId),
    index("idx_pricing_categories_unit").on(table.unitId),
    index("idx_pricing_categories_type").on(table.categoryType),
    index("idx_pricing_categories_active").on(table.active),
    uniqueIndex("uidx_pricing_categories_option_code").on(table.optionId, table.code),
  ],
)

export const pricingCategoryDependencies = pgTable(
  "pricing_category_dependencies",
  {
    id: typeId("pricing_category_dependencies"),
    pricingCategoryId: typeIdRef("pricing_category_id")
      .notNull()
      .references(() => pricingCategories.id, { onDelete: "cascade" }),
    masterPricingCategoryId: typeIdRef("master_pricing_category_id")
      .notNull()
      .references(() => pricingCategories.id, { onDelete: "cascade" }),
    dependencyType: pricingDependencyTypeEnum("dependency_type").notNull().default("requires"),
    maxPerMaster: integer("max_per_master"),
    maxDependentSum: integer("max_dependent_sum"),
    active: boolean("active").notNull().default(true),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_pricing_category_dependencies_category").on(table.pricingCategoryId),
    index("idx_pricing_category_dependencies_master").on(table.masterPricingCategoryId),
    uniqueIndex("uidx_pricing_category_dependencies_pair_type").on(
      table.pricingCategoryId,
      table.masterPricingCategoryId,
      table.dependencyType,
    ),
  ],
)

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

export const priceCatalogs = pgTable(
  "price_catalogs",
  {
    id: typeId("price_catalogs"),
    code: text("code").notNull(),
    name: text("name").notNull(),
    currencyCode: text("currency_code"),
    catalogType: priceCatalogTypeEnum("catalog_type").notNull().default("public"),
    isDefault: boolean("is_default").notNull().default(false),
    active: boolean("active").notNull().default(true),
    notes: text("notes"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("uidx_price_catalogs_code").on(table.code),
    index("idx_price_catalogs_currency").on(table.currencyCode),
    index("idx_price_catalogs_type").on(table.catalogType),
    index("idx_price_catalogs_active").on(table.active),
  ],
)

export const priceSchedules = pgTable(
  "price_schedules",
  {
    id: typeId("price_schedules"),
    priceCatalogId: typeIdRef("price_catalog_id")
      .notNull()
      .references(() => priceCatalogs.id, { onDelete: "cascade" }),
    code: text("code"),
    name: text("name").notNull(),
    recurrenceRule: text("recurrence_rule").notNull(),
    timezone: text("timezone"),
    validFrom: date("valid_from"),
    validTo: date("valid_to"),
    weekdays: jsonb("weekdays").$type<string[]>(),
    priority: integer("priority").notNull().default(0),
    active: boolean("active").notNull().default(true),
    notes: text("notes"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_price_schedules_catalog").on(table.priceCatalogId),
    index("idx_price_schedules_active").on(table.active),
    uniqueIndex("uidx_price_schedules_catalog_code").on(table.priceCatalogId, table.code),
  ],
)

export const optionPriceRules = pgTable(
  "option_price_rules",
  {
    id: typeId("option_price_rules"),
    productId: text("product_id").notNull(),
    optionId: text("option_id").notNull(),
    priceCatalogId: typeIdRef("price_catalog_id")
      .notNull()
      .references(() => priceCatalogs.id, { onDelete: "cascade" }),
    priceScheduleId: typeIdRef("price_schedule_id").references(() => priceSchedules.id, {
      onDelete: "set null",
    }),
    cancellationPolicyId: typeIdRef("cancellation_policy_id").references(
      () => cancellationPolicies.id,
      { onDelete: "set null" },
    ),
    code: text("code"),
    name: text("name").notNull(),
    description: text("description"),
    pricingMode: optionPricingModeEnum("pricing_mode").notNull().default("per_person"),
    baseSellAmountCents: integer("base_sell_amount_cents"),
    baseCostAmountCents: integer("base_cost_amount_cents"),
    minPerBooking: integer("min_per_booking"),
    maxPerBooking: integer("max_per_booking"),
    allPricingCategories: boolean("all_pricing_categories").notNull().default(true),
    isDefault: boolean("is_default").notNull().default(false),
    active: boolean("active").notNull().default(true),
    notes: text("notes"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_option_price_rules_product").on(table.productId),
    index("idx_option_price_rules_option").on(table.optionId),
    index("idx_option_price_rules_catalog").on(table.priceCatalogId),
    index("idx_option_price_rules_schedule").on(table.priceScheduleId),
    index("idx_option_price_rules_policy").on(table.cancellationPolicyId),
    index("idx_option_price_rules_active").on(table.active),
    uniqueIndex("uidx_option_price_rules_option_code").on(table.optionId, table.code),
  ],
)

export const optionUnitPriceRules = pgTable(
  "option_unit_price_rules",
  {
    id: typeId("option_unit_price_rules"),
    optionPriceRuleId: typeIdRef("option_price_rule_id")
      .notNull()
      .references(() => optionPriceRules.id, { onDelete: "cascade" }),
    optionId: text("option_id").notNull(),
    unitId: text("unit_id").notNull(),
    pricingCategoryId: typeIdRef("pricing_category_id").references(() => pricingCategories.id, {
      onDelete: "set null",
    }),
    pricingMode: optionUnitPricingModeEnum("pricing_mode").notNull().default("per_unit"),
    sellAmountCents: integer("sell_amount_cents"),
    costAmountCents: integer("cost_amount_cents"),
    minQuantity: integer("min_quantity"),
    maxQuantity: integer("max_quantity"),
    active: boolean("active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    notes: text("notes"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_option_unit_price_rules_rule").on(table.optionPriceRuleId),
    index("idx_option_unit_price_rules_option").on(table.optionId),
    index("idx_option_unit_price_rules_unit").on(table.unitId),
    index("idx_option_unit_price_rules_category").on(table.pricingCategoryId),
    index("idx_option_unit_price_rules_active").on(table.active),
  ],
)

export const optionStartTimeRules = pgTable(
  "option_start_time_rules",
  {
    id: typeId("option_start_time_rules"),
    optionPriceRuleId: typeIdRef("option_price_rule_id")
      .notNull()
      .references(() => optionPriceRules.id, { onDelete: "cascade" }),
    optionId: text("option_id").notNull(),
    startTimeId: text("start_time_id").notNull(),
    ruleMode: optionStartTimeRuleModeEnum("rule_mode").notNull().default("included"),
    adjustmentType: priceAdjustmentTypeEnum("adjustment_type"),
    sellAdjustmentCents: integer("sell_adjustment_cents"),
    costAdjustmentCents: integer("cost_adjustment_cents"),
    adjustmentBasisPoints: integer("adjustment_basis_points"),
    active: boolean("active").notNull().default(true),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_option_start_time_rules_rule").on(table.optionPriceRuleId),
    index("idx_option_start_time_rules_option").on(table.optionId),
    index("idx_option_start_time_rules_start_time").on(table.startTimeId),
    uniqueIndex("uidx_option_start_time_rules_rule_start_time").on(
      table.optionPriceRuleId,
      table.startTimeId,
    ),
  ],
)

export const optionUnitTiers = pgTable(
  "option_unit_tiers",
  {
    id: typeId("option_unit_tiers"),
    optionUnitPriceRuleId: typeIdRef("option_unit_price_rule_id")
      .notNull()
      .references(() => optionUnitPriceRules.id, { onDelete: "cascade" }),
    minQuantity: integer("min_quantity").notNull(),
    maxQuantity: integer("max_quantity"),
    sellAmountCents: integer("sell_amount_cents"),
    costAmountCents: integer("cost_amount_cents"),
    active: boolean("active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_option_unit_tiers_rule").on(table.optionUnitPriceRuleId),
    index("idx_option_unit_tiers_active").on(table.active),
  ],
)

export const pickupPriceRules = pgTable(
  "pickup_price_rules",
  {
    id: typeId("pickup_price_rules"),
    optionPriceRuleId: typeIdRef("option_price_rule_id")
      .notNull()
      .references(() => optionPriceRules.id, { onDelete: "cascade" }),
    optionId: text("option_id").notNull(),
    pickupPointId: text("pickup_point_id").notNull(),
    pricingMode: addonPricingModeEnum("pricing_mode").notNull().default("included"),
    sellAmountCents: integer("sell_amount_cents"),
    costAmountCents: integer("cost_amount_cents"),
    active: boolean("active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_pickup_price_rules_rule").on(table.optionPriceRuleId),
    index("idx_pickup_price_rules_option").on(table.optionId),
    index("idx_pickup_price_rules_pickup").on(table.pickupPointId),
    uniqueIndex("uidx_pickup_price_rules_rule_pickup").on(
      table.optionPriceRuleId,
      table.pickupPointId,
    ),
  ],
)

export const dropoffPriceRules = pgTable(
  "dropoff_price_rules",
  {
    id: typeId("dropoff_price_rules"),
    optionPriceRuleId: typeIdRef("option_price_rule_id")
      .notNull()
      .references(() => optionPriceRules.id, { onDelete: "cascade" }),
    optionId: text("option_id").notNull(),
    facilityId: text("facility_id"),
    dropoffCode: text("dropoff_code"),
    dropoffName: text("dropoff_name").notNull(),
    pricingMode: addonPricingModeEnum("pricing_mode").notNull().default("included"),
    sellAmountCents: integer("sell_amount_cents"),
    costAmountCents: integer("cost_amount_cents"),
    active: boolean("active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_dropoff_price_rules_rule").on(table.optionPriceRuleId),
    index("idx_dropoff_price_rules_option").on(table.optionId),
    index("idx_dropoff_price_rules_facility").on(table.facilityId),
  ],
)

export const extraPriceRules = pgTable(
  "extra_price_rules",
  {
    id: typeId("extra_price_rules"),
    optionPriceRuleId: typeIdRef("option_price_rule_id")
      .notNull()
      .references(() => optionPriceRules.id, { onDelete: "cascade" }),
    optionId: text("option_id").notNull(),
    productExtraId: text("product_extra_id"),
    optionExtraConfigId: text("option_extra_config_id"),
    pricingMode: addonPricingModeEnum("pricing_mode").notNull().default("included"),
    sellAmountCents: integer("sell_amount_cents"),
    costAmountCents: integer("cost_amount_cents"),
    active: boolean("active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    notes: text("notes"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_extra_price_rules_rule").on(table.optionPriceRuleId),
    index("idx_extra_price_rules_option").on(table.optionId),
    index("idx_extra_price_rules_product_extra").on(table.productExtraId),
    index("idx_extra_price_rules_option_extra_config").on(table.optionExtraConfigId),
  ],
)

export type PricingCategory = typeof pricingCategories.$inferSelect
export type NewPricingCategory = typeof pricingCategories.$inferInsert
export type PricingCategoryDependency = typeof pricingCategoryDependencies.$inferSelect
export type NewPricingCategoryDependency = typeof pricingCategoryDependencies.$inferInsert
export type CancellationPolicy = typeof cancellationPolicies.$inferSelect
export type NewCancellationPolicy = typeof cancellationPolicies.$inferInsert
export type CancellationPolicyRule = typeof cancellationPolicyRules.$inferSelect
export type NewCancellationPolicyRule = typeof cancellationPolicyRules.$inferInsert
export type PriceCatalog = typeof priceCatalogs.$inferSelect
export type NewPriceCatalog = typeof priceCatalogs.$inferInsert
export type PriceSchedule = typeof priceSchedules.$inferSelect
export type NewPriceSchedule = typeof priceSchedules.$inferInsert
export type OptionPriceRule = typeof optionPriceRules.$inferSelect
export type NewOptionPriceRule = typeof optionPriceRules.$inferInsert
export type OptionUnitPriceRule = typeof optionUnitPriceRules.$inferSelect
export type NewOptionUnitPriceRule = typeof optionUnitPriceRules.$inferInsert
export type OptionStartTimeRule = typeof optionStartTimeRules.$inferSelect
export type NewOptionStartTimeRule = typeof optionStartTimeRules.$inferInsert
export type OptionUnitTier = typeof optionUnitTiers.$inferSelect
export type NewOptionUnitTier = typeof optionUnitTiers.$inferInsert
export type PickupPriceRule = typeof pickupPriceRules.$inferSelect
export type NewPickupPriceRule = typeof pickupPriceRules.$inferInsert
export type DropoffPriceRule = typeof dropoffPriceRules.$inferSelect
export type NewDropoffPriceRule = typeof dropoffPriceRules.$inferInsert
export type ExtraPriceRule = typeof extraPriceRules.$inferSelect
export type NewExtraPriceRule = typeof extraPriceRules.$inferInsert

export const pricingCategoriesRelations = relations(pricingCategories, ({ many }) => ({
  childDependencies: many(pricingCategoryDependencies, { relationName: "pricingCategoryChild" }),
  masterDependencies: many(pricingCategoryDependencies, { relationName: "pricingCategoryMaster" }),
  unitPriceRules: many(optionUnitPriceRules),
}))

export const pricingCategoryDependenciesRelations = relations(
  pricingCategoryDependencies,
  ({ one }) => ({
    pricingCategory: one(pricingCategories, {
      relationName: "pricingCategoryChild",
      fields: [pricingCategoryDependencies.pricingCategoryId],
      references: [pricingCategories.id],
    }),
    masterPricingCategory: one(pricingCategories, {
      relationName: "pricingCategoryMaster",
      fields: [pricingCategoryDependencies.masterPricingCategoryId],
      references: [pricingCategories.id],
    }),
  }),
)

export const cancellationPoliciesRelations = relations(cancellationPolicies, ({ many }) => ({
  rules: many(cancellationPolicyRules),
  optionPriceRules: many(optionPriceRules),
}))

export const cancellationPolicyRulesRelations = relations(cancellationPolicyRules, ({ one }) => ({
  cancellationPolicy: one(cancellationPolicies, {
    fields: [cancellationPolicyRules.cancellationPolicyId],
    references: [cancellationPolicies.id],
  }),
}))

export const priceCatalogsRelations = relations(priceCatalogs, ({ many }) => ({
  schedules: many(priceSchedules),
  optionPriceRules: many(optionPriceRules),
}))

export const priceSchedulesRelations = relations(priceSchedules, ({ one, many }) => ({
  priceCatalog: one(priceCatalogs, {
    fields: [priceSchedules.priceCatalogId],
    references: [priceCatalogs.id],
  }),
  optionPriceRules: many(optionPriceRules),
}))

export const optionPriceRulesRelations = relations(optionPriceRules, ({ one, many }) => ({
  priceCatalog: one(priceCatalogs, {
    fields: [optionPriceRules.priceCatalogId],
    references: [priceCatalogs.id],
  }),
  priceSchedule: one(priceSchedules, {
    fields: [optionPriceRules.priceScheduleId],
    references: [priceSchedules.id],
  }),
  cancellationPolicy: one(cancellationPolicies, {
    fields: [optionPriceRules.cancellationPolicyId],
    references: [cancellationPolicies.id],
  }),
  unitRules: many(optionUnitPriceRules),
  startTimeRules: many(optionStartTimeRules),
  pickupRules: many(pickupPriceRules),
  dropoffRules: many(dropoffPriceRules),
  extraRules: many(extraPriceRules),
}))

export const optionUnitPriceRulesRelations = relations(optionUnitPriceRules, ({ one, many }) => ({
  optionPriceRule: one(optionPriceRules, {
    fields: [optionUnitPriceRules.optionPriceRuleId],
    references: [optionPriceRules.id],
  }),
  pricingCategory: one(pricingCategories, {
    fields: [optionUnitPriceRules.pricingCategoryId],
    references: [pricingCategories.id],
  }),
  tiers: many(optionUnitTiers),
}))

export const optionStartTimeRulesRelations = relations(optionStartTimeRules, ({ one }) => ({
  optionPriceRule: one(optionPriceRules, {
    fields: [optionStartTimeRules.optionPriceRuleId],
    references: [optionPriceRules.id],
  }),
}))

export const optionUnitTiersRelations = relations(optionUnitTiers, ({ one }) => ({
  optionUnitPriceRule: one(optionUnitPriceRules, {
    fields: [optionUnitTiers.optionUnitPriceRuleId],
    references: [optionUnitPriceRules.id],
  }),
}))

export const pickupPriceRulesRelations = relations(pickupPriceRules, ({ one }) => ({
  optionPriceRule: one(optionPriceRules, {
    fields: [pickupPriceRules.optionPriceRuleId],
    references: [optionPriceRules.id],
  }),
}))

export const dropoffPriceRulesRelations = relations(dropoffPriceRules, ({ one }) => ({
  optionPriceRule: one(optionPriceRules, {
    fields: [dropoffPriceRules.optionPriceRuleId],
    references: [optionPriceRules.id],
  }),
}))

export const extraPriceRulesRelations = relations(extraPriceRules, ({ one }) => ({
  optionPriceRule: one(optionPriceRules, {
    fields: [extraPriceRules.optionPriceRuleId],
    references: [optionPriceRules.id],
  }),
}))
