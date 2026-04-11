import { queryOptions } from "@tanstack/react-query"
import {
  defaultFetcher,
  getBookingLinksQueryOptions as getBookingLinksQueryOptionsBase,
  getBookingsQueryOptions as getBookingsQueryOptionsBase,
  getChannelsQueryOptions as getChannelsQueryOptionsBase,
  getCommissionRulesQueryOptions as getCommissionRulesQueryOptionsBase,
  getContractsQueryOptions as getContractsQueryOptionsBase,
  getMappingsQueryOptions as getMappingsQueryOptionsBase,
  getProductsQueryOptions as getProductsQueryOptionsBase,
  getSuppliersQueryOptions as getSuppliersQueryOptionsBase,
  getWebhookEventsQueryOptions as getWebhookEventsQueryOptionsBase,
} from "@voyantjs/distribution-react"

const client = { baseUrl: "", fetcher: defaultFetcher }

export function getDistributionSuppliersQueryOptions() {
  return queryOptions(getSuppliersQueryOptionsBase(client, { limit: 25, offset: 0 }))
}

export function getDistributionProductsQueryOptions() {
  return queryOptions(getProductsQueryOptionsBase(client, { limit: 25, offset: 0 }))
}

export function getDistributionBookingsQueryOptions() {
  return queryOptions(getBookingsQueryOptionsBase(client, { limit: 25, offset: 0 }))
}

export function getDistributionChannelsQueryOptions() {
  return queryOptions(getChannelsQueryOptionsBase(client, { limit: 25, offset: 0 }))
}

export function getDistributionContractsQueryOptions() {
  return queryOptions(getContractsQueryOptionsBase(client, { limit: 25, offset: 0 }))
}

export function getDistributionCommissionRulesQueryOptions() {
  return queryOptions(getCommissionRulesQueryOptionsBase(client, { limit: 25, offset: 0 }))
}

export function getDistributionMappingsQueryOptions() {
  return queryOptions(getMappingsQueryOptionsBase(client, { limit: 25, offset: 0 }))
}

export function getDistributionBookingLinksQueryOptions() {
  return queryOptions(getBookingLinksQueryOptionsBase(client, { limit: 25, offset: 0 }))
}

export function getDistributionWebhookEventsQueryOptions() {
  return queryOptions(getWebhookEventsQueryOptionsBase(client, { limit: 25, offset: 0 }))
}
