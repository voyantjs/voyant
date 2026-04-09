import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { defaultFetcher, getProductsQueryOptions } from "@voyantjs/products-react"

import { ProductList } from "@/components/voyant/products/product-list"
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

function ProductsPage() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Products</h1>
        <p className="text-sm text-muted-foreground">
          Manage your quotes, packages, and proposals.
        </p>
      </div>

      <ProductList
        onSelectProduct={(product) => {
          void navigate({ to: "/products/$id", params: { id: product.id } })
        }}
      />
    </div>
  )
}
