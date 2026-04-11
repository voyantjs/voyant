import {
  defaultFetcher,
  getOffersQueryOptions as getOffersQueryOptionsBase,
  getOrdersQueryOptions as getOrdersQueryOptionsBase,
  type OfferRecord,
  type OffersListFilters,
  type OrderRecord,
  type OrdersListFilters,
} from "@voyantjs/transactions-react"
import { getApiUrl } from "@/lib/env"

export type OfferData = OfferRecord
export type OrderData = OrderRecord

export function getOffersQueryOptions(filters: OffersListFilters = {}) {
  return getOffersQueryOptionsBase({ baseUrl: getApiUrl(), fetcher: defaultFetcher }, filters)
}

export function getOrdersQueryOptions(filters: OrdersListFilters = {}) {
  return getOrdersQueryOptionsBase({ baseUrl: getApiUrl(), fetcher: defaultFetcher }, filters)
}
