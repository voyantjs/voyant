import { createFileRoute } from "@tanstack/react-router"
import {
  loadResourcePoolDetailPage,
  ResourcePoolDetailPage,
} from "@/components/voyant/resources/resource-pool-detail-page"

export const Route = createFileRoute("/_workspace/resources/pools/$id")({
  loader: ({ context, params }) =>
    loadResourcePoolDetailPage(context.queryClient.ensureQueryData, params.id),
  component: ResourcePoolDetailRoute,
})

function ResourcePoolDetailRoute() {
  const { id } = Route.useParams()
  return <ResourcePoolDetailPage id={id} />
}
