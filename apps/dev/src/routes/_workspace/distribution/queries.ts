import { queryOptions } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import type {
  BookingOption,
  ChannelBookingLinkRow,
  ChannelCommissionRuleRow,
  ChannelContractRow,
  ChannelProductMappingRow,
  ChannelRow,
  ChannelWebhookEventRow,
  ListResponse,
  ProductOption,
  SupplierOption,
} from "./shared"

export function getDistributionSuppliersQueryOptions() {
  return queryOptions({
    queryKey: ["distribution", "suppliers"],
    queryFn: () => api.get<ListResponse<SupplierOption>>("/v1/suppliers?limit=200"),
  })
}

export function getDistributionProductsQueryOptions() {
  return queryOptions({
    queryKey: ["distribution", "products"],
    queryFn: () => api.get<ListResponse<ProductOption>>("/v1/products?limit=100"),
  })
}

export function getDistributionBookingsQueryOptions() {
  return queryOptions({
    queryKey: ["distribution", "bookings"],
    queryFn: () => api.get<ListResponse<BookingOption>>("/v1/bookings?limit=200"),
  })
}

export function getDistributionChannelsQueryOptions() {
  return queryOptions({
    queryKey: ["distribution", "channels"],
    queryFn: () => api.get<ListResponse<ChannelRow>>("/v1/distribution/channels?limit=200"),
  })
}

export function getDistributionContractsQueryOptions() {
  return queryOptions({
    queryKey: ["distribution", "contracts"],
    queryFn: () =>
      api.get<ListResponse<ChannelContractRow>>("/v1/distribution/contracts?limit=200"),
  })
}

export function getDistributionCommissionRulesQueryOptions() {
  return queryOptions({
    queryKey: ["distribution", "commission-rules"],
    queryFn: () =>
      api.get<ListResponse<ChannelCommissionRuleRow>>(
        "/v1/distribution/commission-rules?limit=200",
      ),
  })
}

export function getDistributionMappingsQueryOptions() {
  return queryOptions({
    queryKey: ["distribution", "product-mappings"],
    queryFn: () =>
      api.get<ListResponse<ChannelProductMappingRow>>(
        "/v1/distribution/product-mappings?limit=200",
      ),
  })
}

export function getDistributionBookingLinksQueryOptions() {
  return queryOptions({
    queryKey: ["distribution", "booking-links"],
    queryFn: () =>
      api.get<ListResponse<ChannelBookingLinkRow>>("/v1/distribution/booking-links?limit=200"),
  })
}

export function getDistributionWebhookEventsQueryOptions() {
  return queryOptions({
    queryKey: ["distribution", "webhook-events"],
    queryFn: () =>
      api.get<ListResponse<ChannelWebhookEventRow>>("/v1/distribution/webhook-events?limit=200"),
  })
}
