import { createFileRoute } from "@tanstack/react-router"
import { defaultFetcher, getProductCategoriesQueryOptions } from "@voyantjs/products-react"

import { ProductCategoryList } from "@/components/voyant/products/product-category-list"
import { getApiUrl } from "@/lib/env"

export const Route = createFileRoute("/_workspace/products/categories")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(
      getProductCategoriesQueryOptions(
        { baseUrl: getApiUrl(), fetcher: defaultFetcher },
        { limit: 200, offset: 0 },
      ),
    ),
  component: CategoriesPage,
})

function CategoriesPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Categories</h2>
        <p className="text-sm text-muted-foreground">
          Hierarchical product categories for organizing your catalog.
        </p>
      </div>

      <ProductCategoryList />
    </div>
  )
}
