import { createFileRoute } from "@tanstack/react-router"
import { defaultFetcher, getOptionUnitPriceRulesQueryOptions } from "@voyantjs/pricing-react"

import { OptionUnitPriceRulesPage } from "@/components/voyant/pricing/option-unit-price-rules-page"
import { getApiUrl } from "@/lib/env"

export const Route = createFileRoute("/_workspace/settings/pricing/option-unit-price-rules")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(
      getOptionUnitPriceRulesQueryOptions(
        { baseUrl: getApiUrl(), fetcher: defaultFetcher },
        { limit: 25 },
      ),
    ),
  component: OptionUnitPriceRulesPage,
})
