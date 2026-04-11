import { createFileRoute } from "@tanstack/react-router"
import {
  getDistributionMappingChannelQueryOptions,
  getDistributionMappingProductQueryOptions,
  getDistributionMappingQueryOptions,
} from "@/components/voyant/distribution/distribution-detail-query-options"
import { DistributionMappingDetailPage } from "@/components/voyant/distribution/mapping-detail-page"

export const Route = createFileRoute("/_workspace/distribution/mappings/$id")({
  loader: async ({ context, params }) => {
    const mappingData = await context.queryClient.ensureQueryData(
      getDistributionMappingQueryOptions(params.id),
    )

    await Promise.all([
      context.queryClient.ensureQueryData(
        getDistributionMappingChannelQueryOptions(mappingData.data.channelId),
      ),
      context.queryClient.ensureQueryData(
        getDistributionMappingProductQueryOptions(mappingData.data.productId),
      ),
    ])
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  return <DistributionMappingDetailPage id={id} />
}
