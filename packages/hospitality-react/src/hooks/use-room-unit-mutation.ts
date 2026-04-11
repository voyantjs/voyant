"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { insertRoomUnitSchema, updateRoomUnitSchema } from "@voyantjs/hospitality"
import type { z } from "zod"

import { fetchWithValidation } from "../client.js"
import { useVoyantHospitalityContext } from "../provider.js"
import { hospitalityQueryKeys } from "../query-keys.js"
import { roomUnitSingleResponse, successEnvelope } from "../schemas.js"

export type CreateRoomUnitInput = z.input<typeof insertRoomUnitSchema>
export type UpdateRoomUnitInput = z.input<typeof updateRoomUnitSchema>

export function useRoomUnitMutation() {
  const { baseUrl, fetcher } = useVoyantHospitalityContext()
  const queryClient = useQueryClient()

  const create = useMutation({
    mutationFn: async (input: CreateRoomUnitInput) => {
      const { data } = await fetchWithValidation(
        "/v1/hospitality/room-units",
        roomUnitSingleResponse,
        { baseUrl, fetcher },
        { method: "POST", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: hospitalityQueryKeys.roomUnits() })
      queryClient.setQueryData(hospitalityQueryKeys.roomUnit(data.id), { data })
    },
  })

  const update = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateRoomUnitInput }) => {
      const { data } = await fetchWithValidation(
        `/v1/hospitality/room-units/${id}`,
        roomUnitSingleResponse,
        { baseUrl, fetcher },
        { method: "PATCH", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: hospitalityQueryKeys.roomUnits() })
      queryClient.setQueryData(hospitalityQueryKeys.roomUnit(data.id), { data })
    },
  })

  const remove = useMutation({
    mutationFn: async (id: string) =>
      fetchWithValidation(
        `/v1/hospitality/room-units/${id}`,
        successEnvelope,
        { baseUrl, fetcher },
        { method: "DELETE" },
      ),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: hospitalityQueryKeys.roomUnits() })
      queryClient.removeQueries({ queryKey: hospitalityQueryKeys.roomUnit(id) })
    },
  })

  return { create, update, remove }
}
