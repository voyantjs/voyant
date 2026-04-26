import { useMutation, useQueryClient } from "@tanstack/react-query"

import { fetchWithValidation } from "../client.js"
import { useVoyantCruisesContext } from "../provider.js"
import { cruisesQueryKeys } from "../query-keys.js"
import { type CruiseRecord, cruiseSingleResponse } from "../schemas.js"

export interface CreateCruiseInput {
  slug: string
  name: string
  cruiseType: "ocean" | "river" | "expedition" | "coastal"
  nights: number
  lineSupplierId?: string | null
  defaultShipId?: string | null
  embarkPortFacilityId?: string | null
  disembarkPortFacilityId?: string | null
  description?: string | null
  shortDescription?: string | null
  highlights?: string[]
  inclusionsHtml?: string | null
  exclusionsHtml?: string | null
  regions?: string[]
  themes?: string[]
  heroImageUrl?: string | null
  mapImageUrl?: string | null
  status?: "draft" | "awaiting_review" | "live" | "archived"
}

export type UpdateCruiseInput = Partial<CreateCruiseInput>

/**
 * Mutation set for self-managed cruises: create / update / archive /
 * recompute aggregates. Writes against external cruises return 409 from
 * the server; this hook surfaces those as VoyantApiError.
 */
export function useCruiseMutation() {
  const { baseUrl, fetcher } = useVoyantCruisesContext()
  const client = { baseUrl, fetcher }
  const queryClient = useQueryClient()

  const create = useMutation({
    mutationFn: async (input: CreateCruiseInput): Promise<CruiseRecord> => {
      const result = await fetchWithValidation("/v1/admin/cruises", cruiseSingleResponse, client, {
        method: "POST",
        body: JSON.stringify(input),
      })
      return result.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: cruisesQueryKeys.cruises() })
    },
  })

  const update = useMutation({
    mutationFn: async ({
      key,
      input,
    }: {
      key: string
      input: UpdateCruiseInput
    }): Promise<CruiseRecord> => {
      const result = await fetchWithValidation(
        `/v1/admin/cruises/${encodeURIComponent(key)}`,
        cruiseSingleResponse,
        client,
        { method: "PUT", body: JSON.stringify(input) },
      )
      return result.data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: cruisesQueryKeys.cruises() })
      queryClient.setQueryData(cruisesQueryKeys.cruise(data.id), data)
    },
  })

  const archive = useMutation({
    mutationFn: async (key: string): Promise<CruiseRecord> => {
      const result = await fetchWithValidation(
        `/v1/admin/cruises/${encodeURIComponent(key)}`,
        cruiseSingleResponse,
        client,
        { method: "DELETE" },
      )
      return result.data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: cruisesQueryKeys.cruises() })
      queryClient.setQueryData(cruisesQueryKeys.cruise(data.id), data)
    },
  })

  const recomputeAggregates = useMutation({
    mutationFn: async (key: string): Promise<CruiseRecord> => {
      const result = await fetchWithValidation(
        `/v1/admin/cruises/${encodeURIComponent(key)}/aggregates/recompute`,
        cruiseSingleResponse,
        client,
        { method: "POST" },
      )
      return result.data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: cruisesQueryKeys.cruises() })
      queryClient.setQueryData(cruisesQueryKeys.cruise(data.id), data)
    },
  })

  return { create, update, archive, recomputeAggregates }
}
