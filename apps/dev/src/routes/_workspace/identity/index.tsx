import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"
import { IdentityPage } from "@/components/voyant/identity/identity-page"
import {
  getAddressesQueryOptions,
  getContactPointsQueryOptions,
  getNamedContactsQueryOptions,
} from "@/components/voyant/identity/identity-shared"

type IdentityTab = "contact-points" | "addresses" | "named-contacts"

export const Route = createFileRoute("/_workspace/identity/")({
  validateSearch: z.object({
    entityType: z.string().optional().catch(undefined),
    entityId: z.string().optional().catch(undefined),
    tab: z.enum(["contact-points", "addresses", "named-contacts"]).optional().catch(undefined),
  }),
  loader: ({ context, location }) => {
    const url = new URL(location.href)
    const entityType = url.searchParams.get("entityType")
    const entityId = url.searchParams.get("entityId")

    if (!entityType || !entityId) return

    return Promise.all([
      context.queryClient.ensureQueryData(
        getContactPointsQueryOptions({ entityType, entityId, limit: 25, offset: 0 }),
      ),
      context.queryClient.ensureQueryData(
        getAddressesQueryOptions({ entityType, entityId, limit: 25, offset: 0 }),
      ),
      context.queryClient.ensureQueryData(
        getNamedContactsQueryOptions({ entityType, entityId, limit: 25, offset: 0 }),
      ),
    ])
  },
  component: IdentityRouteComponent,
})

function IdentityRouteComponent() {
  const { entityId = "", entityType = "", tab = "contact-points" } = Route.useSearch()
  return <IdentityPage entityType={entityType} entityId={entityId} tab={tab as IdentityTab} />
}
