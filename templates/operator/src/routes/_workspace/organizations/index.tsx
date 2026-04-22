import { createFileRoute } from "@tanstack/react-router"
import { getOrganizationsQueryOptions } from "@/components/voyant/crm/crm-query-options"
import { OrganizationsListSkeleton } from "@/components/voyant/crm/organizations-list-skeleton"
import { OrganizationsPage } from "@/components/voyant/crm/organizations-page"

export const Route = createFileRoute("/_workspace/organizations/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(getOrganizationsQueryOptions({ limit: 25, offset: 0 })),
  pendingComponent: OrganizationsListSkeleton,
  component: OrganizationsPage,
})
