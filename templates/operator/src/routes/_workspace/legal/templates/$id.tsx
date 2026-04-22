import { createFileRoute } from "@tanstack/react-router"
import {
  loadTemplateDetailPage,
  TemplateDetailPage,
} from "@/components/voyant/legal/template-detail-page"

export const Route = createFileRoute("/_workspace/legal/templates/$id")({
  loader: ({ context, params }) =>
    loadTemplateDetailPage(params.id, (options) => context.queryClient.ensureQueryData(options)),
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  return <TemplateDetailPage id={id} />
}
