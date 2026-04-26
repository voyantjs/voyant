import { useMutation, useQueryClient } from "@tanstack/react-query"

import { fetchWithValidation } from "../client.js"
import { useVoyantCruisesContext } from "../provider.js"
import { cruisesQueryKeys } from "../query-keys.js"
import {
  type EffectiveItineraryDay,
  effectiveItineraryResponse,
  listEnvelope,
  type PriceRecord,
  priceRecordSchema,
  type SailingRecord,
  sailingSingleResponse,
} from "../schemas.js"

export interface UpsertSailingInput {
  cruiseId: string
  shipId: string
  departureDate: string
  returnDate: string
  embarkPortFacilityId?: string | null
  disembarkPortFacilityId?: string | null
  direction?: "upstream" | "downstream" | "round_trip" | "one_way" | null
  availabilityNote?: string | null
  isCharter?: boolean
  salesStatus?: "open" | "on_request" | "wait_list" | "sold_out" | "closed"
  externalRefs?: Record<string, string>
}

export type UpdateSailingInput = Partial<UpsertSailingInput>

export interface ReplaceSailingDaysInput {
  days: Array<{
    dayNumber: number
    title?: string | null
    description?: string | null
    portFacilityId?: string | null
    arrivalTime?: string | null
    departureTime?: string | null
    isOvernight?: boolean | null
    isSeaDay?: boolean | null
    isExpeditionLanding?: boolean | null
    isSkipped?: boolean
    meals?: { breakfast?: boolean; lunch?: boolean; dinner?: boolean } | null
  }>
}

export interface ReplaceSailingPricingInput {
  prices: Array<{
    cabinCategoryId: string
    occupancy: number
    fareCode?: string | null
    fareCodeName?: string | null
    currency: string
    pricePerPerson: string
    secondGuestPricePerPerson?: string | null
    singleSupplementPercent?: string | null
    availability?: "available" | "limited" | "on_request" | "wait_list" | "sold_out"
    availabilityCount?: number | null
    priceCatalogId?: string | null
    priceScheduleId?: string | null
    bookingDeadline?: string | null
    requiresRequest?: boolean
    notes?: string | null
    components?: Array<{
      kind:
        | "gratuity"
        | "onboard_credit"
        | "port_charge"
        | "tax"
        | "ncf"
        | "airfare"
        | "transfer"
        | "insurance"
      label?: string | null
      amount: string
      currency: string
      direction: "addition" | "inclusion" | "credit"
      perPerson: boolean
    }>
  }>
}

const priceListWrapped = listEnvelope(priceRecordSchema)

export function useSailingMutation() {
  const { baseUrl, fetcher } = useVoyantCruisesContext()
  const client = { baseUrl, fetcher }
  const queryClient = useQueryClient()

  const upsert = useMutation({
    mutationFn: async (input: UpsertSailingInput): Promise<SailingRecord> => {
      const result = await fetchWithValidation(
        "/v1/admin/cruises/sailings",
        sailingSingleResponse,
        client,
        { method: "POST", body: JSON.stringify(input) },
      )
      return result.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: cruisesQueryKeys.sailings() })
      void queryClient.invalidateQueries({ queryKey: cruisesQueryKeys.cruises() })
    },
  })

  const update = useMutation({
    mutationFn: async ({
      key,
      input,
    }: {
      key: string
      input: UpdateSailingInput
    }): Promise<SailingRecord> => {
      const result = await fetchWithValidation(
        `/v1/admin/cruises/sailings/${encodeURIComponent(key)}`,
        sailingSingleResponse,
        client,
        { method: "PUT", body: JSON.stringify(input) },
      )
      return result.data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: cruisesQueryKeys.sailings() })
      queryClient.setQueryData(cruisesQueryKeys.sailing(data.id), data)
    },
  })

  const replaceDays = useMutation({
    mutationFn: async ({
      key,
      input,
    }: {
      key: string
      input: ReplaceSailingDaysInput
    }): Promise<EffectiveItineraryDay[]> => {
      const result = await fetchWithValidation(
        `/v1/admin/cruises/sailings/${encodeURIComponent(key)}/days/bulk`,
        effectiveItineraryResponse,
        client,
        { method: "PUT", body: JSON.stringify(input) },
      )
      return result.data
    },
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({
        queryKey: cruisesQueryKeys.sailingItinerary(vars.key),
      })
      void queryClient.invalidateQueries({ queryKey: cruisesQueryKeys.sailings() })
    },
  })

  const replacePricing = useMutation({
    mutationFn: async ({
      key,
      input,
    }: {
      key: string
      input: ReplaceSailingPricingInput
    }): Promise<PriceRecord[]> => {
      const result = await fetchWithValidation(
        `/v1/admin/cruises/sailings/${encodeURIComponent(key)}/pricing/bulk`,
        priceListWrapped,
        client,
        { method: "PUT", body: JSON.stringify(input) },
      )
      return result.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: cruisesQueryKeys.prices() })
      void queryClient.invalidateQueries({ queryKey: cruisesQueryKeys.sailings() })
      void queryClient.invalidateQueries({ queryKey: cruisesQueryKeys.cruises() })
    },
  })

  return { upsert, update, replaceDays, replacePricing }
}
