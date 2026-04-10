import { createFileRoute, useNavigate } from "@tanstack/react-router"

import { OrganizationList } from "@/components/voyant/crm/organization-list"
import { getOrganizationsQueryOptions } from "../_crm/_lib/crm-query-options"

export const Route = createFileRoute("/_workspace/organizations/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(getOrganizationsQueryOptions({ limit: 25, offset: 0 })),
  component: OrganizationsPage,
})

function OrganizationsPage() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Organizations</h1>
        <p className="text-sm text-muted-foreground">
          Companies, partners, and accounts in your CRM.
        </p>
      </div>

      <OrganizationList
        onSelectOrganization={(organization) => {
          void navigate({ to: "/organizations/$id", params: { id: organization.id } })
        }}
      />
    </div>
  )
}
