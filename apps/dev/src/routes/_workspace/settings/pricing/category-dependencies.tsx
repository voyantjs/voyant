import { createFileRoute } from "@tanstack/react-router"
import { defaultFetcher, getPricingCategoryDependenciesQueryOptions } from "@voyantjs/pricing-react"

import { PricingCategoryDependenciesPage } from "@/components/voyant/pricing/pricing-category-dependencies-page"
import { getApiUrl } from "@/lib/env"

export const Route = createFileRoute("/_workspace/settings/pricing/category-dependencies")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(
      getPricingCategoryDependenciesQueryOptions(
        { baseUrl: getApiUrl(), fetcher: defaultFetcher },
        { limit: 25 },
      ),
    ),
  component: PricingCategoryDependenciesPage,
})
