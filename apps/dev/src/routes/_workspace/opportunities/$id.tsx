import { createFileRoute } from "@tanstack/react-router"
import { useOpportunity } from "@voyantjs/crm-react"
import {
  getActivitiesQueryOptions,
  getOpportunityQueryOptions,
  getOrganizationQueryOptions,
  getPersonQueryOptions,
  getPipelineQueryOptions,
  getQuotesQueryOptions,
  getStagesQueryOptions,
} from "../_crm/_lib/crm-query-options"
import { OpportunityDetailPage } from "./$id-page"

export const Route = createFileRoute("/_workspace/opportunities/$id")({
  loader: async ({ context, params }) => {
    const opportunity = await context.queryClient.ensureQueryData(
      getOpportunityQueryOptions(params.id),
    )

    await Promise.all([
      opportunity.personId
        ? context.queryClient.ensureQueryData(getPersonQueryOptions(opportunity.personId))
        : Promise.resolve(),
      opportunity.organizationId
        ? context.queryClient.ensureQueryData(
            getOrganizationQueryOptions(opportunity.organizationId),
          )
        : Promise.resolve(),
      opportunity.pipelineId
        ? context.queryClient.ensureQueryData(getPipelineQueryOptions(opportunity.pipelineId))
        : Promise.resolve(),
      opportunity.pipelineId
        ? context.queryClient.ensureQueryData(
            getStagesQueryOptions({ pipelineId: opportunity.pipelineId, limit: 100 }),
          )
        : Promise.resolve(),
      context.queryClient.ensureQueryData(
        getActivitiesQueryOptions({
          entityType: "opportunity",
          entityId: params.id,
          limit: 50,
        }),
      ),
      context.queryClient.ensureQueryData(
        getQuotesQueryOptions({ opportunityId: params.id, limit: 50 }),
      ),
    ])
  },
  component: OpportunityDetailRoute,
})

function OpportunityDetailRoute() {
  const { id } = Route.useParams()
  useOpportunity(id)
  return <OpportunityDetailPage id={id} />
}
