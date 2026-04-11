import { createFileRoute } from "@tanstack/react-router"
import {
  defaultFetcher,
  getActivitiesQueryOptions,
  getOpportunityQueryOptions,
  getOrganizationQueryOptions,
  getPersonQueryOptions,
  getPipelineQueryOptions,
  getQuotesQueryOptions,
  getStagesQueryOptions,
  useOpportunity,
} from "@voyantjs/crm-react"
import { OpportunityDetailPage } from "@/components/voyant/crm/opportunity-detail-page"
import { getApiUrl } from "@/lib/env"

const routeClient = { baseUrl: getApiUrl(), fetcher: defaultFetcher }

export const Route = createFileRoute("/_workspace/opportunities/$id")({
  loader: async ({ context, params }) => {
    const opportunity = await context.queryClient.ensureQueryData(
      getOpportunityQueryOptions(routeClient, params.id),
    )

    await Promise.all([
      opportunity.personId
        ? context.queryClient.ensureQueryData(
            getPersonQueryOptions(routeClient, opportunity.personId),
          )
        : Promise.resolve(),
      opportunity.organizationId
        ? context.queryClient.ensureQueryData(
            getOrganizationQueryOptions(routeClient, opportunity.organizationId),
          )
        : Promise.resolve(),
      opportunity.pipelineId
        ? context.queryClient.ensureQueryData(
            getPipelineQueryOptions(routeClient, opportunity.pipelineId),
          )
        : Promise.resolve(),
      opportunity.pipelineId
        ? context.queryClient.ensureQueryData(
            getStagesQueryOptions(routeClient, { pipelineId: opportunity.pipelineId, limit: 100 }),
          )
        : Promise.resolve(),
      context.queryClient.ensureQueryData(
        getActivitiesQueryOptions(routeClient, {
          entityType: "opportunity",
          entityId: params.id,
          limit: 50,
        }),
      ),
      context.queryClient.ensureQueryData(
        getQuotesQueryOptions(routeClient, { opportunityId: params.id, limit: 50 }),
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
