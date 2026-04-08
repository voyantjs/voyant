import { typeId, typeIdRef } from "@voyantjs/db/lib/typeid-column"
import { relations } from "drizzle-orm"
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"

export const marketStatusEnum = pgEnum("market_status", ["active", "inactive", "archived"])
export const marketVisibilityEnum = pgEnum("market_visibility", ["public", "private", "hidden"])
export const marketSellabilityEnum = pgEnum("market_sellability", [
  "sellable",
  "on_request",
  "unavailable",
])
export const marketChannelScopeEnum = pgEnum("market_channel_scope", [
  "all",
  "b2c",
  "b2b",
  "internal",
])
export const fxRateSourceEnum = pgEnum("fx_rate_source", [
  "manual",
  "ecb",
  "custom",
  "channel",
  "supplier",
  "other",
])

export const markets = pgTable(
  "markets",
  {
    id: typeId("markets"),
    code: text("code").notNull(),
    name: text("name").notNull(),
    status: marketStatusEnum("status").notNull().default("active"),
    regionCode: text("region_code"),
    countryCode: text("country_code"),
    defaultLanguageTag: text("default_language_tag").notNull(),
    defaultCurrency: text("default_currency").notNull(),
    timezone: text("timezone"),
    taxContext: text("tax_context"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("uidx_markets_code").on(table.code),
    index("idx_markets_status").on(table.status),
    index("idx_markets_country").on(table.countryCode),
  ],
)

export const marketLocales = pgTable(
  "market_locales",
  {
    id: typeId("market_locales"),
    marketId: typeIdRef("market_id")
      .notNull()
      .references(() => markets.id, { onDelete: "cascade" }),
    languageTag: text("language_tag").notNull(),
    isDefault: boolean("is_default").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_market_locales_market").on(table.marketId),
    index("idx_market_locales_language").on(table.languageTag),
    uniqueIndex("uidx_market_locales_market_language").on(table.marketId, table.languageTag),
  ],
)

export const marketCurrencies = pgTable(
  "market_currencies",
  {
    id: typeId("market_currencies"),
    marketId: typeIdRef("market_id")
      .notNull()
      .references(() => markets.id, { onDelete: "cascade" }),
    currencyCode: text("currency_code").notNull(),
    isDefault: boolean("is_default").notNull().default(false),
    isSettlement: boolean("is_settlement").notNull().default(false),
    isReporting: boolean("is_reporting").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_market_currencies_market").on(table.marketId),
    index("idx_market_currencies_code").on(table.currencyCode),
    uniqueIndex("uidx_market_currencies_market_code").on(table.marketId, table.currencyCode),
  ],
)

export const fxRateSets = pgTable(
  "fx_rate_sets",
  {
    id: typeId("fx_rate_sets"),
    source: fxRateSourceEnum("source").notNull().default("manual"),
    baseCurrency: text("base_currency").notNull(),
    effectiveAt: timestamp("effective_at", { withTimezone: true }).notNull(),
    observedAt: timestamp("observed_at", { withTimezone: true }),
    sourceReference: text("source_reference"),
    notes: text("notes"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_fx_rate_sets_base_currency").on(table.baseCurrency),
    index("idx_fx_rate_sets_effective_at").on(table.effectiveAt),
    index("idx_fx_rate_sets_source").on(table.source),
  ],
)

export const exchangeRates = pgTable(
  "exchange_rates",
  {
    id: typeId("exchange_rates"),
    fxRateSetId: typeIdRef("fx_rate_set_id")
      .notNull()
      .references(() => fxRateSets.id, { onDelete: "cascade" }),
    baseCurrency: text("base_currency").notNull(),
    quoteCurrency: text("quote_currency").notNull(),
    rateDecimal: numeric("rate_decimal", { precision: 18, scale: 8 }).notNull(),
    inverseRateDecimal: numeric("inverse_rate_decimal", { precision: 18, scale: 8 }),
    observedAt: timestamp("observed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_exchange_rates_rate_set").on(table.fxRateSetId),
    index("idx_exchange_rates_pair").on(table.baseCurrency, table.quoteCurrency),
    uniqueIndex("uidx_exchange_rates_set_pair").on(
      table.fxRateSetId,
      table.baseCurrency,
      table.quoteCurrency,
    ),
  ],
)

export const marketPriceCatalogs = pgTable(
  "market_price_catalogs",
  {
    id: typeId("market_price_catalogs"),
    marketId: typeIdRef("market_id")
      .notNull()
      .references(() => markets.id, { onDelete: "cascade" }),
    priceCatalogId: typeIdRef("price_catalog_id").notNull(),
    isDefault: boolean("is_default").notNull().default(false),
    priority: integer("priority").notNull().default(0),
    active: boolean("active").notNull().default(true),
    notes: text("notes"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_market_price_catalogs_market").on(table.marketId),
    index("idx_market_price_catalogs_catalog").on(table.priceCatalogId),
    index("idx_market_price_catalogs_active").on(table.active),
    uniqueIndex("uidx_market_price_catalogs_market_catalog").on(
      table.marketId,
      table.priceCatalogId,
    ),
  ],
)

export const marketProductRules = pgTable(
  "market_product_rules",
  {
    id: typeId("market_product_rules"),
    marketId: typeIdRef("market_id")
      .notNull()
      .references(() => markets.id, { onDelete: "cascade" }),
    productId: text("product_id").notNull(),
    optionId: text("option_id"),
    priceCatalogId: typeIdRef("price_catalog_id").references(() => marketPriceCatalogs.id, {
      onDelete: "set null",
    }),
    visibility: marketVisibilityEnum("visibility").notNull().default("public"),
    sellability: marketSellabilityEnum("sellability").notNull().default("sellable"),
    channelScope: marketChannelScopeEnum("channel_scope").notNull().default("all"),
    active: boolean("active").notNull().default(true),
    availableFrom: date("available_from"),
    availableTo: date("available_to"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_market_product_rules_market").on(table.marketId),
    index("idx_market_product_rules_product").on(table.productId),
    index("idx_market_product_rules_option").on(table.optionId),
    index("idx_market_product_rules_catalog").on(table.priceCatalogId),
    index("idx_market_product_rules_active").on(table.active),
  ],
)

export const marketChannelRules = pgTable(
  "market_channel_rules",
  {
    id: typeId("market_channel_rules"),
    marketId: typeIdRef("market_id")
      .notNull()
      .references(() => markets.id, { onDelete: "cascade" }),
    channelId: text("channel_id").notNull(),
    priceCatalogId: typeIdRef("price_catalog_id").references(() => marketPriceCatalogs.id, {
      onDelete: "set null",
    }),
    visibility: marketVisibilityEnum("visibility").notNull().default("public"),
    sellability: marketSellabilityEnum("sellability").notNull().default("sellable"),
    active: boolean("active").notNull().default(true),
    priority: integer("priority").notNull().default(0),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_market_channel_rules_market").on(table.marketId),
    index("idx_market_channel_rules_channel").on(table.channelId),
    index("idx_market_channel_rules_catalog").on(table.priceCatalogId),
    index("idx_market_channel_rules_active").on(table.active),
  ],
)

export type Market = typeof markets.$inferSelect
export type NewMarket = typeof markets.$inferInsert
export type MarketLocale = typeof marketLocales.$inferSelect
export type NewMarketLocale = typeof marketLocales.$inferInsert
export type MarketCurrency = typeof marketCurrencies.$inferSelect
export type NewMarketCurrency = typeof marketCurrencies.$inferInsert
export type FxRateSet = typeof fxRateSets.$inferSelect
export type NewFxRateSet = typeof fxRateSets.$inferInsert
export type ExchangeRate = typeof exchangeRates.$inferSelect
export type NewExchangeRate = typeof exchangeRates.$inferInsert
export type MarketPriceCatalog = typeof marketPriceCatalogs.$inferSelect
export type NewMarketPriceCatalog = typeof marketPriceCatalogs.$inferInsert
export type MarketProductRule = typeof marketProductRules.$inferSelect
export type NewMarketProductRule = typeof marketProductRules.$inferInsert
export type MarketChannelRule = typeof marketChannelRules.$inferSelect
export type NewMarketChannelRule = typeof marketChannelRules.$inferInsert

export const marketsRelations = relations(markets, ({ many }) => ({
  locales: many(marketLocales),
  currencies: many(marketCurrencies),
  priceCatalogs: many(marketPriceCatalogs),
  productRules: many(marketProductRules),
  channelRules: many(marketChannelRules),
}))

export const marketLocalesRelations = relations(marketLocales, ({ one }) => ({
  market: one(markets, {
    fields: [marketLocales.marketId],
    references: [markets.id],
  }),
}))

export const marketCurrenciesRelations = relations(marketCurrencies, ({ one }) => ({
  market: one(markets, {
    fields: [marketCurrencies.marketId],
    references: [markets.id],
  }),
}))

export const fxRateSetsRelations = relations(fxRateSets, ({ many }) => ({
  exchangeRates: many(exchangeRates),
}))

export const exchangeRatesRelations = relations(exchangeRates, ({ one }) => ({
  fxRateSet: one(fxRateSets, {
    fields: [exchangeRates.fxRateSetId],
    references: [fxRateSets.id],
  }),
}))

export const marketPriceCatalogsRelations = relations(marketPriceCatalogs, ({ one, many }) => ({
  market: one(markets, {
    fields: [marketPriceCatalogs.marketId],
    references: [markets.id],
  }),
  productRules: many(marketProductRules),
  channelRules: many(marketChannelRules),
}))

export const marketProductRulesRelations = relations(marketProductRules, ({ one }) => ({
  market: one(markets, {
    fields: [marketProductRules.marketId],
    references: [markets.id],
  }),
  priceCatalog: one(marketPriceCatalogs, {
    fields: [marketProductRules.priceCatalogId],
    references: [marketPriceCatalogs.id],
  }),
}))

export const marketChannelRulesRelations = relations(marketChannelRules, ({ one }) => ({
  market: one(markets, {
    fields: [marketChannelRules.marketId],
    references: [markets.id],
  }),
  priceCatalog: one(marketPriceCatalogs, {
    fields: [marketChannelRules.priceCatalogId],
    references: [marketPriceCatalogs.id],
  }),
}))
