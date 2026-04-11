"use client"

import { queryOptions } from "@tanstack/react-query"

import { type FetchWithValidationOptions, fetchWithValidation } from "./client.js"
import type { UseHousekeepingTasksOptions } from "./hooks/use-housekeeping-tasks.js"
import type { UseMaintenanceBlocksOptions } from "./hooks/use-maintenance-blocks.js"
import type { UseMealPlansOptions } from "./hooks/use-meal-plans.js"
import type { UseRatePlanInventoryOverridesOptions } from "./hooks/use-rate-plan-inventory-overrides.js"
import type { UseRatePlanRoomTypesOptions } from "./hooks/use-rate-plan-room-types.js"
import type { UseRatePlansOptions } from "./hooks/use-rate-plans.js"
import type { UseRoomBlocksOptions } from "./hooks/use-room-blocks.js"
import type { UseRoomInventoryOptions } from "./hooks/use-room-inventory.js"
import type { UseRoomTypeRatesOptions } from "./hooks/use-room-type-rates.js"
import type { UseRoomTypesOptions } from "./hooks/use-room-types.js"
import type { UseRoomUnitsOptions } from "./hooks/use-room-units.js"
import type { UseStayBookingItemsOptions } from "./hooks/use-stay-booking-items.js"
import type { UseStayFoliosOptions } from "./hooks/use-stay-folios.js"
import type { UseStayOperationsOptions } from "./hooks/use-stay-operations.js"
import type { UseStayRulesOptions } from "./hooks/use-stay-rules.js"
import { hospitalityQueryKeys } from "./query-keys.js"
import {
  housekeepingTaskListResponse,
  maintenanceBlockListResponse,
  mealPlanListResponse,
  mealPlanSingleResponse,
  ratePlanInventoryOverrideListResponse,
  ratePlanListResponse,
  ratePlanRoomTypeListResponse,
  ratePlanSingleResponse,
  roomBlockListResponse,
  roomInventoryListResponse,
  roomTypeListResponse,
  roomTypeRateListResponse,
  roomTypeSingleResponse,
  roomUnitListResponse,
  roomUnitSingleResponse,
  stayBookingItemListResponse,
  stayFolioListResponse,
  stayOperationListResponse,
  stayRuleListResponse,
} from "./schemas.js"

function toQueryString(filters: Record<string, string | number | boolean | null | undefined>) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === "") continue
    params.set(key, String(value))
  }
  const qs = params.toString()
  return qs ? `?${qs}` : ""
}

export function getRoomTypesQueryOptions(
  client: FetchWithValidationOptions,
  options: UseRoomTypesOptions,
) {
  const { enabled: _enabled = true, ...filters } = options

  return queryOptions({
    queryKey: hospitalityQueryKeys.roomTypesList(filters),
    queryFn: async () => {
      if (!filters.propertyId) throw new Error("getRoomTypesQueryOptions requires a propertyId")
      return fetchWithValidation(
        `/v1/hospitality/room-types${toQueryString(filters)}`,
        roomTypeListResponse,
        client,
      )
    },
  })
}

export function getRoomTypeQueryOptions(client: FetchWithValidationOptions, id: string) {
  return queryOptions({
    queryKey: hospitalityQueryKeys.roomType(id),
    queryFn: async () => {
      const { data } = await fetchWithValidation(
        `/v1/hospitality/room-types/${id}`,
        roomTypeSingleResponse,
        client,
      )
      return data
    },
  })
}

export function getMealPlansQueryOptions(
  client: FetchWithValidationOptions,
  options: UseMealPlansOptions,
) {
  const { enabled: _enabled = true, ...filters } = options

  return queryOptions({
    queryKey: hospitalityQueryKeys.mealPlansList(filters),
    queryFn: async () => {
      if (!filters.propertyId) throw new Error("getMealPlansQueryOptions requires a propertyId")
      return fetchWithValidation(
        `/v1/hospitality/meal-plans${toQueryString(filters)}`,
        mealPlanListResponse,
        client,
      )
    },
  })
}

