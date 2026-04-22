import { createFileRoute } from "@tanstack/react-router"
import {
  ensureResourcePoolDetailPageData,
  ResourcePoolDetailPage,
} from "@/components/voyant/resources/resource-pool-detail-page"
import { ResourcePoolDetailSkeleton } from "@/components/voyant/resources/resource-pool-detail-skeleton"

export const Route = createFileRoute("/_workspace/resources/pools/$id")({
  loader: ({ context, params }) => ensureResourcePoolDetailPageData(context.queryClient, params.id),
  pendingComponent: ResourcePoolDetailSkeleton,
  component: ResourcePoolDetailRoute,
})

function ResourcePoolDetailRoute() {
  const { id } = Route.useParams()
  return <ResourcePoolDetailPage id={id} />
}
