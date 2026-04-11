import { createFileRoute } from "@tanstack/react-router"
import { DistributionContractDetailPage } from "@/components/voyant/distribution/contract-detail-page"
import {
  getDistributionContractChannelQueryOptions,
  getDistributionContractCommissionRulesQueryOptions,
  getDistributionContractProductsQueryOptions,
  getDistributionContractQueryOptions,
  getDistributionContractSupplierQueryOptions,
} from "@/components/voyant/distribution/distribution-detail-query-options"

export const Route = createFileRoute("/_workspace/distribution/contracts/$id")({
  loader: async ({ context, params }) => {
    const contractData = await context.queryClient.ensureQueryData(
      getDistributionContractQueryOptions(params.id),
    )

    await Promise.all([
      context.queryClient.ensureQueryData(
        getDistributionContractCommissionRulesQueryOptions(params.id),
      ),
      context.queryClient.ensureQueryData(getDistributionContractProductsQueryOptions()),
      context.queryClient.ensureQueryData(
        getDistributionContractChannelQueryOptions(contractData.data.channelId),
      ),
      contractData.data.supplierId
        ? context.queryClient.ensureQueryData(
            getDistributionContractSupplierQueryOptions(contractData.data.supplierId),
          )
        : Promise.resolve(),
    ])
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  return <DistributionContractDetailPage id={id} />
}
