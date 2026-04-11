import { createFileRoute } from "@tanstack/react-router"
import { DistributionPage } from "@/components/voyant/distribution/distribution-page"
import {
  getDistributionBookingLinksQueryOptions,
  getDistributionBookingsQueryOptions,
  getDistributionChannelsQueryOptions,
  getDistributionCommissionRulesQueryOptions,
  getDistributionContractsQueryOptions,
  getDistributionMappingsQueryOptions,
  getDistributionProductsQueryOptions,
  getDistributionSuppliersQueryOptions,
  getDistributionWebhookEventsQueryOptions,
} from "@/components/voyant/distribution/distribution-query-options"

export const Route = createFileRoute("/_workspace/distribution/")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(getDistributionSuppliersQueryOptions()),
      context.queryClient.ensureQueryData(getDistributionProductsQueryOptions()),
      context.queryClient.ensureQueryData(getDistributionBookingsQueryOptions()),
      context.queryClient.ensureQueryData(getDistributionChannelsQueryOptions()),
      context.queryClient.ensureQueryData(getDistributionContractsQueryOptions()),
      context.queryClient.ensureQueryData(getDistributionCommissionRulesQueryOptions()),
      context.queryClient.ensureQueryData(getDistributionMappingsQueryOptions()),
      context.queryClient.ensureQueryData(getDistributionBookingLinksQueryOptions()),
      context.queryClient.ensureQueryData(getDistributionWebhookEventsQueryOptions()),
    ]),
  component: DistributionPage,
})
