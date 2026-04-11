"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import type {
  insertMaintenanceBlockSchema,
  updateMaintenanceBlockSchema,
} from "@voyantjs/hospitality"
import type { z } from "zod"

import { fetchWithValidation } from "../client.js"
import { useVoyantHospitalityContext } from "../provider.js"
import { hospitalityQueryKeys } from "../query-keys.js"
import { maintenanceBlockSingleResponse, successEnvelope } from "../schemas.js"

export type CreateMaintenanceBlockInput = z.input<typeof insertMaintenanceBlockSchema>
export type UpdateMaintenanceBlockInput = z.input<typeof updateMaintenanceBlockSchema>

export function useMaintenanceBlockMutation() {
  const { baseUrl, fetcher } = useVoyantHospitalityContext()
  const queryClient = useQueryClient()

  const create = useMutation({
    mutationFn: async (input: CreateMaintenanceBlockInput) => {
      const { data } = await fetchWithValidation(
        "/v1/hospitality/maintenance-blocks",
        maintenanceBlockSingleResponse,
        { baseUrl, fetcher },
        { method: "POST", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: hospitalityQueryKeys.maintenanceBlocks() })
      queryClient.setQueryData(hospitalityQueryKeys.maintenanceBlock(data.id), { data })
    },
  })

  const update = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateMaintenanceBlockInput }) => {
      const { data } = await fetchWithValidation(
        `/v1/hospitality/maintenance-blocks/${id}`,
        maintenanceBlockSingleResponse,
        { baseUrl, fetcher },
        { method: "PATCH", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: hospitalityQueryKeys.maintenanceBlocks() })
      queryClient.setQueryData(hospitalityQueryKeys.maintenanceBlock(data.id), { data })
    },
  })

  const remove = useMutation({
    mutationFn: async (id: string) =>
      fetchWithValidation(
        `/v1/hospitality/maintenance-blocks/${id}`,
        successEnvelope,
        { baseUrl, fetcher },
        { method: "DELETE" },
      ),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: hospitalityQueryKeys.maintenanceBlocks() })
      queryClient.removeQueries({ queryKey: hospitalityQueryKeys.maintenanceBlock(id) })
    },
  })

  return { create, update, remove }
}
