"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { insertRatePlanSchema, updateRatePlanSchema } from "@voyantjs/hospitality"
import type { z } from "zod"

import { fetchWithValidation } from "../client.js"
import { useVoyantHospitalityContext } from "../provider.js"
import { hospitalityQueryKeys } from "../query-keys.js"
import { ratePlanSingleResponse, successEnvelope } from "../schemas.js"

export type CreateRatePlanInput = z.input<typeof insertRatePlanSchema>
export type UpdateRatePlanInput = z.input<typeof updateRatePlanSchema>

export function useRatePlanMutation() {
  const { baseUrl, fetcher } = useVoyantHospitalityContext()
  const queryClient = useQueryClient()

  const create = useMutation({
    mutationFn: async (input: CreateRatePlanInput) => {
      const { data } = await fetchWithValidation(
        "/v1/hospitality/rate-plans",
        ratePlanSingleResponse,
        { baseUrl, fetcher },
        { method: "POST", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: hospitalityQueryKeys.ratePlans() })
      queryClient.setQueryData(hospitalityQueryKeys.ratePlan(data.id), { data })
    },
  })

  const update = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateRatePlanInput }) => {
      const { data } = await fetchWithValidation(
        `/v1/hospitality/rate-plans/${id}`,
        ratePlanSingleResponse,
        { baseUrl, fetcher },
        { method: "PATCH", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: hospitalityQueryKeys.ratePlans() })
      queryClient.setQueryData(hospitalityQueryKeys.ratePlan(data.id), { data })
    },
  })

  const remove = useMutation({
    mutationFn: async (id: string) =>
      fetchWithValidation(
        `/v1/hospitality/rate-plans/${id}`,
        successEnvelope,
        { baseUrl, fetcher },
        { method: "DELETE" },
      ),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: hospitalityQueryKeys.ratePlans() })
      queryClient.removeQueries({ queryKey: hospitalityQueryKeys.ratePlan(id) })
    },
  })

  return { create, update, remove }
}
