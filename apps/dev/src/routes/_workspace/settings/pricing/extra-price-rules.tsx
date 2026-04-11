import { createFileRoute } from "@tanstack/react-router"
import { defaultFetcher, getExtraPriceRulesQueryOptions } from "@voyantjs/pricing-react"

import { ExtraPriceRulesPage } from "@/components/voyant/pricing/extra-price-rules-page"
import { getApiUrl } from "@/lib/env"

export const Route = createFileRoute("/_workspace/settings/pricing/extra-price-rules")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(
      getExtraPriceRulesQueryOptions(
        { baseUrl: getApiUrl(), fetcher: defaultFetcher },
        { limit: 25 },
      ),
    ),
  component: ExtraPriceRulesPage,
})
