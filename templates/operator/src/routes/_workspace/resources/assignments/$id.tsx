import { createFileRoute } from "@tanstack/react-router"
import {
  ensureResourceAssignmentDetailPageData,
  ResourceAssignmentDetailPage,
} from "@/components/voyant/resources/resource-assignment-detail-page"
import { ResourceAssignmentDetailSkeleton } from "@/components/voyant/resources/resource-assignment-detail-skeleton"

export const Route = createFileRoute("/_workspace/resources/assignments/$id")({
  loader: ({ context, params }) =>
    ensureResourceAssignmentDetailPageData(context.queryClient, params.id),
  pendingComponent: ResourceAssignmentDetailSkeleton,
  component: ResourceAssignmentDetailRoute,
})

function ResourceAssignmentDetailRoute() {
  const { id } = Route.useParams()
  return <ResourceAssignmentDetailPage id={id} />
}
