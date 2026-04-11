import { createFileRoute } from "@tanstack/react-router"
import { PropertiesPage } from "@/components/voyant/properties/properties-page"
import { getPropertiesQueryOptions } from "@/components/voyant/properties/property-shared"

export const Route = createFileRoute("/_workspace/properties/")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(getPropertiesQueryOptions({ limit: 25, offset: 0 })),
    ]),
  component: PropertiesPage,
})
