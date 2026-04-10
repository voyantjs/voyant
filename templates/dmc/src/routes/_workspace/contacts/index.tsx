import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { defaultFetcher, getPeopleQueryOptions } from "@voyantjs/crm-react"

import { PersonList } from "@/components/voyant/crm/person-list"
import { getApiUrl } from "@/lib/env"

export const Route = createFileRoute("/_workspace/contacts/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(
      getPeopleQueryOptions(
        { baseUrl: getApiUrl(), fetcher: defaultFetcher },
        { limit: 25, offset: 0 },
      ),
    ),
  component: ContactsPage,
})

function ContactsPage() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Contacts</h1>
        <p className="text-sm text-muted-foreground">
          Manage your clients, partners, and suppliers.
        </p>
      </div>

      <PersonList
        onSelectPerson={(person) => {
          void navigate({ to: "/contacts/$id", params: { id: person.id } })
        }}
      />
    </div>
  )
}
