import { createFileRoute } from "@tanstack/react-router"
import { defaultFetcher, getProductQueryOptions } from "@voyantjs/products-react"
import { ProductDetailPage } from "@/components/voyant/products/product-detail-page"
import {
  getProductDayServicesQueryOptions,
  getProductDaysQueryOptions,
  getProductNotesQueryOptions,
  getProductRulesQueryOptions,
  getProductSlotsQueryOptions,
  getProductVersionsQueryOptions,
} from "@/components/voyant/products/product-detail-shared"
import {
  getOptionPriceRulesQueryOptions,
  getOptionUnitPriceRulesQueryOptions,
  getOptionUnitsQueryOptions,
  getPricingCategoriesQueryOptions,
  getProductOptionsQueryOptions,
} from "@/components/voyant/products/product-options-shared"
import { getApiUrl } from "@/lib/env"

export const Route = createFileRoute("/_workspace/products/$id")({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      getProductQueryOptions({ baseUrl: getApiUrl(), fetcher: defaultFetcher }, params.id),
    )

    const daysData = await context.queryClient.ensureQueryData(
      getProductDaysQueryOptions(params.id),
    )

    const productOptionsData = await context.queryClient.ensureQueryData(
      getProductOptionsQueryOptions(params.id),
    )

    await Promise.all([
      context.queryClient.ensureQueryData(getProductVersionsQueryOptions(params.id)),
      context.queryClient.ensureQueryData(getProductNotesQueryOptions(params.id)),
      context.queryClient.ensureQueryData(getProductSlotsQueryOptions(params.id)),
      context.queryClient.ensureQueryData(getProductRulesQueryOptions(params.id)),
      context.queryClient.ensureQueryData(getPricingCategoriesQueryOptions()),
      ...daysData.data.map((day) =>
        context.queryClient.ensureQueryData(getProductDayServicesQueryOptions(params.id, day.id)),
      ),
      ...productOptionsData.data.flatMap((option) => [
        context.queryClient.ensureQueryData(getOptionUnitsQueryOptions(option.id)),
        context.queryClient.ensureQueryData(getOptionPriceRulesQueryOptions(option.id)),
      ]),
    ])

    const optionPriceRules = await Promise.all(
      productOptionsData.data.map((option) =>
        context.queryClient.ensureQueryData(getOptionPriceRulesQueryOptions(option.id)),
      ),
    )

    await Promise.all(
      optionPriceRules.flatMap((priceRulesData) =>
        priceRulesData.data.map((rule) =>
          context.queryClient.ensureQueryData(getOptionUnitPriceRulesQueryOptions(rule.id)),
        ),
      ),
    )
  },
  component: ProductDetailRoute,
})

function ProductDetailRoute() {
  const { id } = Route.useParams()
  return <ProductDetailPage id={id} />
}
