export interface HospitalityListFilters {
  propertyId?: string | null | undefined
  search?: string | undefined
  limit?: number | undefined
  offset?: number | undefined
}

export interface HospitalityDateFilters extends HospitalityListFilters {
  dateFrom?: string | undefined
  dateTo?: string | undefined
}

export const hospitalityQueryKeys = {
  all: ["hospitality"] as const,
  roomTypes: () => [...hospitalityQueryKeys.all, "room-types"] as const,
  roomTypesList: (filters: HospitalityListFilters) =>
    [...hospitalityQueryKeys.roomTypes(), filters] as const,
  roomType: (id: string) => [...hospitalityQueryKeys.roomTypes(), id] as const,
  mealPlans: () => [...hospitalityQueryKeys.all, "meal-plans"] as const,
  mealPlansList: (filters: HospitalityListFilters) =>
    [...hospitalityQueryKeys.mealPlans(), filters] as const,
  mealPlan: (id: string) => [...hospitalityQueryKeys.mealPlans(), id] as const,
  roomUnits: () => [...hospitalityQueryKeys.all, "room-units"] as const,
  roomUnitsList: (filters: HospitalityListFilters) =>
    [...hospitalityQueryKeys.roomUnits(), filters] as const,
  roomUnit: (id: string) => [...hospitalityQueryKeys.roomUnits(), id] as const,
  maintenanceBlocks: () => [...hospitalityQueryKeys.all, "maintenance-blocks"] as const,
  maintenanceBlocksList: (filters: HospitalityListFilters) =>
    [...hospitalityQueryKeys.maintenanceBlocks(), filters] as const,
  maintenanceBlock: (id: string) => [...hospitalityQueryKeys.maintenanceBlocks(), id] as const,
  roomBlocks: () => [...hospitalityQueryKeys.all, "room-blocks"] as const,
  roomBlocksList: (filters: HospitalityListFilters) =>
    [...hospitalityQueryKeys.roomBlocks(), filters] as const,
  roomBlock: (id: string) => [...hospitalityQueryKeys.roomBlocks(), id] as const,
  roomInventory: () => [...hospitalityQueryKeys.all, "room-inventory"] as const,
  roomInventoryList: (
    filters: HospitalityDateFilters & {
      dateFrom?: string | undefined
      dateTo?: string | undefined
      roomTypeId?: string | undefined
    },
  ) => [...hospitalityQueryKeys.roomInventory(), filters] as const,
  roomInventoryItem: (id: string) => [...hospitalityQueryKeys.roomInventory(), id] as const,
  ratePlans: () => [...hospitalityQueryKeys.all, "rate-plans"] as const,
  ratePlansList: (filters: HospitalityListFilters) =>
    [...hospitalityQueryKeys.ratePlans(), filters] as const,
  ratePlan: (id: string) => [...hospitalityQueryKeys.ratePlans(), id] as const,
  ratePlanRoomTypes: () => [...hospitalityQueryKeys.all, "rate-plan-room-types"] as const,
  ratePlanRoomTypesList: (
    filters: HospitalityListFilters & {
      ratePlanId?: string | undefined
      roomTypeId?: string | undefined
      productId?: string | undefined
      active?: boolean | undefined
    },
  ) => [...hospitalityQueryKeys.ratePlanRoomTypes(), filters] as const,
  ratePlanRoomType: (id: string) => [...hospitalityQueryKeys.ratePlanRoomTypes(), id] as const,
  ratePlanInventoryOverrides: () =>
    [...hospitalityQueryKeys.all, "rate-plan-inventory-overrides"] as const,
  ratePlanInventoryOverridesList: (
    filters: HospitalityDateFilters & {
      ratePlanId?: string | undefined
      roomTypeId?: string | undefined
    },
  ) => [...hospitalityQueryKeys.ratePlanInventoryOverrides(), filters] as const,
  ratePlanInventoryOverride: (id: string) =>
    [...hospitalityQueryKeys.ratePlanInventoryOverrides(), id] as const,
  roomTypeRates: () => [...hospitalityQueryKeys.all, "room-type-rates"] as const,
  roomTypeRatesList: (
    filters: HospitalityListFilters & {
      ratePlanId?: string | undefined
      roomTypeId?: string | undefined
      priceScheduleId?: string | undefined
      active?: boolean | undefined
    },
  ) => [...hospitalityQueryKeys.roomTypeRates(), filters] as const,
  roomTypeRate: (id: string) => [...hospitalityQueryKeys.roomTypeRates(), id] as const,
  stayRules: () => [...hospitalityQueryKeys.all, "stay-rules"] as const,
  stayRulesList: (filters: HospitalityListFilters) =>
    [...hospitalityQueryKeys.stayRules(), filters] as const,
  stayRule: (id: string) => [...hospitalityQueryKeys.stayRules(), id] as const,
  stayBookingItems: () => [...hospitalityQueryKeys.all, "stay-booking-items"] as const,
  stayBookingItemsList: (
    filters: HospitalityDateFilters & {
      bookingItemId?: string | undefined
      roomTypeId?: string | undefined
      roomUnitId?: string | undefined
      ratePlanId?: string | undefined
      status?: string | undefined
    },
  ) => [...hospitalityQueryKeys.stayBookingItems(), filters] as const,
  stayBookingItem: (id: string) => [...hospitalityQueryKeys.stayBookingItems(), id] as const,
  stayOperations: () => [...hospitalityQueryKeys.all, "stay-operations"] as const,
  stayOperationsList: (
    filters: HospitalityListFilters & {
      stayBookingItemId?: string | undefined
      roomUnitId?: string | undefined
      operationStatus?: string | undefined
    },
  ) => [...hospitalityQueryKeys.stayOperations(), filters] as const,
  stayOperation: (id: string) => [...hospitalityQueryKeys.stayOperations(), id] as const,
  stayFolios: () => [...hospitalityQueryKeys.all, "stay-folios"] as const,
  stayFoliosList: (
    filters: HospitalityListFilters & {
      stayOperationId?: string | undefined
      status?: string | undefined
    },
  ) => [...hospitalityQueryKeys.stayFolios(), filters] as const,
  stayFolio: (id: string) => [...hospitalityQueryKeys.stayFolios(), id] as const,
  housekeepingTasks: () => [...hospitalityQueryKeys.all, "housekeeping-tasks"] as const,
  housekeepingTasksList: (
    filters: HospitalityListFilters & {
      roomUnitId?: string | undefined
      stayBookingItemId?: string | undefined
      status?: string | undefined
      taskType?: string | undefined
    },
  ) => [...hospitalityQueryKeys.housekeepingTasks(), filters] as const,
  housekeepingTask: (id: string) => [...hospitalityQueryKeys.housekeepingTasks(), id] as const,
}
