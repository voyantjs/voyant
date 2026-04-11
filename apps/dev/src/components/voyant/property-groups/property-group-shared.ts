import {
  defaultFetcher,
  getPropertyGroupQueryOptions as getPropertyGroupQueryOptionsBase,
  getPropertyGroupsQueryOptions as getPropertyGroupsQueryOptionsBase,
  type PropertyGroupRecord,
  type PropertyGroupsListFilters,
} from "@voyantjs/facilities-react"
import { getApiUrl } from "@/lib/env"

export const PROPERTY_GROUP_TYPES = [
  "chain",
  "brand",
  "management_company",
  "collection",
  "portfolio",
  "cluster",
  "other",
] as const

export const PROPERTY_GROUP_STATUSES = ["active", "inactive", "archived"] as const

export type PropertyGroupData = PropertyGroupRecord

export function getPropertyGroupsQueryOptions(filters: PropertyGroupsListFilters = {}) {
  return getPropertyGroupsQueryOptionsBase(
    { baseUrl: getApiUrl(), fetcher: defaultFetcher },
    filters,
  )
}

export function getPropertyGroupQueryOptions(id: string) {
  return getPropertyGroupQueryOptionsBase({ baseUrl: getApiUrl(), fetcher: defaultFetcher }, id)
}
