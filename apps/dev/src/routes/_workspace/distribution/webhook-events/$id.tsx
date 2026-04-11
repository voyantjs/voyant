import { createFileRoute } from "@tanstack/react-router"
import {
  getDistributionWebhookEventChannelQueryOptions,
  getDistributionWebhookEventQueryOptions,
} from "@/components/voyant/distribution/distribution-detail-query-options"
import { DistributionWebhookEventDetailPage } from "@/components/voyant/distribution/webhook-event-detail-page"

export const Route = createFileRoute("/_workspace/distribution/webhook-events/$id")({
  loader: async ({ context, params }) => {
    const eventData = await context.queryClient.ensureQueryData(
      getDistributionWebhookEventQueryOptions(params.id),
    )

    await context.queryClient.ensureQueryData(
      getDistributionWebhookEventChannelQueryOptions(eventData.data.channelId),
    )
  },
  component: DistributionWebhookEventDetailRoute,
})
function DistributionWebhookEventDetailRoute() {
  const { id } = Route.useParams()
  return <DistributionWebhookEventDetailPage id={id} />
}
