export interface ProductsListFilters {
  status?: string | undefined
  bookingMode?: string | undefined
  visibility?: string | undefined
  activated?: boolean | undefined
  facilityId?: string | undefined
  search?: string | undefined
  limit?: number | undefined
  offset?: number | undefined
}

export interface ProductTypesListFilters {
  active?: boolean | undefined
  search?: string | undefined
  limit?: number | undefined
  offset?: number | undefined
}

export const productsQueryKeys = {
  all: ["voyant", "products"] as const,

  products: () => [...productsQueryKeys.all, "products"] as const,
  productsList: (filters: ProductsListFilters) =>
    [...productsQueryKeys.products(), "list", filters] as const,
  product: (id: string) => [...productsQueryKeys.products(), "detail", id] as const,

  productTypes: () => [...productsQueryKeys.all, "product-types"] as const,
  productTypesList: (filters: ProductTypesListFilters) =>
    [...productsQueryKeys.productTypes(), "list", filters] as const,
  productType: (id: string) => [...productsQueryKeys.productTypes(), "detail", id] as const,
} as const
