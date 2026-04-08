import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import type { z } from "zod"

import {
  exchangeRates,
  fxRateSets,
  marketChannelRules,
  marketCurrencies,
  marketLocales,
  marketPriceCatalogs,
  marketProductRules,
  markets,
} from "./schema.js"
import type {
  exchangeRateListQuerySchema,
  fxRateSetListQuerySchema,
  insertExchangeRateSchema,
  insertFxRateSetSchema,
  insertMarketChannelRuleSchema,
  insertMarketCurrencySchema,
  insertMarketLocaleSchema,
  insertMarketPriceCatalogSchema,
  insertMarketProductRuleSchema,
  insertMarketSchema,
  marketChannelRuleListQuerySchema,
  marketCurrencyListQuerySchema,
  marketListQuerySchema,
  marketLocaleListQuerySchema,
  marketPriceCatalogListQuerySchema,
  marketProductRuleListQuerySchema,
  updateExchangeRateSchema,
  updateFxRateSetSchema,
  updateMarketChannelRuleSchema,
  updateMarketCurrencySchema,
  updateMarketLocaleSchema,
  updateMarketPriceCatalogSchema,
  updateMarketProductRuleSchema,
  updateMarketSchema,
} from "./validation.js"

type MarketListQuery = z.infer<typeof marketListQuerySchema>
type MarketLocaleListQuery = z.infer<typeof marketLocaleListQuerySchema>
type MarketCurrencyListQuery = z.infer<typeof marketCurrencyListQuerySchema>
type FxRateSetListQuery = z.infer<typeof fxRateSetListQuerySchema>
type ExchangeRateListQuery = z.infer<typeof exchangeRateListQuerySchema>
type MarketPriceCatalogListQuery = z.infer<typeof marketPriceCatalogListQuerySchema>
type MarketProductRuleListQuery = z.infer<typeof marketProductRuleListQuerySchema>
type MarketChannelRuleListQuery = z.infer<typeof marketChannelRuleListQuerySchema>
type CreateMarketInput = z.infer<typeof insertMarketSchema>
type UpdateMarketInput = z.infer<typeof updateMarketSchema>
type CreateMarketLocaleInput = z.infer<typeof insertMarketLocaleSchema>
type UpdateMarketLocaleInput = z.infer<typeof updateMarketLocaleSchema>
type CreateMarketCurrencyInput = z.infer<typeof insertMarketCurrencySchema>
type UpdateMarketCurrencyInput = z.infer<typeof updateMarketCurrencySchema>
type CreateFxRateSetInput = z.infer<typeof insertFxRateSetSchema>
type UpdateFxRateSetInput = z.infer<typeof updateFxRateSetSchema>
type CreateExchangeRateInput = z.infer<typeof insertExchangeRateSchema>
type UpdateExchangeRateInput = z.infer<typeof updateExchangeRateSchema>
type CreateMarketPriceCatalogInput = z.infer<typeof insertMarketPriceCatalogSchema>
type UpdateMarketPriceCatalogInput = z.infer<typeof updateMarketPriceCatalogSchema>
type CreateMarketProductRuleInput = z.infer<typeof insertMarketProductRuleSchema>
type UpdateMarketProductRuleInput = z.infer<typeof updateMarketProductRuleSchema>
type CreateMarketChannelRuleInput = z.infer<typeof insertMarketChannelRuleSchema>
type UpdateMarketChannelRuleInput = z.infer<typeof updateMarketChannelRuleSchema>

async function paginate<T extends object>(
  rowsQuery: Promise<T[]>,
  countQuery: Promise<Array<{ count: number }>>,
  limit: number,
  offset: number,
) {
  const [data, countResult] = await Promise.all([rowsQuery, countQuery])
  return { data, total: countResult[0]?.count ?? 0, limit, offset }
}

function toTimestamp(value?: string | null) {
  return value ? new Date(value) : null
}

