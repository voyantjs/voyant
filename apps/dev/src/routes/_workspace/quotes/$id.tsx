import { createFileRoute } from "@tanstack/react-router"
import {
  defaultFetcher,
  getOpportunityQueryOptions,
  getQuoteLinesQueryOptions,
  getQuoteQueryOptions,
} from "@voyantjs/crm-react"
import { QuoteDetailPage } from "@/components/voyant/crm/quote-detail-page"
import { getApiUrl } from "@/lib/env"

const routeClient = { baseUrl: getApiUrl(), fetcher: defaultFetcher }

export const Route = createFileRoute("/_workspace/quotes/$id")({
  loader: async ({ context, params }) => {
    const quote = await context.queryClient.ensureQueryData(
      getQuoteQueryOptions(routeClient, params.id),
    )

    await Promise.all([
      context.queryClient.ensureQueryData(getQuoteLinesQueryOptions(routeClient, params.id)),
      quote.opportunityId
        ? context.queryClient.ensureQueryData(
            getOpportunityQueryOptions(routeClient, quote.opportunityId),
          )
        : Promise.resolve(),
    ])
  },
  component: QuoteDetailRoute,
})

function QuoteDetailRoute() {
  const { id } = Route.useParams()
  return <QuoteDetailPage id={id} />
}
