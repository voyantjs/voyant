import { createFileRoute } from "@tanstack/react-router"
import {
  AvailabilityStartTimeDetailPage,
  loadAvailabilityStartTimeDetailPage,
} from "@/components/voyant/availability/availability-start-time-detail-page"

export const Route = createFileRoute("/_workspace/availability/start-times/$id")({
  loader: ({ context, params }) =>
    loadAvailabilityStartTimeDetailPage(context.queryClient.ensureQueryData, params.id),
  component: AvailabilityStartTimeDetailRoute,
})

function AvailabilityStartTimeDetailRoute() {
  const { id } = Route.useParams()
  return <AvailabilityStartTimeDetailPage id={id} />
}
