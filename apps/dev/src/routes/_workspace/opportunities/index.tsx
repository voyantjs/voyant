import { createFileRoute } from "@tanstack/react-router"
import {
  defaultFetcher,
  getOpportunitiesQueryOptions,
  getPipelinesQueryOptions,
  getStagesQueryOptions,
} from "@voyantjs/crm-react"
import { OpportunitiesKanbanPage } from "@/components/voyant/crm/opportunities-page"
import { getApiUrl } from "@/lib/env"

const routeClient = { baseUrl: getApiUrl(), fetcher: defaultFetcher }

export const Route = createFileRoute("/_workspace/opportunities/")({
  loader: async ({ context }) => {
    const pipelinesResponse = await context.queryClient.ensureQueryData(
      getPipelinesQueryOptions(routeClient, { entityType: "opportunity", limit: 50 }),
    )
    const pipelines = pipelinesResponse.data ?? []
    const defaultPipeline = pipelines.find((pipeline) => pipeline.isDefault) ?? pipelines[0]

    if (defaultPipeline) {
      await Promise.all([
        context.queryClient.ensureQueryData(
          getStagesQueryOptions(routeClient, { pipelineId: defaultPipeline.id, limit: 100 }),
        ),
        context.queryClient.ensureQueryData(
          getOpportunitiesQueryOptions(routeClient, {
            pipelineId: defaultPipeline.id,
            status: "open",
            limit: 500,
          }),
        ),
      ])
    }
  },
  component: OpportunitiesKanbanPage,
})
