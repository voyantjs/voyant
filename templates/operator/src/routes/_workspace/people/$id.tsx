import { createFileRoute } from "@tanstack/react-router"
import {
  getOrganizationQueryOptions,
  getPersonActivitiesQueryOptions,
  getPersonNotesQueryOptions,
  getPersonOpportunitiesQueryOptions,
  getPersonQueryOptions,
} from "@/components/voyant/crm/crm-query-options"
import { PersonDetailPage } from "@/components/voyant/crm/person-detail-page"
import { PersonDetailSkeleton } from "@/components/voyant/crm/person-detail-skeleton"

export const Route = createFileRoute("/_workspace/people/$id")({
  loader: async ({ context, params }) => {
    const person = await context.queryClient.ensureQueryData(getPersonQueryOptions(params.id))

    await Promise.all([
      person.organizationId
        ? context.queryClient.ensureQueryData(getOrganizationQueryOptions(person.organizationId))
        : Promise.resolve(),
      context.queryClient.ensureQueryData(getPersonNotesQueryOptions(params.id)),
      context.queryClient.ensureQueryData(getPersonActivitiesQueryOptions(params.id)),
      context.queryClient.ensureQueryData(getPersonOpportunitiesQueryOptions(params.id)),
    ])
  },
  pendingComponent: PersonDetailSkeleton,
  component: PersonDetailRoute,
})

function PersonDetailRoute() {
  const { id } = Route.useParams()
  return <PersonDetailPage id={id} />
}
