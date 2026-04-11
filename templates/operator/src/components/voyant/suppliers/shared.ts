import {
  defaultFetcher,
  formatAmount,
  formatUnit,
  getSupplierNotesQueryOptions as getSupplierNotesQueryOptionsBase,
  getSupplierQueryOptions as getSupplierQueryOptionsBase,
  getSupplierServiceRatesQueryOptions as getSupplierServiceRatesQueryOptionsBase,
  getSupplierServicesQueryOptions as getSupplierServicesQueryOptionsBase,
  getSuppliersQueryOptions as getSuppliersQueryOptionsBase,
  type Supplier,
  type SupplierNote,
  type SupplierRate,
  type SupplierService,
  statusVariant,
  suppliersQueryKeys,
} from "@voyantjs/suppliers-react"

const client = { baseUrl: "", fetcher: defaultFetcher }

export type { Supplier, SupplierNote, SupplierRate, SupplierService }
export { formatAmount, formatUnit, statusVariant, suppliersQueryKeys }

export function getSuppliersQueryOptions(
  options: { search?: string; limit?: number; offset?: number } = {},
) {
  return getSuppliersQueryOptionsBase(client, options)
}

export function getSupplierQueryOptions(id: string) {
  return getSupplierQueryOptionsBase(client, id)
}

export function getSupplierServicesQueryOptions(id: string) {
  return getSupplierServicesQueryOptionsBase(client, id)
}

export function getSupplierNotesQueryOptions(id: string) {
  return getSupplierNotesQueryOptionsBase(client, id)
}

export function getSupplierServiceRatesQueryOptions(supplierId: string, serviceId: string) {
  return getSupplierServiceRatesQueryOptionsBase(client, supplierId, serviceId)
}
