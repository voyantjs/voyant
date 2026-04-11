import { createFileRoute } from "@tanstack/react-router"
import { defaultFetcher, getOptionPriceRulesQueryOptions } from "@voyantjs/pricing-react"

import { OptionPriceRulesPage } from "@/components/voyant/pricing/option-price-rules-page"
import { getApiUrl } from "@/lib/env"

export const Route = createFileRoute("/_workspace/settings/pricing/option-price-rules")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(
      getOptionPriceRulesQueryOptions(
        { baseUrl: getApiUrl(), fetcher: defaultFetcher },
        { limit: 25 },
      ),
    ),
  component: OptionPriceRulesPage,
})
