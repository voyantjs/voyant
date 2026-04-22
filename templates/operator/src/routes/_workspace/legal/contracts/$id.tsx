import { createFileRoute } from "@tanstack/react-router"
import {
  ContractDetailPage,
  loadContractDetailPage,
} from "@/components/voyant/legal/contract-detail-page"

export const Route = createFileRoute("/_workspace/legal/contracts/$id")({
  loader: ({ context, params }) =>
    loadContractDetailPage(params.id, (options) => context.queryClient.ensureQueryData(options)),
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  return <ContractDetailPage id={id} />
}
