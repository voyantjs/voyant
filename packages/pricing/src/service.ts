import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import type { z } from "zod"

import {
  cancellationPolicies,
  cancellationPolicyRules,
  dropoffPriceRules,
  extraPriceRules,
  optionPriceRules,
  optionStartTimeRules,
  optionUnitPriceRules,
  optionUnitTiers,
  pickupPriceRules,
  priceCatalogs,
  priceSchedules,
  pricingCategories,
  pricingCategoryDependencies,
} from "./schema.js"
import type {
  cancellationPolicyListQuerySchema,
  cancellationPolicyRuleListQuerySchema,
  dropoffPriceRuleListQuerySchema,
  extraPriceRuleListQuerySchema,
  insertCancellationPolicyRuleSchema,
  insertCancellationPolicySchema,
  insertDropoffPriceRuleSchema,
  insertExtraPriceRuleSchema,
  insertOptionPriceRuleSchema,
  insertOptionStartTimeRuleSchema,
  insertOptionUnitPriceRuleSchema,
  insertOptionUnitTierSchema,
  insertPickupPriceRuleSchema,
  insertPriceCatalogSchema,
  insertPriceScheduleSchema,
  insertPricingCategoryDependencySchema,
  insertPricingCategorySchema,
  optionPriceRuleListQuerySchema,
  optionStartTimeRuleListQuerySchema,
  optionUnitPriceRuleListQuerySchema,
  optionUnitTierListQuerySchema,
  pickupPriceRuleListQuerySchema,
  priceCatalogListQuerySchema,
  priceScheduleListQuerySchema,
  pricingCategoryDependencyListQuerySchema,
  pricingCategoryListQuerySchema,
  updateCancellationPolicyRuleSchema,
  updateCancellationPolicySchema,
  updateDropoffPriceRuleSchema,
  updateExtraPriceRuleSchema,
  updateOptionPriceRuleSchema,
  updateOptionStartTimeRuleSchema,
  updateOptionUnitPriceRuleSchema,
  updateOptionUnitTierSchema,
  updatePickupPriceRuleSchema,
  updatePriceCatalogSchema,
  updatePriceScheduleSchema,
  updatePricingCategoryDependencySchema,
  updatePricingCategorySchema,
} from "./validation.js"

type PricingCategoryListQuery = z.infer<typeof pricingCategoryListQuerySchema>
type PricingCategoryDependencyListQuery = z.infer<typeof pricingCategoryDependencyListQuerySchema>
type CancellationPolicyListQuery = z.infer<typeof cancellationPolicyListQuerySchema>
type CancellationPolicyRuleListQuery = z.infer<typeof cancellationPolicyRuleListQuerySchema>
type PriceCatalogListQuery = z.infer<typeof priceCatalogListQuerySchema>
type PriceScheduleListQuery = z.infer<typeof priceScheduleListQuerySchema>
type OptionPriceRuleListQuery = z.infer<typeof optionPriceRuleListQuerySchema>
type OptionUnitPriceRuleListQuery = z.infer<typeof optionUnitPriceRuleListQuerySchema>
type OptionStartTimeRuleListQuery = z.infer<typeof optionStartTimeRuleListQuerySchema>
type OptionUnitTierListQuery = z.infer<typeof optionUnitTierListQuerySchema>
type PickupPriceRuleListQuery = z.infer<typeof pickupPriceRuleListQuerySchema>
type DropoffPriceRuleListQuery = z.infer<typeof dropoffPriceRuleListQuerySchema>
type ExtraPriceRuleListQuery = z.infer<typeof extraPriceRuleListQuerySchema>

