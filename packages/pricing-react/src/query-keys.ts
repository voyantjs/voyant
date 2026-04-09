export interface PricingCategoriesListFilters {
  productId?: string | undefined
  optionId?: string | undefined
  unitId?: string | undefined
  categoryType?: string | undefined
  active?: boolean | undefined
  limit?: number | undefined
  offset?: number | undefined
}

export interface PricingCategoryDependenciesListFilters {
  pricingCategoryId?: string | undefined
  masterPricingCategoryId?: string | undefined
  dependencyType?: string | undefined
  active?: boolean | undefined
  limit?: number | undefined
  offset?: number | undefined
}

export const pricingQueryKeys = {
  all: ["voyant", "pricing"] as const,

  pricingCategories: () => [...pricingQueryKeys.all, "pricing-categories"] as const,
  pricingCategoriesList: (filters: PricingCategoriesListFilters) =>
    [...pricingQueryKeys.pricingCategories(), "list", filters] as const,
  pricingCategory: (id: string) => [...pricingQueryKeys.pricingCategories(), "detail", id] as const,

  pricingCategoryDependencies: () =>
    [...pricingQueryKeys.all, "pricing-category-dependencies"] as const,
  pricingCategoryDependenciesList: (filters: PricingCategoryDependenciesListFilters) =>
    [...pricingQueryKeys.pricingCategoryDependencies(), "list", filters] as const,
  pricingCategoryDependency: (id: string) =>
    [...pricingQueryKeys.pricingCategoryDependencies(), "detail", id] as const,
} as const
