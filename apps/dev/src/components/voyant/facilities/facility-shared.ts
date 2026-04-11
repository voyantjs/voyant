import {
  defaultFetcher,
  type FacilitiesListFilters,
  type FacilityRecord,
  getFacilitiesQueryOptions as getFacilitiesQueryOptionsBase,
  getFacilityQueryOptions as getFacilityQueryOptionsBase,
} from "@voyantjs/facilities-react"
import { getApiUrl } from "@/lib/env"

export const FACILITY_KINDS = [
  "property",
  "hotel",
  "resort",
  "venue",
  "meeting_point",
  "transfer_hub",
  "airport",
  "station",
  "marina",
  "camp",
  "lodge",
  "office",
  "attraction",
  "restaurant",
  "other",
] as const

export const FACILITY_STATUSES = ["active", "inactive", "archived"] as const

export type FacilityData = FacilityRecord

export function getFacilitiesQueryOptions(filters: FacilitiesListFilters = {}) {
  return getFacilitiesQueryOptionsBase({ baseUrl: getApiUrl(), fetcher: defaultFetcher }, filters)
}

export function getFacilityQueryOptions(id: string) {
  return getFacilityQueryOptionsBase({ baseUrl: getApiUrl(), fetcher: defaultFetcher }, id)
}
