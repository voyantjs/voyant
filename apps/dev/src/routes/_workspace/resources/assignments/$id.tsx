import { createFileRoute } from "@tanstack/react-router"
import {
  loadResourceAssignmentDetailPage,
  ResourceAssignmentDetailPage,
} from "@/components/voyant/resources/resource-assignment-detail-page"

export const Route = createFileRoute("/_workspace/resources/assignments/$id")({
  loader: ({ context, params }) =>
    loadResourceAssignmentDetailPage(context.queryClient.ensureQueryData, params.id),
  component: ResourceAssignmentDetailRoute,
})

function ResourceAssignmentDetailRoute() {
  const { id } = Route.useParams()
  return <ResourceAssignmentDetailPage id={id} />
}
