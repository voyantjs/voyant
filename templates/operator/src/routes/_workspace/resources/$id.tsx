import { createFileRoute } from "@tanstack/react-router"
import {
  ensureResourceDetailPageData,
  ResourceDetailPage,
} from "@/components/voyant/resources/resource-detail-page"

export const Route = createFileRoute("/_workspace/resources/$id")({
  loader: ({ context, params }) => ensureResourceDetailPageData(context.queryClient, params.id),
  component: ResourceDetailRoute,
})

function ResourceDetailRoute() {
  const { id } = Route.useParams()
  return <ResourceDetailPage id={id} />
}
