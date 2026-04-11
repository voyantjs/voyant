import {
  type AddressesListFilters,
  type AddressRecord,
  type ContactPointRecord,
  type ContactPointsListFilters,
  defaultFetcher,
  getAddressesQueryOptions as getAddressesQueryOptionsBase,
  getContactPointsQueryOptions as getContactPointsQueryOptionsBase,
  getNamedContactsQueryOptions as getNamedContactsQueryOptionsBase,
  type NamedContactRecord,
  type NamedContactsListFilters,
} from "@voyantjs/identity-react"
import { getApiUrl } from "@/lib/env"

export type AddressData = AddressRecord
export type ContactPointData = ContactPointRecord
export type NamedContactData = NamedContactRecord

export const CONTACT_POINT_KINDS = [
  "email",
  "phone",
  "mobile",
  "whatsapp",
  "website",
  "sms",
  "fax",
  "social",
  "other",
] as const

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

export const NAMED_CONTACT_ROLES = [
  "general",
  "primary",
  "reservations",
  "operations",
  "front_desk",
  "sales",
  "emergency",
  "accounting",
  "legal",
  "other",
] as const

export function getContactPointsQueryOptions(filters: ContactPointsListFilters = {}) {
  return getContactPointsQueryOptionsBase(
    { baseUrl: getApiUrl(), fetcher: defaultFetcher },
    filters,
  )
}

export function getAddressesQueryOptions(filters: AddressesListFilters = {}) {
  return getAddressesQueryOptionsBase({ baseUrl: getApiUrl(), fetcher: defaultFetcher }, filters)
}

export function getNamedContactsQueryOptions(filters: NamedContactsListFilters = {}) {
  return getNamedContactsQueryOptionsBase(
    { baseUrl: getApiUrl(), fetcher: defaultFetcher },
    filters,
  )
}
