import { createFileRoute } from "@tanstack/react-router"
import {
  defaultFetcher,
  getPricingCategoriesQueryOptions,
  getPricingCategoryDependenciesQueryOptions,
} from "@voyantjs/pricing-react"

import { PricingCategoryDependencyList } from "@/components/voyant/pricing/pricing-category-dependency-list"
import { getApiUrl } from "@/lib/env"

export const Route = createFileRoute("/_workspace/settings/pricing/category-dependencies")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(
        getPricingCategoryDependenciesQueryOptions(
          { baseUrl: getApiUrl(), fetcher: defaultFetcher },
          { limit: 200 },
        ),
      ),
      context.queryClient.ensureQueryData(
        getPricingCategoriesQueryOptions(
          { baseUrl: getApiUrl(), fetcher: defaultFetcher },
          { limit: 200 },
        ),
      ),
    ]),
  component: CategoryDependenciesPage,
})

function CategoryDependenciesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Category Dependencies</h2>
        <p className="text-sm text-muted-foreground">
          Rules between pricing categories such as requires, excludes, and quantity limits.
        </p>
      </div>

      <PricingCategoryDependencyList />
    </div>
  )
}
