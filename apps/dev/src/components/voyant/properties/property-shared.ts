import {
  defaultFetcher,
  getPropertiesQueryOptions as getPropertiesQueryOptionsBase,
  getPropertyQueryOptions as getPropertyQueryOptionsBase,
  type PropertiesListFilters,
  type PropertyRecord,
} from "@voyantjs/facilities-react"
import { getFacilityQueryOptions } from "@/components/voyant/facilities/facility-shared"
import { getApiUrl } from "@/lib/env"

export const PROPERTY_TYPES = [
  "hotel",
  "resort",
  "villa",
  "apartment",
  "hostel",
  "lodge",
  "camp",
  "other",
] as const

export type PropertyData = PropertyRecord

export function getPropertiesQueryOptions(filters: PropertiesListFilters = {}) {
  return getPropertiesQueryOptionsBase({ baseUrl: getApiUrl(), fetcher: defaultFetcher }, filters)
}

export function getPropertyQueryOptions(id: string) {
  return getPropertyQueryOptionsBase({ baseUrl: getApiUrl(), fetcher: defaultFetcher }, id)
}

export { getFacilityQueryOptions }