export function getMealPlanQueryOptions(client: FetchWithValidationOptions, id: string) {
  return queryOptions({
    queryKey: hospitalityQueryKeys.mealPlan(id),
    queryFn: async () => {
      const { data } = await fetchWithValidation(
        `/v1/hospitality/meal-plans/${id}`,
        mealPlanSingleResponse,
        client,
      )
      return data
    },
  })
}

export function getRoomUnitsQueryOptions(
  client: FetchWithValidationOptions,
  options: UseRoomUnitsOptions,
) {
  const { enabled: _enabled = true, ...filters } = options

  return queryOptions({
    queryKey: hospitalityQueryKeys.roomUnitsList(filters),
    queryFn: async () => {
      if (!filters.propertyId) throw new Error("getRoomUnitsQueryOptions requires a propertyId")
      return fetchWithValidation(
        `/v1/hospitality/room-units${toQueryString(filters)}`,
        roomUnitListResponse,
        client,
      )
    },
  })
}

export function getRoomUnitQueryOptions(client: FetchWithValidationOptions, id: string) {
  return queryOptions({
    queryKey: hospitalityQueryKeys.roomUnit(id),
    queryFn: async () => {
      const { data } = await fetchWithValidation(
        `/v1/hospitality/room-units/${id}`,
        roomUnitSingleResponse,
        client,
      )
      return data
    },
  })
}

export function getMaintenanceBlocksQueryOptions(
  client: FetchWithValidationOptions,
  options: UseMaintenanceBlocksOptions,
) {
  const { enabled: _enabled = true, ...filters } = options

  return queryOptions({
    queryKey: hospitalityQueryKeys.maintenanceBlocksList(filters),
    queryFn: async () => {
      if (!filters.propertyId) {
        throw new Error("getMaintenanceBlocksQueryOptions requires a propertyId")
      }
      return fetchWithValidation(
        `/v1/hospitality/maintenance-blocks${toQueryString(filters)}`,
        maintenanceBlockListResponse,
        client,
      )
    },
  })
}

export function getRoomBlocksQueryOptions(
  client: FetchWithValidationOptions,
  options: UseRoomBlocksOptions,
) {
  const { enabled: _enabled = true, ...filters } = options

  return queryOptions({
    queryKey: hospitalityQueryKeys.roomBlocksList(filters),
    queryFn: async () => {
      if (!filters.propertyId) throw new Error("getRoomBlocksQueryOptions requires a propertyId")
      return fetchWithValidation(
        `/v1/hospitality/room-blocks${toQueryString(filters)}`,
        roomBlockListResponse,
        client,
      )
    },
  })
}

export function getRoomInventoryQueryOptions(
  client: FetchWithValidationOptions,
  options: UseRoomInventoryOptions,
) {
  const { enabled: _enabled = true, ...filters } = options

  return queryOptions({
    queryKey: hospitalityQueryKeys.roomInventoryList(filters),
    queryFn: async () => {
      if (!filters.propertyId) throw new Error("getRoomInventoryQueryOptions requires a propertyId")
      return fetchWithValidation(
        `/v1/hospitality/room-inventory${toQueryString(filters)}`,
        roomInventoryListResponse,
        client,
      )
    },
  })
}

export function getRatePlansQueryOptions(
  client: FetchWithValidationOptions,
  options: UseRatePlansOptions,
) {
  const { enabled: _enabled = true, ...filters } = options

  return queryOptions({
    queryKey: hospitalityQueryKeys.ratePlansList(filters),
    queryFn: async () => {
      if (!filters.propertyId) throw new Error("getRatePlansQueryOptions requires a propertyId")
      return fetchWithValidation(
        `/v1/hospitality/rate-plans${toQueryString(filters)}`,
        ratePlanListResponse,
        client,
      )
    },
  })
}

export function getRatePlanQueryOptions(client: FetchWithValidationOptions, id: string) {
  return queryOptions({
    queryKey: hospitalityQueryKeys.ratePlan(id),
    queryFn: async () => {
      const { data } = await fetchWithValidation(
        `/v1/hospitality/rate-plans/${id}`,
        ratePlanSingleResponse,
        client,
      )
      return data
    },
  })
}

