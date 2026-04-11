"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { insertStayFolioSchema, updateStayFolioSchema } from "@voyantjs/hospitality"
import type { z } from "zod"

import { fetchWithValidation } from "../client.js"
import { useVoyantHospitalityContext } from "../provider.js"
import { hospitalityQueryKeys } from "../query-keys.js"
import { stayFolioSingleResponse, successEnvelope } from "../schemas.js"

export type CreateStayFolioInput = z.input<typeof insertStayFolioSchema>
export type UpdateStayFolioInput = z.input<typeof updateStayFolioSchema>

export function useStayFolioMutation() {
  const { baseUrl, fetcher } = useVoyantHospitalityContext()
  const queryClient = useQueryClient()

  const create = useMutation({
    mutationFn: async (input: CreateStayFolioInput) => {
      const { data } = await fetchWithValidation(
        "/v1/hospitality/stay-folios",
        stayFolioSingleResponse,
        { baseUrl, fetcher },
        { method: "POST", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: hospitalityQueryKeys.stayFolios() })
      queryClient.setQueryData(hospitalityQueryKeys.stayFolio(data.id), { data })
    },
  })

  const update = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateStayFolioInput }) => {
      const { data } = await fetchWithValidation(
        `/v1/hospitality/stay-folios/${id}`,
        stayFolioSingleResponse,
        { baseUrl, fetcher },
        { method: "PATCH", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: hospitalityQueryKeys.stayFolios() })
      queryClient.setQueryData(hospitalityQueryKeys.stayFolio(data.id), { data })
    },
  })

  const remove = useMutation({
    mutationFn: async (id: string) =>
      fetchWithValidation(
        `/v1/hospitality/stay-folios/${id}`,
        successEnvelope,
        { baseUrl, fetcher },
        { method: "DELETE" },
      ),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: hospitalityQueryKeys.stayFolios() })
      queryClient.removeQueries({ queryKey: hospitalityQueryKeys.stayFolio(id) })
    },
  })

  return { create, update, remove }
}
