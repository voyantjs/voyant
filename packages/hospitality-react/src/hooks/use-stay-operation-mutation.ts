"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { insertStayOperationSchema, updateStayOperationSchema } from "@voyantjs/hospitality"
import type { z } from "zod"

import { fetchWithValidation } from "../client.js"
import { useVoyantHospitalityContext } from "../provider.js"
import { hospitalityQueryKeys } from "../query-keys.js"
import { stayOperationSingleResponse, successEnvelope } from "../schemas.js"

export type CreateStayOperationInput = z.input<typeof insertStayOperationSchema>
export type UpdateStayOperationInput = z.input<typeof updateStayOperationSchema>

export function useStayOperationMutation() {
  const { baseUrl, fetcher } = useVoyantHospitalityContext()
  const queryClient = useQueryClient()

  const create = useMutation({
    mutationFn: async (input: CreateStayOperationInput) => {
      const { data } = await fetchWithValidation(
        "/v1/hospitality/stay-operations",
        stayOperationSingleResponse,
        { baseUrl, fetcher },
        { method: "POST", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: hospitalityQueryKeys.stayOperations() })
      queryClient.setQueryData(hospitalityQueryKeys.stayOperation(data.id), { data })
    },
  })

  const update = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateStayOperationInput }) => {
      const { data } = await fetchWithValidation(
        `/v1/hospitality/stay-operations/${id}`,
        stayOperationSingleResponse,
        { baseUrl, fetcher },
        { method: "PATCH", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: hospitalityQueryKeys.stayOperations() })
      queryClient.setQueryData(hospitalityQueryKeys.stayOperation(data.id), { data })
    },
  })

  const remove = useMutation({
    mutationFn: async (id: string) =>
      fetchWithValidation(
        `/v1/hospitality/stay-operations/${id}`,
        successEnvelope,
        { baseUrl, fetcher },
        { method: "DELETE" },
      ),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: hospitalityQueryKeys.stayOperations() })
      queryClient.removeQueries({ queryKey: hospitalityQueryKeys.stayOperation(id) })
    },
  })

  return { create, update, remove }
}
