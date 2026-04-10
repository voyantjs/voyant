import { createFileRoute } from "@tanstack/react-router"
import { defaultFetcher, getProductTagsQueryOptions } from "@voyantjs/products-react"

import { ProductTagList } from "@/components/voyant/products/product-tag-list"
import { getApiUrl } from "@/lib/env"

export const Route = createFileRoute("/_workspace/settings/product-tags")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(
      getProductTagsQueryOptions(
        { baseUrl: getApiUrl(), fetcher: defaultFetcher },
        { limit: 200, offset: 0 },
      ),
    ),
  component: ProductTagsPage,
})

function ProductTagsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Product Tags</h2>
        <p className="text-sm text-muted-foreground">
          Free-form labels to tag and filter products.
        </p>
      </div>

      <ProductTagList />
    </div>
  )
}
