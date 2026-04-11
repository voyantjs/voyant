import {
  defaultFetcher,
  type GroundDriverRecord,
  type GroundDriversListFilters,
  type GroundOperatorRecord,
  type GroundOperatorsListFilters,
  type GroundVehicleRecord,
  type GroundVehiclesListFilters,
  getGroundDriversQueryOptions as getGroundDriversQueryOptionsBase,
  getGroundOperatorsQueryOptions as getGroundOperatorsQueryOptionsBase,
  getGroundVehiclesQueryOptions as getGroundVehiclesQueryOptionsBase,
} from "@voyantjs/ground-react"
import { getApiUrl } from "@/lib/env"

export type OperatorData = GroundOperatorRecord
export type VehicleData = GroundVehicleRecord
export type DriverData = GroundDriverRecord

export const GROUND_VEHICLE_CATEGORIES = [
  "car",
  "sedan",
  "suv",
  "van",
  "minibus",
  "bus",
  "boat",
  "train",
  "other",
] as const

export const GROUND_VEHICLE_CLASSES = [
  "economy",
  "standard",
  "premium",
  "luxury",
  "accessible",
  "other",
] as const

export function getGroundOperatorsQueryOptions(filters: GroundOperatorsListFilters = {}) {
  return getGroundOperatorsQueryOptionsBase(
    { baseUrl: getApiUrl(), fetcher: defaultFetcher },
    filters,
  )
}

export function getGroundVehiclesQueryOptions(filters: GroundVehiclesListFilters = {}) {
  return getGroundVehiclesQueryOptionsBase(
    { baseUrl: getApiUrl(), fetcher: defaultFetcher },
    filters,
  )
}

export function getGroundDriversQueryOptions(filters: GroundDriversListFilters = {}) {
  return getGroundDriversQueryOptionsBase(
    { baseUrl: getApiUrl(), fetcher: defaultFetcher },
    filters,
  )
}
