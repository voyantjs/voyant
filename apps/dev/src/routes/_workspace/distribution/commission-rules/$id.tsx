import { createFileRoute } from "@tanstack/react-router"
import { DistributionCommissionRuleDetailPage } from "@/components/voyant/distribution/commission-rule-detail-page"
import {
  getDistributionCommissionRuleChannelQueryOptions,
  getDistributionCommissionRuleContractQueryOptions,
  getDistributionCommissionRuleProductQueryOptions,
  getDistributionCommissionRuleQueryOptions,
} from "@/components/voyant/distribution/distribution-detail-query-options"

export const Route = createFileRoute("/_workspace/distribution/commission-rules/$id")({
  loader: async ({ context, params }) => {
    const ruleData = await context.queryClient.ensureQueryData(
      getDistributionCommissionRuleQueryOptions(params.id),
    )

    const contractPromise = context.queryClient.ensureQueryData(
      getDistributionCommissionRuleContractQueryOptions(ruleData.data.contractId),
    )
    const tasks: Promise<unknown>[] = [contractPromise]

    if (ruleData.data.productId) {
      tasks.push(
        context.queryClient.ensureQueryData(
          getDistributionCommissionRuleProductQueryOptions(ruleData.data.productId),
        ),
      )
    }

    const contractData = await contractPromise

    await Promise.all([
      ...tasks,
      context.queryClient.ensureQueryData(
        getDistributionCommissionRuleChannelQueryOptions(contractData.data.channelId),
      ),
    ])
  },
  component: DistributionCommissionRuleDetailRoute,
})
function DistributionCommissionRuleDetailRoute() {
  const { id } = Route.useParams()
  return <DistributionCommissionRuleDetailPage id={id} />
}
