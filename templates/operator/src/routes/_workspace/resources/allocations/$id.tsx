import { createFileRoute } from "@tanstack/react-router"
import {
  ensureResourceAllocationDetailPageData,
  ResourceAllocationDetailPage,
} from "@/components/voyant/resources/resource-allocation-detail-page"

export const Route = createFileRoute("/_workspace/resources/allocations/$id")({
  loader: ({ context, params }) =>
    ensureResourceAllocationDetailPageData(context.queryClient, params.id),
  component: ResourceAllocationDetailRoute,
})

function ResourceAllocationDetailRoute() {
  const { id } = Route.useParams()
  return <ResourceAllocationDetailPage id={id} />
}
