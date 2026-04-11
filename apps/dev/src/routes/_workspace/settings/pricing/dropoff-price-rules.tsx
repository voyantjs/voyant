import { createFileRoute } from "@tanstack/react-router"
import { defaultFetcher, getDropoffPriceRulesQueryOptions } from "@voyantjs/pricing-react"

import { DropoffPriceRulesPage } from "@/components/voyant/pricing/dropoff-price-rules-page"
import { getApiUrl } from "@/lib/env"

export const Route = createFileRoute("/_workspace/settings/pricing/dropoff-price-rules")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(
      getDropoffPriceRulesQueryOptions(
        { baseUrl: getApiUrl(), fetcher: defaultFetcher },
        { limit: 25 },
      ),
    ),
  component: DropoffPriceRulesPage,
})
