import { queryOptions } from "@tanstack/react-query"
import { api } from "@/lib/api-client"

export type Supplier = {
  id: string
  name: string
  type: "hotel" | "transfer" | "guide" | "experience" | "airline" | "restaurant" | "other"
  status: "active" | "inactive" | "pending"
  description: string | null
  email: string | null
  phone: string | null
  website: string | null
  address: string | null
  city: string | null
  country: string | null
  defaultCurrency: string | null
  contactName: string | null
  contactEmail: string | null
  contactPhone: string | null
  tags: string[]
  createdAt: string
  updatedAt: string
}

export type SupplierService = {
  id: string
  supplierId: string
  serviceType: "accommodation" | "transfer" | "experience" | "guide" | "meal" | "other"
  name: string
  description: string | null
  duration: string | null
  capacity: number | null
  active: boolean
  tags: string[]
  createdAt: string
  updatedAt: string
}

export type SupplierRate = {
  id: string
  serviceId: string
  name: string
  currency: string
  amountCents: number
  unit: "per_person" | "per_group" | "per_night" | "per_vehicle" | "flat"
  validFrom: string | null
  validTo: string | null
  minPax: number | null
  maxPax: number | null
  notes: string | null
  createdAt: string
}

export type SupplierNote = {
  id: string
  supplierId: string
  authorId: string
  content: string
  createdAt: string
}

export function getSupplierQueryOptions(id: string) {
  return queryOptions({
    queryKey: ["supplier", id],
    queryFn: () => api.get<{ data: Supplier }>(`/v1/suppliers/${id}`),
  })
}

export function getSupplierServicesQueryOptions(id: string) {
  return queryOptions({
    queryKey: ["supplier-services", id],
    queryFn: () => api.get<{ data: SupplierService[] }>(`/v1/suppliers/${id}/services`),
  })
}

export function getSupplierNotesQueryOptions(id: string) {
  return queryOptions({
    queryKey: ["supplier-notes", id],
    queryFn: () => api.get<{ data: SupplierNote[] }>(`/v1/suppliers/${id}/notes`),
  })
}

export function getSupplierServiceRatesQueryOptions(supplierId: string, serviceId: string) {
  return queryOptions({
    queryKey: ["supplier-service-rates", supplierId, serviceId],
    queryFn: () =>
      api.get<{ data: SupplierRate[] }>(`/v1/suppliers/${supplierId}/services/${serviceId}/rates`),
  })
}

export const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  active: "default",
  inactive: "secondary",
  pending: "outline",
}

export function formatAmount(cents: number, currency: string): string {
  return `${(cents / 100).toFixed(2)} ${currency}`
}

export function formatUnit(unit: string): string {
  return unit.replace(/_/g, " ")
}
