import { createFileRoute } from "@tanstack/react-router"
import {
  defaultFetcher,
  getOrganizationQueryOptions,
  getPersonActivitiesQueryOptions,
  getPersonNotesQueryOptions,
  getPersonOpportunitiesQueryOptions,
  getPersonQueryOptions,
} from "@voyantjs/crm-react"
import { PersonDetailPage } from "@/components/voyant/crm/person-detail-page"
import { getApiUrl } from "@/lib/env"

const routeClient = { baseUrl: getApiUrl(), fetcher: defaultFetcher }

export const Route = createFileRoute("/_workspace/people/$id")({
  loader: async ({ context, params }) => {
    const person = await context.queryClient.ensureQueryData(
      getPersonQueryOptions(routeClient, params.id),
    )

    await Promise.all([
      person.organizationId
        ? context.queryClient.ensureQueryData(
            getOrganizationQueryOptions(routeClient, person.organizationId),
          )
        : Promise.resolve(),
      context.queryClient.ensureQueryData(getPersonNotesQueryOptions(routeClient, params.id)),
      context.queryClient.ensureQueryData(getPersonActivitiesQueryOptions(routeClient, params.id)),
      context.queryClient.ensureQueryData(
        getPersonOpportunitiesQueryOptions(routeClient, params.id),
      ),
    ])
  },
  component: PersonDetailRoute,
})

function PersonDetailRoute() {
  const { id } = Route.useParams()
  return <PersonDetailPage id={id} />
}
