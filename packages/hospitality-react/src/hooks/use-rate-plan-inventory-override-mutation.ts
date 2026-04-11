"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import type {
  insertRatePlanInventoryOverrideSchema,
  updateRatePlanInventoryOverrideSchema,
} from "@voyantjs/hospitality"
import type { z } from "zod"

import { fetchWithValidation } from "../client.js"
import { useVoyantHospitalityContext } from "../provider.js"
import { hospitalityQueryKeys } from "../query-keys.js"
import { ratePlanInventoryOverrideSingleResponse, successEnvelope } from "../schemas.js"

export type CreateRatePlanInventoryOverrideInput = z.input<
  typeof insertRatePlanInventoryOverrideSchema
>
export type UpdateRatePlanInventoryOverrideInput = z.input<
  typeof updateRatePlanInventoryOverrideSchema
>

export function useRatePlanInventoryOverrideMutation() {
  const { baseUrl, fetcher } = useVoyantHospitalityContext()
  const queryClient = useQueryClient()

  const create = useMutation({
    mutationFn: async (input: CreateRatePlanInventoryOverrideInput) => {
      const { data } = await fetchWithValidation(
        "/v1/hospitality/rate-plan-inventory-overrides",
        ratePlanInventoryOverrideSingleResponse,
        { baseUrl, fetcher },
        { method: "POST", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: hospitalityQueryKeys.ratePlanInventoryOverrides(),
      })
      queryClient.setQueryData(hospitalityQueryKeys.ratePlanInventoryOverride(data.id), { data })
    },
  })

  const update = useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string
      input: UpdateRatePlanInventoryOverrideInput
    }) => {
      const { data } = await fetchWithValidation(
        `/v1/hospitality/rate-plan-inventory-overrides/${id}`,
        ratePlanInventoryOverrideSingleResponse,
        { baseUrl, fetcher },
        { method: "PATCH", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: hospitalityQueryKeys.ratePlanInventoryOverrides(),
      })
      queryClient.setQueryData(hospitalityQueryKeys.ratePlanInventoryOverride(data.id), { data })
    },
  })

  const remove = useMutation({
    mutationFn: async (id: string) =>
      fetchWithValidation(
        `/v1/hospitality/rate-plan-inventory-overrides/${id}`,
        successEnvelope,
        { baseUrl, fetcher },
        { method: "DELETE" },
      ),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({
        queryKey: hospitalityQueryKeys.ratePlanInventoryOverrides(),
      })
      queryClient.removeQueries({ queryKey: hospitalityQueryKeys.ratePlanInventoryOverride(id) })
    },
  })

  return { create, update, remove }
}
