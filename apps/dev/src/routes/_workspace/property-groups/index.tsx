import { createFileRoute } from "@tanstack/react-router"
import { getPropertyGroupsQueryOptions } from "@/components/voyant/property-groups/property-group-shared"
import { PropertyGroupsPage } from "@/components/voyant/property-groups/property-groups-page"

export const Route = createFileRoute("/_workspace/property-groups/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(getPropertyGroupsQueryOptions({ limit: 25, offset: 0 })),
  component: PropertyGroupsRouteComponent,
})

function PropertyGroupsRouteComponent() {
  return <PropertyGroupsPage />
}
