import { createFileRoute } from "@tanstack/react-router"
import { ProductDetailPage } from "@/components/voyant/products/product-detail-page"
import {
  getProductDayServicesQueryOptions,
  getProductDaysQueryOptions,
  getProductNotesQueryOptions,
  getProductQueryOptions,
  getProductVersionsQueryOptions,
} from "@/components/voyant/products/product-detail-shared"

export const Route = createFileRoute("/_workspace/products/$id")({
  loader: async ({ context, params }) => {
    const daysData = await context.queryClient.ensureQueryData(
      getProductDaysQueryOptions(params.id),
    )

    await Promise.all([
      context.queryClient.ensureQueryData(getProductQueryOptions(params.id)),
      context.queryClient.ensureQueryData(getProductVersionsQueryOptions(params.id)),
      context.queryClient.ensureQueryData(getProductNotesQueryOptions(params.id)),
      ...daysData.data.map((day) =>
        context.queryClient.ensureQueryData(getProductDayServicesQueryOptions(params.id, day.id)),
      ),
    ])
  },
  component: ProductDetailRoute,
})

function ProductDetailRoute() {
  const { id } = Route.useParams()
  return <ProductDetailPage id={id} />
}
