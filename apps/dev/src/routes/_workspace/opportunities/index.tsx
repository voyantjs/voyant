import { createFileRoute } from "@tanstack/react-router"
import {
  getOpportunitiesQueryOptions,
  getPipelinesQueryOptions,
  getStagesQueryOptions,
} from "../_crm/_lib/crm-query-options"
import { OpportunitiesKanbanPage } from "./page"

export const Route = createFileRoute("/_workspace/opportunities/")({
  loader: async ({ context }) => {
    const pipelinesResponse = await context.queryClient.ensureQueryData(
      getPipelinesQueryOptions({ entityType: "opportunity", limit: 50 }),
    )
    const pipelines = pipelinesResponse.data ?? []
    const defaultPipeline = pipelines.find((pipeline) => pipeline.isDefault) ?? pipelines[0]

    if (defaultPipeline) {
      await Promise.all([
        context.queryClient.ensureQueryData(
          getStagesQueryOptions({ pipelineId: defaultPipeline.id, limit: 100 }),
        ),
        context.queryClient.ensureQueryData(
          getOpportunitiesQueryOptions({
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
