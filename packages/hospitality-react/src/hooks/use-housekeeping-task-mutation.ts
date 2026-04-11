"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import type {
  insertHousekeepingTaskSchema,
  updateHousekeepingTaskSchema,
} from "@voyantjs/hospitality"
import type { z } from "zod"

import { fetchWithValidation } from "../client.js"
import { useVoyantHospitalityContext } from "../provider.js"
import { hospitalityQueryKeys } from "../query-keys.js"
import { housekeepingTaskSingleResponse, successEnvelope } from "../schemas.js"

export type CreateHousekeepingTaskInput = z.input<typeof insertHousekeepingTaskSchema>
export type UpdateHousekeepingTaskInput = z.input<typeof updateHousekeepingTaskSchema>

export function useHousekeepingTaskMutation() {
  const { baseUrl, fetcher } = useVoyantHospitalityContext()
  const queryClient = useQueryClient()

  const create = useMutation({
    mutationFn: async (input: CreateHousekeepingTaskInput) => {
      const { data } = await fetchWithValidation(
        "/v1/hospitality/housekeeping-tasks",
        housekeepingTaskSingleResponse,
        { baseUrl, fetcher },
        { method: "POST", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: hospitalityQueryKeys.housekeepingTasks() })
      queryClient.setQueryData(hospitalityQueryKeys.housekeepingTask(data.id), { data })
    },
  })

  const update = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateHousekeepingTaskInput }) => {
      const { data } = await fetchWithValidation(
        `/v1/hospitality/housekeeping-tasks/${id}`,
        housekeepingTaskSingleResponse,
        { baseUrl, fetcher },
        { method: "PATCH", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: hospitalityQueryKeys.housekeepingTasks() })
      queryClient.setQueryData(hospitalityQueryKeys.housekeepingTask(data.id), { data })
    },
  })

  const remove = useMutation({
    mutationFn: async (id: string) =>
      fetchWithValidation(
        `/v1/hospitality/housekeeping-tasks/${id}`,
        successEnvelope,
        { baseUrl, fetcher },
        { method: "DELETE" },
      ),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: hospitalityQueryKeys.housekeepingTasks() })
      queryClient.removeQueries({ queryKey: hospitalityQueryKeys.housekeepingTask(id) })
    },
  })

  return { create, update, remove }
}
