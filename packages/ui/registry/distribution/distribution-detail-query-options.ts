import {
  defaultFetcher,
  getBookingLinkQueryOptions as getBookingLinkQueryOptionsBase,
  getBookingLinksQueryOptions as getBookingLinksQueryOptionsBase,
  getBookingQueryOptions as getBookingQueryOptionsBase,
  getBookingsQueryOptions as getBookingsQueryOptionsBase,
  getChannelQueryOptions as getChannelQueryOptionsBase,
  getCommissionRuleQueryOptions as getCommissionRuleQueryOptionsBase,
  getCommissionRulesQueryOptions as getCommissionRulesQueryOptionsBase,
  getContractQueryOptions as getContractQueryOptionsBase,
  getContractsQueryOptions as getContractsQueryOptionsBase,
  getMappingQueryOptions as getMappingQueryOptionsBase,
  getMappingsQueryOptions as getMappingsQueryOptionsBase,
  getProductQueryOptions as getProductQueryOptionsBase,
  getProductsQueryOptions as getProductsQueryOptionsBase,
  getSupplierQueryOptions as getSupplierQueryOptionsBase,
  getSuppliersQueryOptions as getSuppliersQueryOptionsBase,
  getWebhookEventQueryOptions as getWebhookEventQueryOptionsBase,
  getWebhookEventsQueryOptions as getWebhookEventsQueryOptionsBase,
} from "@voyantjs/distribution-react"

const client = { baseUrl: "", fetcher: defaultFetcher }

export function getDistributionChannelQueryOptions(id: string) {
  return getChannelQueryOptionsBase(client, id)
}

export function getDistributionChannelContractsQueryOptions(id: string) {
  return getContractsQueryOptionsBase(client, { channelId: id, limit: 25, offset: 0 })
}

export function getDistributionChannelMappingsQueryOptions(id: string) {
  return getMappingsQueryOptionsBase(client, { channelId: id, limit: 25, offset: 0 })
}

export function getDistributionChannelBookingLinksQueryOptions(id: string) {
  return getBookingLinksQueryOptionsBase(client, { channelId: id, limit: 25, offset: 0 })
}

export function getDistributionChannelWebhookEventsQueryOptions(id: string) {
  return getWebhookEventsQueryOptionsBase(client, { channelId: id, limit: 25, offset: 0 })
}

export function getDistributionChannelProductsQueryOptions() {
  return getProductsQueryOptionsBase(client, { limit: 25, offset: 0 })
}

export function getDistributionChannelBookingsQueryOptions() {
  return getBookingsQueryOptionsBase(client, { limit: 25, offset: 0 })
}

export function getDistributionChannelSuppliersQueryOptions() {
  return getSuppliersQueryOptionsBase(client, { limit: 25, offset: 0 })
}

export function getDistributionContractQueryOptions(id: string) {
  return getContractQueryOptionsBase(client, id)
}

export function getDistributionContractChannelQueryOptions(channelId: string) {
  return getChannelQueryOptionsBase(client, channelId)
}

export function getDistributionContractSupplierQueryOptions(supplierId: string) {
  return getSupplierQueryOptionsBase(client, supplierId)
}

export function getDistributionContractCommissionRulesQueryOptions(id: string) {
  return getCommissionRulesQueryOptionsBase(client, { contractId: id, limit: 25, offset: 0 })
}

export function getDistributionContractProductsQueryOptions() {
  return getProductsQueryOptionsBase(client, { limit: 25, offset: 0 })
}

export function getDistributionCommissionRuleQueryOptions(id: string) {
  return getCommissionRuleQueryOptionsBase(client, id)
}

export function getDistributionCommissionRuleContractQueryOptions(contractId: string) {
  return getContractQueryOptionsBase(client, contractId)
}

export function getDistributionCommissionRuleChannelQueryOptions(channelId: string) {
  return getChannelQueryOptionsBase(client, channelId)
}

export function getDistributionCommissionRuleProductQueryOptions(productId: string) {
  return getProductQueryOptionsBase(client, productId)
}

export function getDistributionMappingQueryOptions(id: string) {
  return getMappingQueryOptionsBase(client, id)
}

export function getDistributionMappingChannelQueryOptions(channelId: string) {
  return getChannelQueryOptionsBase(client, channelId)
}

export function getDistributionMappingProductQueryOptions(productId: string) {
  return getProductQueryOptionsBase(client, productId)
}

export function getDistributionBookingLinkQueryOptions(id: string) {
  return getBookingLinkQueryOptionsBase(client, id)
}

export function getDistributionBookingLinkChannelQueryOptions(channelId: string) {
  return getChannelQueryOptionsBase(client, channelId)
}

export function getDistributionBookingLinkBookingQueryOptions(bookingId: string) {
  return getBookingQueryOptionsBase(client, bookingId)
}

export function getDistributionWebhookEventQueryOptions(id: string) {
  return getWebhookEventQueryOptionsBase(client, id)
}

export function getDistributionWebhookEventChannelQueryOptions(channelId: string) {
  return getChannelQueryOptionsBase(client, channelId)
}
