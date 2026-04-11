import { createFileRoute } from "@tanstack/react-router"
import { defaultFetcher, getQuotesQueryOptions } from "@voyantjs/crm-react"
import { QuotesPage } from "@/components/voyant/crm/quotes-page"
import { getApiUrl } from "@/lib/env"

const routeClient = { baseUrl: getApiUrl(), fetcher: defaultFetcher }

export const Route = createFileRoute("/_workspace/quotes/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(getQuotesQueryOptions(routeClient, { limit: 100 })),
  component: QuotesPage,
})
