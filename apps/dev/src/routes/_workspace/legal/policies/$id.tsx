import { createFileRoute } from "@tanstack/react-router"
import { PolicyDetailPage } from "./$id-page"
import {
  getLegalPolicyAcceptancesQueryOptions,
  getLegalPolicyAssignmentsQueryOptions,
  getLegalPolicyQueryOptions,
  getLegalPolicyVersionsQueryOptions,
} from "./$id-shared"

export const Route = createFileRoute("/_workspace/legal/policies/$id")({
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(getLegalPolicyQueryOptions(params.id)),
      context.queryClient.ensureQueryData(getLegalPolicyVersionsQueryOptions(params.id)),
      context.queryClient.ensureQueryData(getLegalPolicyAssignmentsQueryOptions(params.id)),
      context.queryClient.ensureQueryData(getLegalPolicyAcceptancesQueryOptions()),
    ]),
  component: PolicyDetailRoute,
})

function PolicyDetailRoute() {
  const { id } = Route.useParams()
  return <PolicyDetailPage id={id} />
}
