import { createFileRoute } from "@tanstack/react-router"
import { FacilitiesPage } from "@/components/voyant/facilities/facilities-page"
import { getFacilitiesQueryOptions } from "@/components/voyant/facilities/facility-shared"

export const Route = createFileRoute("/_workspace/facilities/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(getFacilitiesQueryOptions({ limit: 25, offset: 0 })),
  component: FacilitiesRouteComponent,
})

function FacilitiesRouteComponent() {
  return <FacilitiesPage />
}
