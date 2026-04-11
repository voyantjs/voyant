import { createFileRoute } from "@tanstack/react-router"
import { defaultFetcher, getPeopleQueryOptions } from "@voyantjs/crm-react"

import { PeoplePage } from "@/components/voyant/crm/people-page"
import { getApiUrl } from "@/lib/env"

const routeClient = { baseUrl: getApiUrl(), fetcher: defaultFetcher }

export const Route = createFileRoute("/_workspace/people/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(
      getPeopleQueryOptions(routeClient, { limit: 25, offset: 0 }),
    ),
  component: PeoplePage,
})
