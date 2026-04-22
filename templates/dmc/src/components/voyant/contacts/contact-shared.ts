import { queryOptions } from "@tanstack/react-query"
import { api } from "@/lib/api-client"

export type Contact = {
  id: string
  type: "individual" | "company"
  relation: "client" | "partner" | "supplier" | "other"
  companyName: string | null
  firstName: string | null
  lastName: string | null
  email: string | null
  phone: string | null
  website: string | null
  preferredLanguage: string | null
  preferredCurrency: string | null
  tags: string[]
  createdAt: string
  updatedAt: string
}

export const ADDRESS_LABELS = [
  "primary",
  "billing",
  "shipping",
  "mailing",
  "meeting",
  "service",
  "legal",
  "other",
] as const

export type AddressLabel = (typeof ADDRESS_LABELS)[number]

export type ContactAddress = {
  id: string
  label: AddressLabel
  fullText: string | null
  line1: string | null
  line2: string | null
  city: string | null
  region: string | null
  postalCode: string | null
  country: string | null
  isPrimary: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
}

export type ContactAddressUpsertInput = {
  label: AddressLabel
  fullText: string | null
  line1: string | null
  line2: string | null
  city: string | null
  region: string | null
  postalCode: string | null
  country: string | null
  isPrimary: boolean
  notes: string | null
}

export type ContactNote = {
  id: string
  contactId: string
  authorId: string
  content: string
  createdAt: string
}

export function getContactQueryOptions(id: string) {
  return queryOptions({
    queryKey: ["contact", id],
    queryFn: () => api.get<{ data: Contact }>(`/v1/contacts/${id}`),
  })
}

export function getContactNotesQueryOptions(id: string) {
  return queryOptions({
    queryKey: ["contact-notes", id],
    queryFn: () => api.get<{ data: ContactNote[] }>(`/v1/contacts/${id}/notes`),
  })
}

export function getContactAddressesQueryOptions(id: string) {
  return queryOptions({
    queryKey: ["contact-addresses", id],
    queryFn: () => api.get<{ data: ContactAddress[] }>(`/v1/crm/people/${id}/addresses`),
  })
}
