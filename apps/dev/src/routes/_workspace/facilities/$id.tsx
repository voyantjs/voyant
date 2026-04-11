import { createFileRoute } from "@tanstack/react-router"
import { FacilityDetailPage } from "@/components/voyant/facilities/facility-detail-page"
import { getFacilityQueryOptions } from "@/components/voyant/facilities/facility-shared"

export const Route = createFileRoute("/_workspace/facilities/$id")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(getFacilityQueryOptions(params.id)),
  component: FacilityDetailRouteComponent,
})

function FacilityDetailRouteComponent() {
  const { id } = Route.useParams()
  return <FacilityDetailPage id={id} />
}
