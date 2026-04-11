"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { insertRoomTypeRateSchema, updateRoomTypeRateSchema } from "@voyantjs/hospitality"
import type { z } from "zod"

import { fetchWithValidation } from "../client.js"
import { useVoyantHospitalityContext } from "../provider.js"
import { hospitalityQueryKeys } from "../query-keys.js"
import { roomTypeRateSingleResponse, successEnvelope } from "../schemas.js"

export type CreateRoomTypeRateInput = z.input<typeof insertRoomTypeRateSchema>
export type UpdateRoomTypeRateInput = z.input<typeof updateRoomTypeRateSchema>

export function useRoomTypeRateMutation() {
  const { baseUrl, fetcher } = useVoyantHospitalityContext()
  const queryClient = useQueryClient()

  const create = useMutation({
    mutationFn: async (input: CreateRoomTypeRateInput) => {
      const { data } = await fetchWithValidation(
        "/v1/hospitality/room-type-rates",
        roomTypeRateSingleResponse,
        { baseUrl, fetcher },
        { method: "POST", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: hospitalityQueryKeys.roomTypeRates() })
      queryClient.setQueryData(hospitalityQueryKeys.roomTypeRate(data.id), { data })
    },
  })

  const update = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateRoomTypeRateInput }) => {
      const { data } = await fetchWithValidation(
        `/v1/hospitality/room-type-rates/${id}`,
        roomTypeRateSingleResponse,
        { baseUrl, fetcher },
        { method: "PATCH", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: hospitalityQueryKeys.roomTypeRates() })
      queryClient.setQueryData(hospitalityQueryKeys.roomTypeRate(data.id), { data })
    },
  })

  const remove = useMutation({
    mutationFn: async (id: string) =>
      fetchWithValidation(
        `/v1/hospitality/room-type-rates/${id}`,
        successEnvelope,
        { baseUrl, fetcher },
        { method: "DELETE" },
      ),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: hospitalityQueryKeys.roomTypeRates() })
      queryClient.removeQueries({ queryKey: hospitalityQueryKeys.roomTypeRate(id) })
    },
  })

  return { create, update, remove }
}
