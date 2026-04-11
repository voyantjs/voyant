"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { insertRoomTypeSchema, updateRoomTypeSchema } from "@voyantjs/hospitality"
import type { z } from "zod"

import { fetchWithValidation } from "../client.js"
import { useVoyantHospitalityContext } from "../provider.js"
import { hospitalityQueryKeys } from "../query-keys.js"
import { roomTypeSingleResponse, successEnvelope } from "../schemas.js"

export type CreateRoomTypeInput = z.input<typeof insertRoomTypeSchema>
export type UpdateRoomTypeInput = z.input<typeof updateRoomTypeSchema>

export function useRoomTypeMutation() {
  const { baseUrl, fetcher } = useVoyantHospitalityContext()
  const queryClient = useQueryClient()

  const create = useMutation({
    mutationFn: async (input: CreateRoomTypeInput) => {
      const { data } = await fetchWithValidation(
        "/v1/hospitality/room-types",
        roomTypeSingleResponse,
        { baseUrl, fetcher },
        { method: "POST", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: hospitalityQueryKeys.roomTypes() })
      queryClient.setQueryData(hospitalityQueryKeys.roomType(data.id), { data })
    },
  })

  const update = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateRoomTypeInput }) => {
      const { data } = await fetchWithValidation(
        `/v1/hospitality/room-types/${id}`,
        roomTypeSingleResponse,
        { baseUrl, fetcher },
        { method: "PATCH", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: hospitalityQueryKeys.roomTypes() })
      queryClient.setQueryData(hospitalityQueryKeys.roomType(data.id), { data })
    },
  })

  const remove = useMutation({
    mutationFn: async (id: string) =>
      fetchWithValidation(
        `/v1/hospitality/room-types/${id}`,
        successEnvelope,
        { baseUrl, fetcher },
        { method: "DELETE" },
      ),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: hospitalityQueryKeys.roomTypes() })
      queryClient.removeQueries({ queryKey: hospitalityQueryKeys.roomType(id) })
    },
  })

  return { create, update, remove }
}
