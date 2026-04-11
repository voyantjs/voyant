"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { insertRoomInventorySchema, updateRoomInventorySchema } from "@voyantjs/hospitality"
import type { z } from "zod"

import { fetchWithValidation } from "../client.js"
import { useVoyantHospitalityContext } from "../provider.js"
import { hospitalityQueryKeys } from "../query-keys.js"
import { roomInventorySingleResponse, successEnvelope } from "../schemas.js"

export type CreateRoomInventoryInput = z.input<typeof insertRoomInventorySchema>
export type UpdateRoomInventoryInput = z.input<typeof updateRoomInventorySchema>

export function useRoomInventoryMutation() {
  const { baseUrl, fetcher } = useVoyantHospitalityContext()
  const queryClient = useQueryClient()

  const create = useMutation({
    mutationFn: async (input: CreateRoomInventoryInput) => {
      const { data } = await fetchWithValidation(
        "/v1/hospitality/room-inventory",
        roomInventorySingleResponse,
        { baseUrl, fetcher },
        { method: "POST", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: hospitalityQueryKeys.roomInventory() })
      queryClient.setQueryData(hospitalityQueryKeys.roomInventoryItem(data.id), { data })
    },
  })

  const update = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateRoomInventoryInput }) => {
      const { data } = await fetchWithValidation(
        `/v1/hospitality/room-inventory/${id}`,
        roomInventorySingleResponse,
        { baseUrl, fetcher },
        { method: "PATCH", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: hospitalityQueryKeys.roomInventory() })
      queryClient.setQueryData(hospitalityQueryKeys.roomInventoryItem(data.id), { data })
    },
  })

  const remove = useMutation({
    mutationFn: async (id: string) =>
      fetchWithValidation(
        `/v1/hospitality/room-inventory/${id}`,
        successEnvelope,
        { baseUrl, fetcher },
        { method: "DELETE" },
      ),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: hospitalityQueryKeys.roomInventory() })
      queryClient.removeQueries({ queryKey: hospitalityQueryKeys.roomInventoryItem(id) })
    },
  })

  return { create, update, remove }
}