export const marketsService = {
  async listMarkets(db: PostgresJsDatabase, query: MarketListQuery) {
    const conditions = []
    if (query.status) conditions.push(eq(markets.status, query.status))
    if (query.countryCode) conditions.push(eq(markets.countryCode, query.countryCode))
    if (query.search) {
      const term = `%${query.search}%`
      conditions.push(or(ilike(markets.name, term), ilike(markets.code, term)))
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined

    return paginate(
      db
        .select()
        .from(markets)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(desc(markets.updatedAt)),
      db.select({ count: sql<number>`count(*)::int` }).from(markets).where(where),
      query.limit,
      query.offset,
    )
  },

  async getMarketById(db: PostgresJsDatabase, id: string) {
    const [row] = await db.select().from(markets).where(eq(markets.id, id)).limit(1)
    return row ?? null
  },

  async createMarket(db: PostgresJsDatabase, data: CreateMarketInput) {
    const [row] = await db.insert(markets).values(data).returning()
    return row ?? null
  },

  async updateMarket(db: PostgresJsDatabase, id: string, data: UpdateMarketInput) {
    const [row] = await db
      .update(markets)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(markets.id, id))
      .returning()
    return row ?? null
  },

  async deleteMarket(db: PostgresJsDatabase, id: string) {
    const [row] = await db.delete(markets).where(eq(markets.id, id)).returning({ id: markets.id })
    return row ?? null
  },

  async listMarketLocales(db: PostgresJsDatabase, query: MarketLocaleListQuery) {
    const conditions = []
    if (query.marketId) conditions.push(eq(marketLocales.marketId, query.marketId))
    if (query.languageTag) conditions.push(eq(marketLocales.languageTag, query.languageTag))
    if (query.active !== undefined) conditions.push(eq(marketLocales.active, query.active))
    const where = conditions.length > 0 ? and(...conditions) : undefined

    return paginate(
      db
        .select()
        .from(marketLocales)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(asc(marketLocales.sortOrder), asc(marketLocales.createdAt)),
      db.select({ count: sql<number>`count(*)::int` }).from(marketLocales).where(where),
      query.limit,
      query.offset,
    )
  },

  async createMarketLocale(
    db: PostgresJsDatabase,
    marketId: string,
    data: CreateMarketLocaleInput,
  ) {
    const [market] = await db
      .select({ id: markets.id })
      .from(markets)
      .where(eq(markets.id, marketId))
      .limit(1)
    if (!market) return null

    const [row] = await db
      .insert(marketLocales)
      .values({ ...data, marketId })
      .returning()
    return row ?? null
  },

  async updateMarketLocale(db: PostgresJsDatabase, id: string, data: UpdateMarketLocaleInput) {
    const [row] = await db
      .update(marketLocales)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(marketLocales.id, id))
      .returning()
    return row ?? null
  },

  async deleteMarketLocale(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(marketLocales)
      .where(eq(marketLocales.id, id))
      .returning({ id: marketLocales.id })
    return row ?? null
  },

  async listMarketCurrencies(db: PostgresJsDatabase, query: MarketCurrencyListQuery) {
    const conditions = []
    if (query.marketId) conditions.push(eq(marketCurrencies.marketId, query.marketId))
    if (query.currencyCode) conditions.push(eq(marketCurrencies.currencyCode, query.currencyCode))
    if (query.active !== undefined) conditions.push(eq(marketCurrencies.active, query.active))
    const where = conditions.length > 0 ? and(...conditions) : undefined

    return paginate(
      db
        .select()
        .from(marketCurrencies)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(asc(marketCurrencies.sortOrder), asc(marketCurrencies.createdAt)),
      db.select({ count: sql<number>`count(*)::int` }).from(marketCurrencies).where(where),
      query.limit,
      query.offset,
    )
  },

  async createMarketCurrency(
    db: PostgresJsDatabase,
    marketId: string,
    data: CreateMarketCurrencyInput,
  ) {
    const [market] = await db
      .select({ id: markets.id })
      .from(markets)
      .where(eq(markets.id, marketId))
      .limit(1)
    if (!market) return null

    const [row] = await db
      .insert(marketCurrencies)
      .values({ ...data, marketId })
      .returning()
    return row ?? null
  },

  async updateMarketCurrency(db: PostgresJsDatabase, id: string, data: UpdateMarketCurrencyInput) {
    const [row] = await db
      .update(marketCurrencies)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(marketCurrencies.id, id))
      .returning()
    return row ?? null
  },

  async deleteMarketCurrency(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(marketCurrencies)
      .where(eq(marketCurrencies.id, id))
      .returning({ id: marketCurrencies.id })
    return row ?? null
  },

  async listFxRateSets(db: PostgresJsDatabase, query: FxRateSetListQuery) {
    const conditions = []
    if (query.source) conditions.push(eq(fxRateSets.source, query.source))
    if (query.baseCurrency) conditions.push(eq(fxRateSets.baseCurrency, query.baseCurrency))
    const where = conditions.length > 0 ? and(...conditions) : undefined

    return paginate(
      db
        .select()
        .from(fxRateSets)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(desc(fxRateSets.effectiveAt)),
      db.select({ count: sql<number>`count(*)::int` }).from(fxRateSets).where(where),
      query.limit,
      query.offset,
    )
  },

  async getFxRateSetById(db: PostgresJsDatabase, id: string) {
    const [row] = await db.select().from(fxRateSets).where(eq(fxRateSets.id, id)).limit(1)
    return row ?? null
  },

  async createFxRateSet(db: PostgresJsDatabase, data: CreateFxRateSetInput) {
    const [row] = await db
      .insert(fxRateSets)
      .values({
        ...data,
        effectiveAt: new Date(data.effectiveAt),
        observedAt: toTimestamp(data.observedAt),
      })
      .returning()
    return row ?? null
  },

  async updateFxRateSet(db: PostgresJsDatabase, id: string, data: UpdateFxRateSetInput) {
    const [row] = await db
      .update(fxRateSets)
      .set({
        ...data,
        effectiveAt: data.effectiveAt === undefined ? undefined : new Date(data.effectiveAt),
        observedAt: data.observedAt === undefined ? undefined : toTimestamp(data.observedAt),
      })
      .where(eq(fxRateSets.id, id))
      .returning()
    return row ?? null
  },

  async deleteFxRateSet(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(fxRateSets)
      .where(eq(fxRateSets.id, id))
      .returning({ id: fxRateSets.id })
    return row ?? null
  },

  async listExchangeRates(db: PostgresJsDatabase, query: ExchangeRateListQuery) {
    const conditions = []
    if (query.fxRateSetId) conditions.push(eq(exchangeRates.fxRateSetId, query.fxRateSetId))
    if (query.baseCurrency) conditions.push(eq(exchangeRates.baseCurrency, query.baseCurrency))
    if (query.quoteCurrency) conditions.push(eq(exchangeRates.quoteCurrency, query.quoteCurrency))
    const where = conditions.length > 0 ? and(...conditions) : undefined

    return paginate(
      db
        .select()
        .from(exchangeRates)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(asc(exchangeRates.quoteCurrency)),
      db.select({ count: sql<number>`count(*)::int` }).from(exchangeRates).where(where),
      query.limit,
      query.offset,
    )
  },

  async createExchangeRate(
    db: PostgresJsDatabase,
    fxRateSetId: string,
    data: CreateExchangeRateInput,
  ) {
    const [rateSet] = await db
      .select({ id: fxRateSets.id })
      .from(fxRateSets)
      .where(eq(fxRateSets.id, fxRateSetId))
      .limit(1)
    if (!rateSet) return null

    const [row] = await db
      .insert(exchangeRates)
      .values({
        ...data,
        fxRateSetId,
        observedAt: toTimestamp(data.observedAt),
      })
      .returning()
    return row ?? null
  },

  async updateExchangeRate(db: PostgresJsDatabase, id: string, data: UpdateExchangeRateInput) {
    const [row] = await db
      .update(exchangeRates)
      .set({
        ...data,
        observedAt: data.observedAt === undefined ? undefined : toTimestamp(data.observedAt),
      })
      .where(eq(exchangeRates.id, id))
      .returning()
    return row ?? null
  },

  async deleteExchangeRate(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(exchangeRates)
      .where(eq(exchangeRates.id, id))
      .returning({ id: exchangeRates.id })
    return row ?? null
  },

  async listMarketPriceCatalogs(db: PostgresJsDatabase, query: MarketPriceCatalogListQuery) {
    const conditions = []
    if (query.marketId) conditions.push(eq(marketPriceCatalogs.marketId, query.marketId))
    if (query.priceCatalogId)
      conditions.push(eq(marketPriceCatalogs.priceCatalogId, query.priceCatalogId))
    if (query.active !== undefined) conditions.push(eq(marketPriceCatalogs.active, query.active))
    const where = conditions.length > 0 ? and(...conditions) : undefined

    return paginate(
      db
        .select()
        .from(marketPriceCatalogs)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(desc(marketPriceCatalogs.isDefault), desc(marketPriceCatalogs.priority)),
      db.select({ count: sql<number>`count(*)::int` }).from(marketPriceCatalogs).where(where),
      query.limit,
      query.offset,
    )
  },

  async getMarketPriceCatalogById(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .select()
      .from(marketPriceCatalogs)
      .where(eq(marketPriceCatalogs.id, id))
      .limit(1)
    return row ?? null
  },

  async createMarketPriceCatalog(db: PostgresJsDatabase, data: CreateMarketPriceCatalogInput) {
    const [market] = await db
      .select({ id: markets.id })
      .from(markets)
      .where(eq(markets.id, data.marketId))
      .limit(1)
    if (!market) return null

    const [row] = await db.insert(marketPriceCatalogs).values(data).returning()
    return row ?? null
  },

  async updateMarketPriceCatalog(
    db: PostgresJsDatabase,
    id: string,
    data: UpdateMarketPriceCatalogInput,
  ) {
    const [row] = await db
      .update(marketPriceCatalogs)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(marketPriceCatalogs.id, id))
      .returning()
    return row ?? null
  },

  async deleteMarketPriceCatalog(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(marketPriceCatalogs)
      .where(eq(marketPriceCatalogs.id, id))
      .returning({ id: marketPriceCatalogs.id })
    return row ?? null
  },

  async listMarketProductRules(db: PostgresJsDatabase, query: MarketProductRuleListQuery) {
    const conditions = []
    if (query.marketId) conditions.push(eq(marketProductRules.marketId, query.marketId))
    if (query.productId) conditions.push(eq(marketProductRules.productId, query.productId))
    if (query.optionId) conditions.push(eq(marketProductRules.optionId, query.optionId))
    if (query.sellability) conditions.push(eq(marketProductRules.sellability, query.sellability))
    if (query.active !== undefined) conditions.push(eq(marketProductRules.active, query.active))
    const where = conditions.length > 0 ? and(...conditions) : undefined

    return paginate(
      db
        .select()
        .from(marketProductRules)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(desc(marketProductRules.updatedAt)),
      db.select({ count: sql<number>`count(*)::int` }).from(marketProductRules).where(where),
      query.limit,
      query.offset,
    )
  },

  async getMarketProductRuleById(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .select()
      .from(marketProductRules)
      .where(eq(marketProductRules.id, id))
      .limit(1)
    return row ?? null
  },

  async createMarketProductRule(db: PostgresJsDatabase, data: CreateMarketProductRuleInput) {
    const [market] = await db
      .select({ id: markets.id })
      .from(markets)
      .where(eq(markets.id, data.marketId))
      .limit(1)
    if (!market) return null

    const [row] = await db.insert(marketProductRules).values(data).returning()
    return row ?? null
  },

  async updateMarketProductRule(
    db: PostgresJsDatabase,
    id: string,
    data: UpdateMarketProductRuleInput,
  ) {
    const [row] = await db
      .update(marketProductRules)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(marketProductRules.id, id))
      .returning()
    return row ?? null
  },

  async deleteMarketProductRule(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(marketProductRules)
      .where(eq(marketProductRules.id, id))
      .returning({ id: marketProductRules.id })
    return row ?? null
  },

  async listMarketChannelRules(db: PostgresJsDatabase, query: MarketChannelRuleListQuery) {
    const conditions = []
    if (query.marketId) conditions.push(eq(marketChannelRules.marketId, query.marketId))
    if (query.channelId) conditions.push(eq(marketChannelRules.channelId, query.channelId))
    if (query.sellability) conditions.push(eq(marketChannelRules.sellability, query.sellability))
    if (query.active !== undefined) conditions.push(eq(marketChannelRules.active, query.active))
    const where = conditions.length > 0 ? and(...conditions) : undefined

    return paginate(
      db
        .select()
        .from(marketChannelRules)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(desc(marketChannelRules.priority), desc(marketChannelRules.updatedAt)),
      db.select({ count: sql<number>`count(*)::int` }).from(marketChannelRules).where(where),
      query.limit,
      query.offset,
    )
  },

  async getMarketChannelRuleById(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .select()
      .from(marketChannelRules)
      .where(eq(marketChannelRules.id, id))
      .limit(1)
    return row ?? null
  },

  async createMarketChannelRule(db: PostgresJsDatabase, data: CreateMarketChannelRuleInput) {
    const [market] = await db
      .select({ id: markets.id })
      .from(markets)
      .where(eq(markets.id, data.marketId))
      .limit(1)
    if (!market) return null

    const [row] = await db.insert(marketChannelRules).values(data).returning()
    return row ?? null
  },

  async updateMarketChannelRule(
    db: PostgresJsDatabase,
    id: string,
    data: UpdateMarketChannelRuleInput,
  ) {
    const [row] = await db
      .update(marketChannelRules)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(marketChannelRules.id, id))
      .returning()
    return row ?? null
  },

  async deleteMarketChannelRule(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(marketChannelRules)
      .where(eq(marketChannelRules.id, id))
      .returning({ id: marketChannelRules.id })
    return row ?? null
  },
}
