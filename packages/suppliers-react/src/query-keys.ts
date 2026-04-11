export interface PaginationFilters {
  limit?: number | undefined
  offset?: number | undefined
}

export interface SuppliersListFilters extends PaginationFilters {
  search?: string | undefined
}

export const suppliersQueryKeys = {
  all: ["voyant", "suppliers"] as const,

  suppliers: () => [...suppliersQueryKeys.all, "suppliers"] as const,
  suppliersList: (filters: SuppliersListFilters) =>
    [...suppliersQueryKeys.suppliers(), "list", filters] as const,
  supplierDetail: (id: string) => [...suppliersQueryKeys.suppliers(), "detail", id] as const,

  services: () => [...suppliersQueryKeys.all, "services"] as const,
  supplierServices: (supplierId: string) =>
    [...suppliersQueryKeys.services(), "list", supplierId] as const,

  notes: () => [...suppliersQueryKeys.all, "notes"] as const,
  supplierNotes: (supplierId: string) =>
    [...suppliersQueryKeys.notes(), "list", supplierId] as const,

  rates: () => [...suppliersQueryKeys.all, "rates"] as const,
  supplierServiceRates: (supplierId: string, serviceId: string) =>
    [...suppliersQueryKeys.rates(), "list", supplierId, serviceId] as const,
} as const
