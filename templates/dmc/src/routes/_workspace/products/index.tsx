import { createFileRoute } from "@tanstack/react-router"
import {
  getProductsListQueryOptions,
  ProductsPage,
} from "@/components/voyant/products/products-page"

export const Route = createFileRoute("/_workspace/products/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(getProductsListQueryOptions()),
  component: ProductsPage,
})
