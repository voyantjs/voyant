import { useNavigate } from "@tanstack/react-router"

import { useAdminMessages } from "@/lib/admin-i18n"
import { OrganizationList } from "./organization-list"

export function OrganizationsPage() {
  const navigate = useNavigate()
  const messages = useAdminMessages().crm.organizationsPage

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{messages.title}</h1>
        <p className="text-sm text-muted-foreground">{messages.description}</p>
      </div>

      <OrganizationList
        onSelectOrganization={(organization) => {
          void navigate({ to: "/organizations/$id", params: { id: organization.id } })
        }}
      />
    </div>
  )
}
