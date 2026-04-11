import { createFileRoute } from "@tanstack/react-router"
import { DistributionBookingLinkDetailPage } from "@/components/voyant/distribution/booking-link-detail-page"
import {
  getDistributionBookingLinkBookingQueryOptions,
  getDistributionBookingLinkChannelQueryOptions,
  getDistributionBookingLinkQueryOptions,
} from "@/components/voyant/distribution/distribution-detail-query-options"

export const Route = createFileRoute("/_workspace/distribution/booking-links/$id")({
  loader: async ({ context, params }) => {
    const linkData = await context.queryClient.ensureQueryData(
      getDistributionBookingLinkQueryOptions(params.id),
    )

    await Promise.all([
      context.queryClient.ensureQueryData(
        getDistributionBookingLinkChannelQueryOptions(linkData.data.channelId),
      ),
      context.queryClient.ensureQueryData(
        getDistributionBookingLinkBookingQueryOptions(linkData.data.bookingId),
      ),
    ])
  },
  component: DistributionBookingLinkDetailRoute,
})
function DistributionBookingLinkDetailRoute() {
  const { id } = Route.useParams()
  return <DistributionBookingLinkDetailPage id={id} />
}
