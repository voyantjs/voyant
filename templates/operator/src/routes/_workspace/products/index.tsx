import { createFileRoute } from "@tanstack/react-router"
import { defaultFetcher, getProductsQueryOptions } from "@voyantjs/products-react"
import { ProductsPage } from "@/components/voyant/products/products-page"
import { getApiUrl } from "@/lib/env"

export const Route = createFileRoute("/_workspace/products/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(
      getProductsQueryOptions(
        { baseUrl: getApiUrl(), fetcher: defaultFetcher },
        { limit: 25, offset: 0 },
      ),
    ),
  component: ProductsPage,
})
