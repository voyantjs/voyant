import { useMutation, useQueryClient } from "@tanstack/react-query"

import { fetchWithValidation } from "../client.js"
import { useVoyantCruisesContext } from "../provider.js"
import { cruisesQueryKeys } from "../query-keys.js"
import {
  type CabinCategoryRecord,
  type CabinRecord,
  cabinCategoryListResponse,
  cabinCategorySingleResponse,
  cabinListResponse,
  cabinSingleResponse,
  type DeckRecord,
  deckSingleResponse,
  type ShipRecord,
  shipSingleResponse,
} from "../schemas.js"

export interface CreateShipInput {
  name: string
  slug: string
  shipType: "ocean" | "river" | "expedition" | "yacht" | "sailing" | "coastal"
  lineSupplierId?: string | null
  capacityGuests?: number | null
  capacityCrew?: number | null
  cabinCount?: number | null
  deckCount?: number | null
  lengthMeters?: string | null
  cruisingSpeedKnots?: string | null
  yearBuilt?: number | null
  yearRefurbished?: number | null
  imo?: string | null
  description?: string | null
  deckPlanUrl?: string | null
  gallery?: string[]
  amenities?: Record<string, unknown>
  isActive?: boolean
}

export type UpdateShipInput = Partial<CreateShipInput>

export interface UpsertDeckInput {
  name: string
  level?: number | null
  planImageUrl?: string | null
}

export interface UpsertCabinCategoryInput {
  shipId: string
  code: string
  name: string
  roomType: "inside" | "oceanview" | "balcony" | "suite" | "penthouse" | "single"
  description?: string | null
  minOccupancy?: number
  maxOccupancy: number
  squareFeet?: string | null
  wheelchairAccessible?: boolean
  amenities?: string[]
  images?: string[]
  floorplanImages?: string[]
  gradeCodes?: string[]
}

export interface UpsertCabinInput {
  cabinNumber: string
  deckId?: string | null
  position?: string | null
  connectsTo?: string | null
  notes?: string | null
  isActive?: boolean
}

export function useShipMutation() {
  const { baseUrl, fetcher } = useVoyantCruisesContext()
  const client = { baseUrl, fetcher }
  const queryClient = useQueryClient()

  const create = useMutation({
    mutationFn: async (input: CreateShipInput): Promise<ShipRecord> => {
      const result = await fetchWithValidation(
        "/v1/admin/cruises/ships",
        shipSingleResponse,
        client,
        { method: "POST", body: JSON.stringify(input) },
      )
      return result.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: cruisesQueryKeys.ships() })
    },
  })

  const update = useMutation({
    mutationFn: async ({
      key,
      input,
    }: {
      key: string
      input: UpdateShipInput
    }): Promise<ShipRecord> => {
      const result = await fetchWithValidation(
        `/v1/admin/cruises/ships/${encodeURIComponent(key)}`,
        shipSingleResponse,
        client,
        { method: "PUT", body: JSON.stringify(input) },
      )
      return result.data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: cruisesQueryKeys.ships() })
      queryClient.setQueryData(cruisesQueryKeys.ship(data.id), data)
    },
  })

  const upsertDeck = useMutation({
    mutationFn: async ({
      key,
      input,
    }: {
      key: string
      input: UpsertDeckInput
    }): Promise<DeckRecord> => {
      const result = await fetchWithValidation(
        `/v1/admin/cruises/ships/${encodeURIComponent(key)}/decks`,
        deckSingleResponse,
        client,
        { method: "POST", body: JSON.stringify(input) },
      )
      return result.data
    },
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: cruisesQueryKeys.shipDecks(vars.key) })
    },
  })

  const upsertCabinCategory = useMutation({
    mutationFn: async (input: UpsertCabinCategoryInput): Promise<CabinCategoryRecord> => {
      // The server bulk endpoint expects { categories: [...] }; for a single
      // upsert we POST through the bulk path with one entry.
      const result = await fetchWithValidation(
        `/v1/admin/cruises/ships/${encodeURIComponent(input.shipId)}/categories/bulk`,
        cabinCategoryListResponse,
        client,
        { method: "PUT", body: JSON.stringify({ categories: [input] }) },
      )
      const first = result.data[0]
      if (!first) throw new Error("Server returned no categories from bulk upsert")
      return first
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: cruisesQueryKeys.shipCategories(data.shipId) })
    },
  })

  const updateCabinCategory = useMutation({
    mutationFn: async ({
      categoryId,
      input,
    }: {
      categoryId: string
      input: Partial<UpsertCabinCategoryInput>
    }): Promise<CabinCategoryRecord> => {
      const result = await fetchWithValidation(
        `/v1/admin/cruises/categories/${encodeURIComponent(categoryId)}`,
        cabinCategorySingleResponse,
        client,
        { method: "PUT", body: JSON.stringify(input) },
      )
      return result.data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: cruisesQueryKeys.shipCategories(data.shipId) })
    },
  })

  const replaceCategoryCabins = useMutation({
    mutationFn: async ({
      categoryId,
      cabins,
    }: {
      categoryId: string
      cabins: UpsertCabinInput[]
    }): Promise<CabinRecord[]> => {
      const result = await fetchWithValidation(
        `/v1/admin/cruises/categories/${encodeURIComponent(categoryId)}/cabins/bulk`,
        cabinListResponse,
        client,
        { method: "PUT", body: JSON.stringify({ cabins }) },
      )
      return result.data
    },
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({
        queryKey: cruisesQueryKeys.categoryCabins(vars.categoryId),
      })
    },
  })

  const updateCabin = useMutation({
    mutationFn: async ({
      cabinId,
      input,
    }: {
      cabinId: string
      input: Partial<UpsertCabinInput>
    }): Promise<CabinRecord> => {
      const result = await fetchWithValidation(
        `/v1/admin/cruises/cabins/${encodeURIComponent(cabinId)}`,
        cabinSingleResponse,
        client,
        { method: "PUT", body: JSON.stringify(input) },
      )
      return result.data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: cruisesQueryKeys.categoryCabins(data.categoryId),
      })
    },
  })

  return {
    create,
    update,
    upsertDeck,
    upsertCabinCategory,
    updateCabinCategory,
    replaceCategoryCabins,
    updateCabin,
  }
}
