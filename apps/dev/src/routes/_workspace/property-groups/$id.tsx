import { createFileRoute } from "@tanstack/react-router"
import { PropertyGroupDetailPage } from "@/components/voyant/property-groups/property-group-detail-page"
import { getPropertyGroupQueryOptions } from "@/components/voyant/property-groups/property-group-shared"

export const Route = createFileRoute("/_workspace/property-groups/$id")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(getPropertyGroupQueryOptions(params.id)),
  component: PropertyGroupDetailRouteComponent,
})

function PropertyGroupDetailRouteComponent() {
  const { id } = Route.useParams()
  return <PropertyGroupDetailPage id={id} />
}
