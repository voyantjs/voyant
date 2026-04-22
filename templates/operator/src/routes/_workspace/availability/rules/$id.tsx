import { createFileRoute } from "@tanstack/react-router"
import {
  AvailabilityRuleDetailPage,
  loadAvailabilityRuleDetailPage,
} from "@/components/voyant/availability/availability-rule-detail-page"
import { AvailabilityRuleDetailSkeleton } from "@/components/voyant/availability/availability-rule-detail-skeleton"

export const Route = createFileRoute("/_workspace/availability/rules/$id")({
  loader: ({ context, params }) =>
    loadAvailabilityRuleDetailPage(context.queryClient.ensureQueryData, params.id),
  pendingComponent: AvailabilityRuleDetailSkeleton,
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  return <AvailabilityRuleDetailPage id={id} />
}
