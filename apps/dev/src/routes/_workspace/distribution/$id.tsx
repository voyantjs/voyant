import { createFileRoute } from "@tanstack/react-router"
import { ChannelDetailPage } from "@/components/voyant/distribution/channel-detail-page"
import {
  getDistributionChannelBookingLinksQueryOptions,
  getDistributionChannelBookingsQueryOptions,
  getDistributionChannelContractsQueryOptions,
  getDistributionChannelMappingsQueryOptions,
  getDistributionChannelProductsQueryOptions,
  getDistributionChannelQueryOptions,
  getDistributionChannelSuppliersQueryOptions,
  getDistributionChannelWebhookEventsQueryOptions,
} from "@/components/voyant/distribution/distribution-detail-query-options"

export const Route = createFileRoute("/_workspace/distribution/$id")({
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(getDistributionChannelQueryOptions(params.id)),
      context.queryClient.ensureQueryData(getDistributionChannelContractsQueryOptions(params.id)),
      context.queryClient.ensureQueryData(getDistributionChannelMappingsQueryOptions(params.id)),
      context.queryClient.ensureQueryData(
        getDistributionChannelBookingLinksQueryOptions(params.id),
      ),
      context.queryClient.ensureQueryData(
        getDistributionChannelWebhookEventsQueryOptions(params.id),
      ),
      context.queryClient.ensureQueryData(getDistributionChannelProductsQueryOptions()),
      context.queryClient.ensureQueryData(getDistributionChannelBookingsQueryOptions()),
      context.queryClient.ensureQueryData(getDistributionChannelSuppliersQueryOptions()),
    ]),
  component: DistributionChannelDetailRoute,
})

function DistributionChannelDetailRoute() {
  const { id } = Route.useParams()
  return <ChannelDetailPage id={id} />
}