type CreatePricingCategoryInput = z.infer<typeof insertPricingCategorySchema>
type UpdatePricingCategoryInput = z.infer<typeof updatePricingCategorySchema>
type CreatePricingCategoryDependencyInput = z.infer<typeof insertPricingCategoryDependencySchema>
type UpdatePricingCategoryDependencyInput = z.infer<typeof updatePricingCategoryDependencySchema>
type CreateCancellationPolicyInput = z.infer<typeof insertCancellationPolicySchema>
type UpdateCancellationPolicyInput = z.infer<typeof updateCancellationPolicySchema>
type CreateCancellationPolicyRuleInput = z.infer<typeof insertCancellationPolicyRuleSchema>
type UpdateCancellationPolicyRuleInput = z.infer<typeof updateCancellationPolicyRuleSchema>
type CreatePriceCatalogInput = z.infer<typeof insertPriceCatalogSchema>
type UpdatePriceCatalogInput = z.infer<typeof updatePriceCatalogSchema>
type CreatePriceScheduleInput = z.infer<typeof insertPriceScheduleSchema>
type UpdatePriceScheduleInput = z.infer<typeof updatePriceScheduleSchema>
type CreateOptionPriceRuleInput = z.infer<typeof insertOptionPriceRuleSchema>
type UpdateOptionPriceRuleInput = z.infer<typeof updateOptionPriceRuleSchema>
type CreateOptionUnitPriceRuleInput = z.infer<typeof insertOptionUnitPriceRuleSchema>
type UpdateOptionUnitPriceRuleInput = z.infer<typeof updateOptionUnitPriceRuleSchema>
type CreateOptionStartTimeRuleInput = z.infer<typeof insertOptionStartTimeRuleSchema>
type UpdateOptionStartTimeRuleInput = z.infer<typeof updateOptionStartTimeRuleSchema>
type CreateOptionUnitTierInput = z.infer<typeof insertOptionUnitTierSchema>
type UpdateOptionUnitTierInput = z.infer<typeof updateOptionUnitTierSchema>
type CreatePickupPriceRuleInput = z.infer<typeof insertPickupPriceRuleSchema>
type UpdatePickupPriceRuleInput = z.infer<typeof updatePickupPriceRuleSchema>
type CreateDropoffPriceRuleInput = z.infer<typeof insertDropoffPriceRuleSchema>
type UpdateDropoffPriceRuleInput = z.infer<typeof updateDropoffPriceRuleSchema>
type CreateExtraPriceRuleInput = z.infer<typeof insertExtraPriceRuleSchema>
type UpdateExtraPriceRuleInput = z.infer<typeof updateExtraPriceRuleSchema>

async function paginate<T extends object>(
  rowsQuery: Promise<T[]>,
  countQuery: Promise<Array<{ count: number }>>,
  limit: number,
  offset: number,
) {
  const [data, countResult] = await Promise.all([rowsQuery, countQuery])
  return { data, total: countResult[0]?.count ?? 0, limit, offset }
}

