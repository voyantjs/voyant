import { queryOptions } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Link2 } from "lucide-react"
import { z } from "zod"
import { Input, Label } from "@/components/ui"
import { api } from "@/lib/api-client"
import { ExternalRefsTab } from "./_components/external-refs-tab"

type ExternalRefData = {
  id: string
}

type ListResponse<T> = { data: T[]; total: number; limit: number; offset: number }

function getExternalRefsQueryOptions(entityType: string, entityId: string) {
  return queryOptions({
    queryKey: ["external-refs", entityType, entityId],
    queryFn: () =>
      api.get<ListResponse<ExternalRefData>>(
        `/v1/external-refs/entities/${encodeURIComponent(entityType)}/${encodeURIComponent(entityId)}/refs?limit=200`,
      ),
  })
}

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

    return context.queryClient.ensureQueryData(getExternalRefsQueryOptions(entityType, entityId))
  },
  component: ExternalRefsPage,
})

function ExternalRefsPage() {
  const navigate = useNavigate()
  const { entityId = "", entityType = "" } = Route.useSearch()

  const scopeReady = entityType.trim().length > 0 && entityId.trim().length > 0

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <Link2 className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-2xl font-bold tracking-tight">External References</h1>
      </div>

      <p className="max-w-2xl text-sm text-muted-foreground">
        IDs from third-party systems (Bokun, Pipedrive, Stripe, etc.) linked to Voyant entities.
        Enter the entity type and ID below to manage its external references.
      </p>

      <div className="grid max-w-2xl grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label>Entity type</Label>
          <Input
            value={entityType}
            onChange={(e) => {
              const value = e.target.value
              void navigate({
                to: ".",
                replace: true,
                search: (prev) => ({
                  ...prev,
                  entityType: value || undefined,
                }),
              })
            }}
            placeholder="person, booking, product…"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Entity ID</Label>
          <Input
            value={entityId}
            onChange={(e) => {
              const value = e.target.value
              void navigate({
                to: ".",
                replace: true,
                search: (prev) => ({
                  ...prev,
                  entityId: value || undefined,
                }),
              })
            }}
            placeholder="prsn_… / book_… / prod_…"
            className="font-mono text-xs"
          />
        </div>
      </div>

      {!scopeReady && (
        <div className="rounded-md border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">
            Enter an entity type and ID above to browse its external references.
          </p>
        </div>
      )}

      {scopeReady && <ExternalRefsTab entityType={entityType} entityId={entityId} />}
    </div>
  )
}
