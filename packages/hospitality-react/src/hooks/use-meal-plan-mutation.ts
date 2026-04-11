"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { insertMealPlanSchema, updateMealPlanSchema } from "@voyantjs/hospitality"
import type { z } from "zod"

import { fetchWithValidation } from "../client.js"
import { useVoyantHospitalityContext } from "../provider.js"
import { hospitalityQueryKeys } from "../query-keys.js"
import { mealPlanSingleResponse, successEnvelope } from "../schemas.js"

export type CreateMealPlanInput = z.input<typeof insertMealPlanSchema>
export type UpdateMealPlanInput = z.input<typeof updateMealPlanSchema>

export function useMealPlanMutation() {
  const { baseUrl, fetcher } = useVoyantHospitalityContext()
  const queryClient = useQueryClient()

  const create = useMutation({
    mutationFn: async (input: CreateMealPlanInput) => {
      const { data } = await fetchWithValidation(
        "/v1/hospitality/meal-plans",
        mealPlanSingleResponse,
        { baseUrl, fetcher },
        { method: "POST", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: hospitalityQueryKeys.mealPlans() })
      queryClient.setQueryData(hospitalityQueryKeys.mealPlan(data.id), { data })
    },
  })

  const update = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateMealPlanInput }) => {
      const { data } = await fetchWithValidation(
        `/v1/hospitality/meal-plans/${id}`,
        mealPlanSingleResponse,
        { baseUrl, fetcher },
        { method: "PATCH", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: hospitalityQueryKeys.mealPlans() })
      queryClient.setQueryData(hospitalityQueryKeys.mealPlan(data.id), { data })
    },
  })

  const remove = useMutation({
    mutationFn: async (id: string) =>
      fetchWithValidation(
        `/v1/hospitality/meal-plans/${id}`,
        successEnvelope,
        { baseUrl, fetcher },
        { method: "DELETE" },
      ),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: hospitalityQueryKeys.mealPlans() })
      queryClient.removeQueries({ queryKey: hospitalityQueryKeys.mealPlan(id) })
    },
  })

  return { create, update, remove }
}
