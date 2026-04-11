import { createFileRoute } from "@tanstack/react-router"
import {
  loadResourceAllocationDetailPage,
  ResourceAllocationDetailPage,
} from "@/components/voyant/resources/resource-allocation-detail-page"

export const Route = createFileRoute("/_workspace/resources/allocations/$id")({
  loader: ({ context, params }) =>
    loadResourceAllocationDetailPage(context.queryClient.ensureQueryData, params.id),
  component: ResourceAllocationDetailRoute,
})

function ResourceAllocationDetailRoute() {
  const { id } = Route.useParams()
  return <ResourceAllocationDetailPage id={id} />
}
