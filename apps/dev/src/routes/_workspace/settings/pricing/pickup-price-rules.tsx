import { createFileRoute } from "@tanstack/react-router"
import { defaultFetcher, getPickupPriceRulesQueryOptions } from "@voyantjs/pricing-react"

import { PickupPriceRulesPage } from "@/components/voyant/pricing/pickup-price-rules-page"
import { getApiUrl } from "@/lib/env"

export const Route = createFileRoute("/_workspace/settings/pricing/pickup-price-rules")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(
      getPickupPriceRulesQueryOptions(
        { baseUrl: getApiUrl(), fetcher: defaultFetcher },
        { limit: 25 },
      ),
    ),
  component: PickupPriceRulesPage,
})
