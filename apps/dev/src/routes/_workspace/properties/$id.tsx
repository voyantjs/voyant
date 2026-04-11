import { createFileRoute } from "@tanstack/react-router"
import { PropertyDetailPage } from "@/components/voyant/properties/property-detail-page"
import {
  getFacilityQueryOptions,
  getPropertyQueryOptions,
} from "@/components/voyant/properties/property-shared"

export const Route = createFileRoute("/_workspace/properties/$id")({
  loader: async ({ context, params }) => {
    const property = await context.queryClient.ensureQueryData(getPropertyQueryOptions(params.id))

    if (property?.facilityId) {
      await context.queryClient.ensureQueryData(getFacilityQueryOptions(property.facilityId))
    }
  },
  component: PropertyDetailRoute,
})

function PropertyDetailRoute() {
  const { id } = Route.useParams()
  return <PropertyDetailPage id={id} />
}
