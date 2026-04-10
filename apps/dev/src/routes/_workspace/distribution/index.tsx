import { createFileRoute } from "@tanstack/react-router"
import { DistributionPage } from "./page"
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
} from "./queries"

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
