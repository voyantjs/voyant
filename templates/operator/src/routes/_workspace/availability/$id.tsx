import { createFileRoute } from "@tanstack/react-router"
import {
  AvailabilitySlotDetailPage,
  loadAvailabilitySlotDetailPage,
} from "@/components/voyant/availability/availability-slot-detail-page"
import { AvailabilitySlotDetailSkeleton } from "@/components/voyant/availability/availability-slot-detail-skeleton"

export const Route = createFileRoute("/_workspace/availability/$id")({
  loader: ({ context, params }) =>
    loadAvailabilitySlotDetailPage(context.queryClient.ensureQueryData, params.id),
  pendingComponent: AvailabilitySlotDetailSkeleton,
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  return <AvailabilitySlotDetailPage id={id} />
}
