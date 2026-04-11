"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { insertRoomBlockSchema, updateRoomBlockSchema } from "@voyantjs/hospitality"
import type { z } from "zod"

import { fetchWithValidation } from "../client.js"
import { useVoyantHospitalityContext } from "../provider.js"
import { hospitalityQueryKeys } from "../query-keys.js"
import { roomBlockSingleResponse, successEnvelope } from "../schemas.js"

export type CreateRoomBlockInput = z.input<typeof insertRoomBlockSchema>
export type UpdateRoomBlockInput = z.input<typeof updateRoomBlockSchema>

export function useRoomBlockMutation() {
  const { baseUrl, fetcher } = useVoyantHospitalityContext()
  const queryClient = useQueryClient()

  const create = useMutation({
    mutationFn: async (input: CreateRoomBlockInput) => {
      const { data } = await fetchWithValidation(
        "/v1/hospitality/room-blocks",
        roomBlockSingleResponse,
        { baseUrl, fetcher },
        { method: "POST", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: hospitalityQueryKeys.roomBlocks() })
      queryClient.setQueryData(hospitalityQueryKeys.roomBlock(data.id), { data })
    },
  })

  const update = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateRoomBlockInput }) => {
      const { data } = await fetchWithValidation(
        `/v1/hospitality/room-blocks/${id}`,
        roomBlockSingleResponse,
        { baseUrl, fetcher },
        { method: "PATCH", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: hospitalityQueryKeys.roomBlocks() })
      queryClient.setQueryData(hospitalityQueryKeys.roomBlock(data.id), { data })
    },
  })

  const remove = useMutation({
    mutationFn: async (id: string) =>
      fetchWithValidation(
        `/v1/hospitality/room-blocks/${id}`,
        successEnvelope,
        { baseUrl, fetcher },
        { method: "DELETE" },
      ),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: hospitalityQueryKeys.roomBlocks() })
      queryClient.removeQueries({ queryKey: hospitalityQueryKeys.roomBlock(id) })
    },
  })

  return { create, update, remove }
}
