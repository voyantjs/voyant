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
  address: string | null
  city: string | null
  country: string | null
  preferredLanguage: string | null
  preferredCurrency: string | null
  tags: string[]
  createdAt: string
  updatedAt: string
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
