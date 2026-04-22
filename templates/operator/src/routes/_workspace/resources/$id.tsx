import { createFileRoute } from "@tanstack/react-router"
import {
  ensureResourceDetailPageData,
  ResourceDetailPage,
} from "@/components/voyant/resources/resource-detail-page"
import { ResourceDetailSkeleton } from "@/components/voyant/resources/resource-detail-skeleton"

export const Route = createFileRoute("/_workspace/resources/$id")({
  loader: ({ context, params }) => ensureResourceDetailPageData(context.queryClient, params.id),
  pendingComponent: ResourceDetailSkeleton,
  component: ResourceDetailRoute,
})

function ResourceDetailRoute() {
  const { id } = Route.useParams()
  return <ResourceDetailPage id={id} />
}
