"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { insertStayRuleSchema, updateStayRuleSchema } from "@voyantjs/hospitality"
import type { z } from "zod"

import { fetchWithValidation } from "../client.js"
import { useVoyantHospitalityContext } from "../provider.js"
import { hospitalityQueryKeys } from "../query-keys.js"
import { stayRuleSingleResponse, successEnvelope } from "../schemas.js"

export type CreateStayRuleInput = z.input<typeof insertStayRuleSchema>
export type UpdateStayRuleInput = z.input<typeof updateStayRuleSchema>

export function useStayRuleMutation() {
  const { baseUrl, fetcher } = useVoyantHospitalityContext()
  const queryClient = useQueryClient()

  const create = useMutation({
    mutationFn: async (input: CreateStayRuleInput) => {
      const { data } = await fetchWithValidation(
        "/v1/hospitality/stay-rules",
        stayRuleSingleResponse,
        { baseUrl, fetcher },
        { method: "POST", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: hospitalityQueryKeys.stayRules() })
      queryClient.setQueryData(hospitalityQueryKeys.stayRule(data.id), { data })
    },
  })

  const update = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateStayRuleInput }) => {
      const { data } = await fetchWithValidation(
        `/v1/hospitality/stay-rules/${id}`,
        stayRuleSingleResponse,
        { baseUrl, fetcher },
        { method: "PATCH", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: hospitalityQueryKeys.stayRules() })
      queryClient.setQueryData(hospitalityQueryKeys.stayRule(data.id), { data })
    },
  })

  const remove = useMutation({
    mutationFn: async (id: string) =>
      fetchWithValidation(
        `/v1/hospitality/stay-rules/${id}`,
        successEnvelope,
        { baseUrl, fetcher },
        { method: "DELETE" },
      ),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: hospitalityQueryKeys.stayRules() })
      queryClient.removeQueries({ queryKey: hospitalityQueryKeys.stayRule(id) })
    },
  })

  return { create, update, remove }
}
