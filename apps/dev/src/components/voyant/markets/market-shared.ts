import {
  defaultFetcher,
  getMarketCurrenciesQueryOptions as getMarketCurrenciesQueryOptionsBase,
  getMarketLocalesQueryOptions as getMarketLocalesQueryOptionsBase,
  getMarketsQueryOptions as getMarketsQueryOptionsBase,
  type MarketCurrenciesListFilters,
  type MarketLocalesListFilters,
  type MarketRecord,
  type MarketsListFilters,
} from "@voyantjs/markets-react"
import { getApiUrl } from "@/lib/env"

export const MARKET_STATUSES = ["active", "inactive", "archived"] as const

export type MarketData = MarketRecord

export function getMarketsQueryOptions(filters: MarketsListFilters = {}) {
  return getMarketsQueryOptionsBase({ baseUrl: getApiUrl(), fetcher: defaultFetcher }, filters)
}

export function getMarketLocalesQueryOptions(filters: MarketLocalesListFilters) {
  return getMarketLocalesQueryOptionsBase(
    { baseUrl: getApiUrl(), fetcher: defaultFetcher },
    filters,
  )
}

export function getMarketCurrenciesQueryOptions(filters: MarketCurrenciesListFilters) {
  return getMarketCurrenciesQueryOptionsBase(
    { baseUrl: getApiUrl(), fetcher: defaultFetcher },
    filters,
  )
}