export const pricingService = {
  async listPricingCategories(db: PostgresJsDatabase, query: PricingCategoryListQuery) {
    const conditions = []
    if (query.productId) conditions.push(eq(pricingCategories.productId, query.productId))
    if (query.optionId) conditions.push(eq(pricingCategories.optionId, query.optionId))
    if (query.unitId) conditions.push(eq(pricingCategories.unitId, query.unitId))
    if (query.categoryType) conditions.push(eq(pricingCategories.categoryType, query.categoryType))
    if (query.active !== undefined) conditions.push(eq(pricingCategories.active, query.active))
    const where = conditions.length ? and(...conditions) : undefined
    return paginate(
      db
        .select()
        .from(pricingCategories)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(asc(pricingCategories.sortOrder), asc(pricingCategories.name)),
      db.select({ count: sql<number>`count(*)::int` }).from(pricingCategories).where(where),
      query.limit,
      query.offset,
    )
  },

  async getPricingCategoryById(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .select()
      .from(pricingCategories)
      .where(eq(pricingCategories.id, id))
      .limit(1)
    return row ?? null
  },

  async createPricingCategory(db: PostgresJsDatabase, data: CreatePricingCategoryInput) {
    const [row] = await db.insert(pricingCategories).values(data).returning()
    return row ?? null
  },

  async updatePricingCategory(
    db: PostgresJsDatabase,
    id: string,
    data: UpdatePricingCategoryInput,
  ) {
    const [row] = await db
      .update(pricingCategories)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(pricingCategories.id, id))
      .returning()
    return row ?? null
  },

  async deletePricingCategory(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(pricingCategories)
      .where(eq(pricingCategories.id, id))
      .returning({ id: pricingCategories.id })
    return row ?? null
  },

  async listPricingCategoryDependencies(
    db: PostgresJsDatabase,
    query: PricingCategoryDependencyListQuery,
  ) {
    const conditions = []
    if (query.pricingCategoryId)
      conditions.push(eq(pricingCategoryDependencies.pricingCategoryId, query.pricingCategoryId))
    if (query.masterPricingCategoryId)
      conditions.push(
        eq(pricingCategoryDependencies.masterPricingCategoryId, query.masterPricingCategoryId),
      )
    if (query.dependencyType)
      conditions.push(eq(pricingCategoryDependencies.dependencyType, query.dependencyType))
    if (query.active !== undefined)
      conditions.push(eq(pricingCategoryDependencies.active, query.active))
    const where = conditions.length ? and(...conditions) : undefined
    return paginate(
      db
        .select()
        .from(pricingCategoryDependencies)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(asc(pricingCategoryDependencies.createdAt)),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(pricingCategoryDependencies)
        .where(where),
      query.limit,
      query.offset,
    )
  },

  async getPricingCategoryDependencyById(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .select()
      .from(pricingCategoryDependencies)
      .where(eq(pricingCategoryDependencies.id, id))
      .limit(1)
    return row ?? null
  },

  async createPricingCategoryDependency(
    db: PostgresJsDatabase,
    data: CreatePricingCategoryDependencyInput,
  ) {
    const [row] = await db.insert(pricingCategoryDependencies).values(data).returning()
    return row ?? null
  },

  async updatePricingCategoryDependency(
    db: PostgresJsDatabase,
    id: string,
    data: UpdatePricingCategoryDependencyInput,
  ) {
    const [row] = await db
      .update(pricingCategoryDependencies)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(pricingCategoryDependencies.id, id))
      .returning()
    return row ?? null
  },

  async deletePricingCategoryDependency(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(pricingCategoryDependencies)
      .where(eq(pricingCategoryDependencies.id, id))
      .returning({ id: pricingCategoryDependencies.id })
    return row ?? null
  },

  async listCancellationPolicies(db: PostgresJsDatabase, query: CancellationPolicyListQuery) {
    const conditions = []
    if (query.policyType) conditions.push(eq(cancellationPolicies.policyType, query.policyType))
    if (query.active !== undefined) conditions.push(eq(cancellationPolicies.active, query.active))
    if (query.isDefault !== undefined)
      conditions.push(eq(cancellationPolicies.isDefault, query.isDefault))
    if (query.search) {
      const term = `%${query.search}%`
      conditions.push(
        or(ilike(cancellationPolicies.name, term), ilike(cancellationPolicies.code, term)),
      )
    }
    const where = conditions.length ? and(...conditions) : undefined
    return paginate(
      db
        .select()
        .from(cancellationPolicies)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(desc(cancellationPolicies.updatedAt)),
      db.select({ count: sql<number>`count(*)::int` }).from(cancellationPolicies).where(where),
      query.limit,
      query.offset,
    )
  },

  async getCancellationPolicyById(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .select()
      .from(cancellationPolicies)
      .where(eq(cancellationPolicies.id, id))
      .limit(1)
    return row ?? null
  },

  async createCancellationPolicy(db: PostgresJsDatabase, data: CreateCancellationPolicyInput) {
    const [row] = await db.insert(cancellationPolicies).values(data).returning()
    return row ?? null
  },

  async updateCancellationPolicy(
    db: PostgresJsDatabase,
    id: string,
    data: UpdateCancellationPolicyInput,
  ) {
    const [row] = await db
      .update(cancellationPolicies)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(cancellationPolicies.id, id))
      .returning()
    return row ?? null
  },

  async deleteCancellationPolicy(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(cancellationPolicies)
      .where(eq(cancellationPolicies.id, id))
      .returning({ id: cancellationPolicies.id })
    return row ?? null
  },

  async listCancellationPolicyRules(
    db: PostgresJsDatabase,
    query: CancellationPolicyRuleListQuery,
  ) {
    const conditions = []
    if (query.cancellationPolicyId)
      conditions.push(eq(cancellationPolicyRules.cancellationPolicyId, query.cancellationPolicyId))
    if (query.active !== undefined)
      conditions.push(eq(cancellationPolicyRules.active, query.active))
    const where = conditions.length ? and(...conditions) : undefined
    return paginate(
      db
        .select()
        .from(cancellationPolicyRules)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(asc(cancellationPolicyRules.sortOrder), asc(cancellationPolicyRules.createdAt)),
      db.select({ count: sql<number>`count(*)::int` }).from(cancellationPolicyRules).where(where),
      query.limit,
      query.offset,
    )
  },

  async getCancellationPolicyRuleById(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .select()
      .from(cancellationPolicyRules)
      .where(eq(cancellationPolicyRules.id, id))
      .limit(1)
    return row ?? null
  },

  async createCancellationPolicyRule(
    db: PostgresJsDatabase,
    data: CreateCancellationPolicyRuleInput,
  ) {
    const [row] = await db.insert(cancellationPolicyRules).values(data).returning()
    return row ?? null
  },

  async updateCancellationPolicyRule(
    db: PostgresJsDatabase,
    id: string,
    data: UpdateCancellationPolicyRuleInput,
  ) {
    const [row] = await db
      .update(cancellationPolicyRules)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(cancellationPolicyRules.id, id))
      .returning()
    return row ?? null
  },

  async deleteCancellationPolicyRule(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(cancellationPolicyRules)
      .where(eq(cancellationPolicyRules.id, id))
      .returning({ id: cancellationPolicyRules.id })
    return row ?? null
  },

  async listPriceCatalogs(db: PostgresJsDatabase, query: PriceCatalogListQuery) {
    const conditions = []
    if (query.currencyCode) conditions.push(eq(priceCatalogs.currencyCode, query.currencyCode))
    if (query.catalogType) conditions.push(eq(priceCatalogs.catalogType, query.catalogType))
    if (query.active !== undefined) conditions.push(eq(priceCatalogs.active, query.active))
    if (query.search) {
      const term = `%${query.search}%`
      conditions.push(or(ilike(priceCatalogs.name, term), ilike(priceCatalogs.code, term)))
    }
    const where = conditions.length ? and(...conditions) : undefined
    return paginate(
      db
        .select()
        .from(priceCatalogs)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(asc(priceCatalogs.name)),
      db.select({ count: sql<number>`count(*)::int` }).from(priceCatalogs).where(where),
      query.limit,
      query.offset,
    )
  },

  async getPriceCatalogById(db: PostgresJsDatabase, id: string) {
    const [row] = await db.select().from(priceCatalogs).where(eq(priceCatalogs.id, id)).limit(1)
    return row ?? null
  },

  async createPriceCatalog(db: PostgresJsDatabase, data: CreatePriceCatalogInput) {
    const [row] = await db.insert(priceCatalogs).values(data).returning()
    return row ?? null
  },

  async updatePriceCatalog(db: PostgresJsDatabase, id: string, data: UpdatePriceCatalogInput) {
    const [row] = await db
      .update(priceCatalogs)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(priceCatalogs.id, id))
      .returning()
    return row ?? null
  },

  async deletePriceCatalog(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(priceCatalogs)
      .where(eq(priceCatalogs.id, id))
      .returning({ id: priceCatalogs.id })
    return row ?? null
  },

  async listPriceSchedules(db: PostgresJsDatabase, query: PriceScheduleListQuery) {
    const conditions = []
    if (query.priceCatalogId)
      conditions.push(eq(priceSchedules.priceCatalogId, query.priceCatalogId))
    if (query.active !== undefined) conditions.push(eq(priceSchedules.active, query.active))
    const where = conditions.length ? and(...conditions) : undefined
    return paginate(
      db
        .select()
        .from(priceSchedules)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(desc(priceSchedules.priority), asc(priceSchedules.name)),
      db.select({ count: sql<number>`count(*)::int` }).from(priceSchedules).where(where),
      query.limit,
      query.offset,
    )
  },

  async getPriceScheduleById(db: PostgresJsDatabase, id: string) {
    const [row] = await db.select().from(priceSchedules).where(eq(priceSchedules.id, id)).limit(1)
    return row ?? null
  },

  async createPriceSchedule(db: PostgresJsDatabase, data: CreatePriceScheduleInput) {
    const [row] = await db.insert(priceSchedules).values(data).returning()
    return row ?? null
  },

  async updatePriceSchedule(db: PostgresJsDatabase, id: string, data: UpdatePriceScheduleInput) {
    const [row] = await db
      .update(priceSchedules)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(priceSchedules.id, id))
      .returning()
    return row ?? null
  },

  async deletePriceSchedule(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(priceSchedules)
      .where(eq(priceSchedules.id, id))
      .returning({ id: priceSchedules.id })
    return row ?? null
  },

  async listOptionPriceRules(db: PostgresJsDatabase, query: OptionPriceRuleListQuery) {
    const conditions = []
    if (query.productId) conditions.push(eq(optionPriceRules.productId, query.productId))
    if (query.optionId) conditions.push(eq(optionPriceRules.optionId, query.optionId))
    if (query.priceCatalogId)
      conditions.push(eq(optionPriceRules.priceCatalogId, query.priceCatalogId))
    if (query.priceScheduleId)
      conditions.push(eq(optionPriceRules.priceScheduleId, query.priceScheduleId))
    if (query.cancellationPolicyId)
      conditions.push(eq(optionPriceRules.cancellationPolicyId, query.cancellationPolicyId))
    if (query.pricingMode) conditions.push(eq(optionPriceRules.pricingMode, query.pricingMode))
    if (query.active !== undefined) conditions.push(eq(optionPriceRules.active, query.active))
    const where = conditions.length ? and(...conditions) : undefined
    return paginate(
      db
        .select()
        .from(optionPriceRules)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(desc(optionPriceRules.updatedAt)),
      db.select({ count: sql<number>`count(*)::int` }).from(optionPriceRules).where(where),
      query.limit,
      query.offset,
    )
  },

  async getOptionPriceRuleById(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .select()
      .from(optionPriceRules)
      .where(eq(optionPriceRules.id, id))
      .limit(1)
    return row ?? null
  },

  async createOptionPriceRule(db: PostgresJsDatabase, data: CreateOptionPriceRuleInput) {
    const [row] = await db.insert(optionPriceRules).values(data).returning()
    return row ?? null
  },

  async updateOptionPriceRule(
    db: PostgresJsDatabase,
    id: string,
    data: UpdateOptionPriceRuleInput,
  ) {
    const [row] = await db
      .update(optionPriceRules)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(optionPriceRules.id, id))
      .returning()
    return row ?? null
  },

  async deleteOptionPriceRule(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(optionPriceRules)
      .where(eq(optionPriceRules.id, id))
      .returning({ id: optionPriceRules.id })
    return row ?? null
  },

  async listOptionUnitPriceRules(db: PostgresJsDatabase, query: OptionUnitPriceRuleListQuery) {
    const conditions = []
    if (query.optionPriceRuleId)
      conditions.push(eq(optionUnitPriceRules.optionPriceRuleId, query.optionPriceRuleId))
    if (query.optionId) conditions.push(eq(optionUnitPriceRules.optionId, query.optionId))
    if (query.unitId) conditions.push(eq(optionUnitPriceRules.unitId, query.unitId))
    if (query.pricingCategoryId)
      conditions.push(eq(optionUnitPriceRules.pricingCategoryId, query.pricingCategoryId))
    if (query.active !== undefined) conditions.push(eq(optionUnitPriceRules.active, query.active))
    const where = conditions.length ? and(...conditions) : undefined
    return paginate(
      db
        .select()
        .from(optionUnitPriceRules)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(asc(optionUnitPriceRules.sortOrder), asc(optionUnitPriceRules.createdAt)),
      db.select({ count: sql<number>`count(*)::int` }).from(optionUnitPriceRules).where(where),
      query.limit,
      query.offset,
    )
  },

  async getOptionUnitPriceRuleById(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .select()
      .from(optionUnitPriceRules)
      .where(eq(optionUnitPriceRules.id, id))
      .limit(1)
    return row ?? null
  },

  async createOptionUnitPriceRule(db: PostgresJsDatabase, data: CreateOptionUnitPriceRuleInput) {
    const [row] = await db.insert(optionUnitPriceRules).values(data).returning()
    return row ?? null
  },

  async updateOptionUnitPriceRule(
    db: PostgresJsDatabase,
    id: string,
    data: UpdateOptionUnitPriceRuleInput,
  ) {
    const [row] = await db
      .update(optionUnitPriceRules)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(optionUnitPriceRules.id, id))
      .returning()
    return row ?? null
  },

  async deleteOptionUnitPriceRule(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(optionUnitPriceRules)
      .where(eq(optionUnitPriceRules.id, id))
      .returning({ id: optionUnitPriceRules.id })
    return row ?? null
  },

  async listOptionStartTimeRules(db: PostgresJsDatabase, query: OptionStartTimeRuleListQuery) {
    const conditions = []
    if (query.optionPriceRuleId)
      conditions.push(eq(optionStartTimeRules.optionPriceRuleId, query.optionPriceRuleId))
    if (query.optionId) conditions.push(eq(optionStartTimeRules.optionId, query.optionId))
    if (query.startTimeId) conditions.push(eq(optionStartTimeRules.startTimeId, query.startTimeId))
    if (query.active !== undefined) conditions.push(eq(optionStartTimeRules.active, query.active))
    const where = conditions.length ? and(...conditions) : undefined
    return paginate(
      db
        .select()
        .from(optionStartTimeRules)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(asc(optionStartTimeRules.createdAt)),
      db.select({ count: sql<number>`count(*)::int` }).from(optionStartTimeRules).where(where),
      query.limit,
      query.offset,
    )
  },

  async getOptionStartTimeRuleById(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .select()
      .from(optionStartTimeRules)
      .where(eq(optionStartTimeRules.id, id))
      .limit(1)
    return row ?? null
  },

  async createOptionStartTimeRule(db: PostgresJsDatabase, data: CreateOptionStartTimeRuleInput) {
    const [row] = await db.insert(optionStartTimeRules).values(data).returning()
    return row ?? null
  },

  async updateOptionStartTimeRule(
    db: PostgresJsDatabase,
    id: string,
    data: UpdateOptionStartTimeRuleInput,
  ) {
    const [row] = await db
      .update(optionStartTimeRules)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(optionStartTimeRules.id, id))
      .returning()
    return row ?? null
  },

  async deleteOptionStartTimeRule(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(optionStartTimeRules)
      .where(eq(optionStartTimeRules.id, id))
      .returning({ id: optionStartTimeRules.id })
    return row ?? null
  },

  async listOptionUnitTiers(db: PostgresJsDatabase, query: OptionUnitTierListQuery) {
    const conditions = []
    if (query.optionUnitPriceRuleId)
      conditions.push(eq(optionUnitTiers.optionUnitPriceRuleId, query.optionUnitPriceRuleId))
    if (query.active !== undefined) conditions.push(eq(optionUnitTiers.active, query.active))
    const where = conditions.length ? and(...conditions) : undefined
    return paginate(
      db
        .select()
        .from(optionUnitTiers)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(asc(optionUnitTiers.sortOrder), asc(optionUnitTiers.minQuantity)),
      db.select({ count: sql<number>`count(*)::int` }).from(optionUnitTiers).where(where),
      query.limit,
      query.offset,
    )
  },

  async getOptionUnitTierById(db: PostgresJsDatabase, id: string) {
    const [row] = await db.select().from(optionUnitTiers).where(eq(optionUnitTiers.id, id)).limit(1)
    return row ?? null
  },

  async createOptionUnitTier(db: PostgresJsDatabase, data: CreateOptionUnitTierInput) {
    const [row] = await db.insert(optionUnitTiers).values(data).returning()
    return row ?? null
  },

  async updateOptionUnitTier(db: PostgresJsDatabase, id: string, data: UpdateOptionUnitTierInput) {
    const [row] = await db
      .update(optionUnitTiers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(optionUnitTiers.id, id))
      .returning()
    return row ?? null
  },

  async deleteOptionUnitTier(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(optionUnitTiers)
      .where(eq(optionUnitTiers.id, id))
      .returning({ id: optionUnitTiers.id })
    return row ?? null
  },

  async listPickupPriceRules(db: PostgresJsDatabase, query: PickupPriceRuleListQuery) {
    const conditions = []
    if (query.optionPriceRuleId)
      conditions.push(eq(pickupPriceRules.optionPriceRuleId, query.optionPriceRuleId))
    if (query.optionId) conditions.push(eq(pickupPriceRules.optionId, query.optionId))
    if (query.pickupPointId)
      conditions.push(eq(pickupPriceRules.pickupPointId, query.pickupPointId))
    if (query.active !== undefined) conditions.push(eq(pickupPriceRules.active, query.active))
    const where = conditions.length ? and(...conditions) : undefined
    return paginate(
      db
        .select()
        .from(pickupPriceRules)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(asc(pickupPriceRules.sortOrder), asc(pickupPriceRules.createdAt)),
      db.select({ count: sql<number>`count(*)::int` }).from(pickupPriceRules).where(where),
      query.limit,
      query.offset,
    )
  },

  async getPickupPriceRuleById(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .select()
      .from(pickupPriceRules)
      .where(eq(pickupPriceRules.id, id))
      .limit(1)
    return row ?? null
  },

  async createPickupPriceRule(db: PostgresJsDatabase, data: CreatePickupPriceRuleInput) {
    const [row] = await db.insert(pickupPriceRules).values(data).returning()
    return row ?? null
  },

  async updatePickupPriceRule(
    db: PostgresJsDatabase,
    id: string,
    data: UpdatePickupPriceRuleInput,
  ) {
    const [row] = await db
      .update(pickupPriceRules)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(pickupPriceRules.id, id))
      .returning()
    return row ?? null
  },

  async deletePickupPriceRule(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(pickupPriceRules)
      .where(eq(pickupPriceRules.id, id))
      .returning({ id: pickupPriceRules.id })
    return row ?? null
  },

  async listDropoffPriceRules(db: PostgresJsDatabase, query: DropoffPriceRuleListQuery) {
    const conditions = []
    if (query.optionPriceRuleId)
      conditions.push(eq(dropoffPriceRules.optionPriceRuleId, query.optionPriceRuleId))
    if (query.optionId) conditions.push(eq(dropoffPriceRules.optionId, query.optionId))
    if (query.facilityId) conditions.push(eq(dropoffPriceRules.facilityId, query.facilityId))
    if (query.active !== undefined) conditions.push(eq(dropoffPriceRules.active, query.active))
    const where = conditions.length ? and(...conditions) : undefined
    return paginate(
      db
        .select()
        .from(dropoffPriceRules)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(asc(dropoffPriceRules.sortOrder), asc(dropoffPriceRules.createdAt)),
      db.select({ count: sql<number>`count(*)::int` }).from(dropoffPriceRules).where(where),
      query.limit,
      query.offset,
    )
  },

  async getDropoffPriceRuleById(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .select()
      .from(dropoffPriceRules)
      .where(eq(dropoffPriceRules.id, id))
      .limit(1)
    return row ?? null
  },

  async createDropoffPriceRule(db: PostgresJsDatabase, data: CreateDropoffPriceRuleInput) {
    const [row] = await db.insert(dropoffPriceRules).values(data).returning()
    return row ?? null
  },

  async updateDropoffPriceRule(
    db: PostgresJsDatabase,
    id: string,
    data: UpdateDropoffPriceRuleInput,
  ) {
    const [row] = await db
      .update(dropoffPriceRules)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(dropoffPriceRules.id, id))
      .returning()
    return row ?? null
  },

  async deleteDropoffPriceRule(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(dropoffPriceRules)
      .where(eq(dropoffPriceRules.id, id))
      .returning({ id: dropoffPriceRules.id })
    return row ?? null
  },

  async listExtraPriceRules(db: PostgresJsDatabase, query: ExtraPriceRuleListQuery) {
    const conditions = []
    if (query.optionPriceRuleId)
      conditions.push(eq(extraPriceRules.optionPriceRuleId, query.optionPriceRuleId))
    if (query.optionId) conditions.push(eq(extraPriceRules.optionId, query.optionId))
    if (query.productExtraId)
      conditions.push(eq(extraPriceRules.productExtraId, query.productExtraId))
    if (query.optionExtraConfigId)
      conditions.push(eq(extraPriceRules.optionExtraConfigId, query.optionExtraConfigId))
    if (query.active !== undefined) conditions.push(eq(extraPriceRules.active, query.active))
    const where = conditions.length ? and(...conditions) : undefined
    return paginate(
      db
        .select()
        .from(extraPriceRules)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(asc(extraPriceRules.sortOrder), asc(extraPriceRules.createdAt)),
      db.select({ count: sql<number>`count(*)::int` }).from(extraPriceRules).where(where),
      query.limit,
      query.offset,
    )
  },

  async getExtraPriceRuleById(db: PostgresJsDatabase, id: string) {
    const [row] = await db.select().from(extraPriceRules).where(eq(extraPriceRules.id, id)).limit(1)
    return row ?? null
  },

  async createExtraPriceRule(db: PostgresJsDatabase, data: CreateExtraPriceRuleInput) {
    const [row] = await db.insert(extraPriceRules).values(data).returning()
    return row ?? null
  },

  async updateExtraPriceRule(db: PostgresJsDatabase, id: string, data: UpdateExtraPriceRuleInput) {
    const [row] = await db
      .update(extraPriceRules)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(extraPriceRules.id, id))
      .returning()
    return row ?? null
  },

  async deleteExtraPriceRule(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(extraPriceRules)
      .where(eq(extraPriceRules.id, id))
      .returning({ id: extraPriceRules.id })
    return row ?? null
  },
}
