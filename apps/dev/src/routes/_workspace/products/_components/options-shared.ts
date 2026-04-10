import { queryOptions } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import type { ProductOptionData } from "./option-dialog"
import type { OptionPriceRuleData } from "./option-price-rule-dialog"
import type { OptionUnitData } from "./unit-dialog"
import type { OptionUnitPriceRuleData } from "./unit-price-rule-dialog"

type OptionListResponse = { data: ProductOptionData[] }
type UnitListResponse = { data: OptionUnitData[] }
type PriceRuleListResponse = { data: OptionPriceRuleData[] }
type UnitPriceRuleListResponse = { data: OptionUnitPriceRuleData[] }
type CategoryListResponse = {
  data: { id: string; name: string; code: string | null; categoryType: string }[]
}

export const optionStatusVariant: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  draft: "outline",
  active: "default",
  archived: "secondary",
}

export function getProductOptionsQueryOptions(productId: string) {
  return queryOptions({
    queryKey: ["product-options", productId],
    queryFn: () =>
      api.get<OptionListResponse>(`/v1/products/options?productId=${productId}&limit=100`),
  })
}

export function getOptionUnitsQueryOptions(optionId: string) {
  return queryOptions({
    queryKey: ["option-units", optionId],
    queryFn: () => api.get<UnitListResponse>(`/v1/products/units?optionId=${optionId}&limit=100`),
  })
}

export function getOptionPriceRulesQueryOptions(optionId: string) {
  return queryOptions({
    queryKey: ["option-price-rules", optionId],
    queryFn: () =>
      api.get<PriceRuleListResponse>(
        `/v1/pricing/option-price-rules?optionId=${optionId}&limit=100`,
      ),
  })
}

export function getPricingCategoriesQueryOptions() {
  return queryOptions({
    queryKey: ["pricing-categories-global"],
    queryFn: () => api.get<CategoryListResponse>("/v1/pricing/pricing-categories?limit=200"),
  })
}

export function getOptionUnitPriceRulesQueryOptions(optionPriceRuleId: string) {
  return queryOptions({
    queryKey: ["option-unit-price-rules", optionPriceRuleId],
    queryFn: () =>
      api.get<UnitPriceRuleListResponse>(
        `/v1/pricing/option-unit-price-rules?optionPriceRuleId=${optionPriceRuleId}&limit=200`,
      ),
  })
}
