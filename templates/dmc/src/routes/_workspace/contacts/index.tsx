import { createFileRoute } from "@tanstack/react-router"
import { defaultFetcher, getPeopleQueryOptions } from "@voyantjs/crm-react"

import { ContactsPage } from "@/components/voyant/contacts/contacts-page"
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
