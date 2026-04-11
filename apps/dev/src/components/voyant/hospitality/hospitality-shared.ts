import { getApiListQueryOptions } from "@/lib/api-query-options"

export type HospitalityPropertyLite = {
  id: string
  facilityId: string
  brandName: string | null
  groupName: string | null
}

export type HospitalityFacilityLite = {
  id: string
  name: string
}

export function getHospitalityPropertiesQueryOptions() {
  return getApiListQueryOptions<HospitalityPropertyLite>(
    ["hospitality", "properties"],
    "/v1/facilities/properties?limit=25",
  )
}

export function getHospitalityFacilitiesQueryOptions() {
  return getApiListQueryOptions<HospitalityFacilityLite>(
    ["hospitality", "facilities"],
    "/v1/facilities/facilities?limit=25",
  )
}
