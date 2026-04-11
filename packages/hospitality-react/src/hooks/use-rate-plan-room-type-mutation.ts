"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import type {
  insertRatePlanRoomTypeSchema,
  updateRatePlanRoomTypeSchema,
} from "@voyantjs/hospitality"
import type { z } from "zod"

import { fetchWithValidation } from "../client.js"
import { useVoyantHospitalityContext } from "../provider.js"
import { hospitalityQueryKeys } from "../query-keys.js"
import { ratePlanRoomTypeSingleResponse, successEnvelope } from "../schemas.js"

export type CreateRatePlanRoomTypeInput = z.input<typeof insertRatePlanRoomTypeSchema>
export type UpdateRatePlanRoomTypeInput = z.input<typeof updateRatePlanRoomTypeSchema>

export function useRatePlanRoomTypeMutation() {
  const { baseUrl, fetcher } = useVoyantHospitalityContext()
  const queryClient = useQueryClient()

  const create = useMutation({
    mutationFn: async (input: CreateRatePlanRoomTypeInput) => {
      const { data } = await fetchWithValidation(
        "/v1/hospitality/rate-plan-room-types",
        ratePlanRoomTypeSingleResponse,
        { baseUrl, fetcher },
        { method: "POST", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: hospitalityQueryKeys.ratePlanRoomTypes() })
      queryClient.setQueryData(hospitalityQueryKeys.ratePlanRoomType(data.id), { data })
    },
  })

  const update = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateRatePlanRoomTypeInput }) => {
      const { data } = await fetchWithValidation(
        `/v1/hospitality/rate-plan-room-types/${id}`,
        ratePlanRoomTypeSingleResponse,
        { baseUrl, fetcher },
        { method: "PATCH", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: hospitalityQueryKeys.ratePlanRoomTypes() })
      queryClient.setQueryData(hospitalityQueryKeys.ratePlanRoomType(data.id), { data })
    },
  })

  const remove = useMutation({
    mutationFn: async (id: string) =>
      fetchWithValidation(
        `/v1/hospitality/rate-plan-room-types/${id}`,
        successEnvelope,
        { baseUrl, fetcher },
        { method: "DELETE" },
      ),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: hospitalityQueryKeys.ratePlanRoomTypes() })
      queryClient.removeQueries({ queryKey: hospitalityQueryKeys.ratePlanRoomType(id) })
    },
  })

  return { create, update, remove }
}
