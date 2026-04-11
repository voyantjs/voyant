import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"
import { ExternalRefsPage } from "@/components/voyant/external-refs/external-refs-page"
import { getExternalRefsQueryOptions } from "@/components/voyant/external-refs/external-refs-shared"

export const Route = createFileRoute("/_workspace/external-refs/")({
  validateSearch: z.object({
    entityType: z.string().optional().catch(undefined),
    entityId: z.string().optional().catch(undefined),
  }),
  loader: ({ context, location }) => {
    const url = new URL(location.href)
    const entityType = url.searchParams.get("entityType")
    const entityId = url.searchParams.get("entityId")

    if (!entityType || !entityId) return

    return context.queryClient.ensureQueryData(
      getExternalRefsQueryOptions({ entityType, entityId, limit: 25, offset: 0 }),
    )
  },
  component: ExternalRefsRouteComponent,
})

function ExternalRefsRouteComponent() {
  const { entityId = "", entityType = "" } = Route.useSearch()
  return <ExternalRefsPage entityType={entityType} entityId={entityId} />
}