export function getRatePlanRoomTypesQueryOptions(
  client: FetchWithValidationOptions,
  options: UseRatePlanRoomTypesOptions,
) {
  const { enabled: _enabled = true, ...filters } = options

  return queryOptions({
    queryKey: hospitalityQueryKeys.ratePlanRoomTypesList(filters),
    queryFn: async () =>
      fetchWithValidation(
        `/v1/hospitality/rate-plan-room-types${toQueryString(filters)}`,
        ratePlanRoomTypeListResponse,
        client,
      ),
  })
}

export function getRatePlanInventoryOverridesQueryOptions(
  client: FetchWithValidationOptions,
  options: UseRatePlanInventoryOverridesOptions,
) {
  const { enabled: _enabled = true, ...filters } = options

  return queryOptions({
    queryKey: hospitalityQueryKeys.ratePlanInventoryOverridesList(filters),
    queryFn: async () =>
      fetchWithValidation(
        `/v1/hospitality/rate-plan-inventory-overrides${toQueryString(filters)}`,
        ratePlanInventoryOverrideListResponse,
        client,
      ),
  })
}

export function getRoomTypeRatesQueryOptions(
  client: FetchWithValidationOptions,
  options: UseRoomTypeRatesOptions,
) {
  const { enabled: _enabled = true, ...filters } = options

  return queryOptions({
    queryKey: hospitalityQueryKeys.roomTypeRatesList(filters),
    queryFn: async () =>
      fetchWithValidation(
        `/v1/hospitality/room-type-rates${toQueryString(filters)}`,
        roomTypeRateListResponse,
        client,
      ),
  })
}

export function getStayRulesQueryOptions(
  client: FetchWithValidationOptions,
  options: UseStayRulesOptions,
) {
  const { enabled: _enabled = true, ...filters } = options

  return queryOptions({
    queryKey: hospitalityQueryKeys.stayRulesList(filters),
    queryFn: async () => {
      if (!filters.propertyId) throw new Error("getStayRulesQueryOptions requires a propertyId")
      return fetchWithValidation(
        `/v1/hospitality/stay-rules${toQueryString(filters)}`,
        stayRuleListResponse,
        client,
      )
    },
  })
}

export function getStayBookingItemsQueryOptions(
  client: FetchWithValidationOptions,
  options: UseStayBookingItemsOptions,
) {
  const { enabled: _enabled = true, ...filters } = options

  return queryOptions({
    queryKey: hospitalityQueryKeys.stayBookingItemsList(filters),
    queryFn: async () =>
      fetchWithValidation(
        `/v1/hospitality/stay-booking-items${toQueryString(filters)}`,
        stayBookingItemListResponse,
        client,
      ),
  })
}

export function getStayOperationsQueryOptions(
  client: FetchWithValidationOptions,
  options: UseStayOperationsOptions,
) {
  const { enabled: _enabled = true, ...filters } = options

  return queryOptions({
    queryKey: hospitalityQueryKeys.stayOperationsList(filters),
    queryFn: async () =>
      fetchWithValidation(
        `/v1/hospitality/stay-operations${toQueryString(filters)}`,
        stayOperationListResponse,
        client,
      ),
  })
}

export function getStayFoliosQueryOptions(
  client: FetchWithValidationOptions,
  options: UseStayFoliosOptions,
) {
  const { enabled: _enabled = true, ...filters } = options

  return queryOptions({
    queryKey: hospitalityQueryKeys.stayFoliosList(filters),
    queryFn: async () =>
      fetchWithValidation(
        `/v1/hospitality/stay-folios${toQueryString(filters)}`,
        stayFolioListResponse,
        client,
      ),
  })
}

export function getHousekeepingTasksQueryOptions(
  client: FetchWithValidationOptions,
  options: UseHousekeepingTasksOptions,
) {
  const { enabled: _enabled = true, ...filters } = options

  return queryOptions({
    queryKey: hospitalityQueryKeys.housekeepingTasksList(filters),
    queryFn: async () =>
      fetchWithValidation(
        `/v1/hospitality/housekeeping-tasks${toQueryString(filters)}`,
        housekeepingTaskListResponse,
        client,
      ),
  })
}
