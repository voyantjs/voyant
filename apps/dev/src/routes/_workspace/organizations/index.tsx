import { createFileRoute } from "@tanstack/react-router"
import { defaultFetcher, getOrganizationsQueryOptions } from "@voyantjs/crm-react"
import { OrganizationsPage } from "@/components/voyant/crm/organizations-page"
import { getApiUrl } from "@/lib/env"

const routeClient = { baseUrl: getApiUrl(), fetcher: defaultFetcher }

export const Route = createFileRoute("/_workspace/organizations/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(
      getOrganizationsQueryOptions(routeClient, { limit: 25, offset: 0 }),
    ),
  component: OrganizationsPage,
})
