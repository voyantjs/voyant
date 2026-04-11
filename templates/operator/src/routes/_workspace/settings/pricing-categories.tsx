import { createFileRoute } from "@tanstack/react-router"
import { defaultFetcher, getPricingCategoriesQueryOptions } from "@voyantjs/pricing-react"

import { PricingCategoriesPage } from "@/components/voyant/settings/pricing-categories-page"
import { getApiUrl } from "@/lib/env"

export const Route = createFileRoute("/_workspace/settings/pricing-categories")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(
      getPricingCategoriesQueryOptions(
        { baseUrl: getApiUrl(), fetcher: defaultFetcher },
        { limit: 25, active: undefined },
      ),
    ),
  component: PricingCategoriesPage,
})
