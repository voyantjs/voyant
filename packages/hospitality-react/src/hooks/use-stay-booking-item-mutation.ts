"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import type {
  insertStayBookingItemSchema,
  updateStayBookingItemSchema,
} from "@voyantjs/hospitality"
import type { z } from "zod"

import { fetchWithValidation } from "../client.js"
import { useVoyantHospitalityContext } from "../provider.js"
import { hospitalityQueryKeys } from "../query-keys.js"
import { stayBookingItemSingleResponse, successEnvelope } from "../schemas.js"

export type CreateStayBookingItemInput = z.input<typeof insertStayBookingItemSchema>
export type UpdateStayBookingItemInput = z.input<typeof updateStayBookingItemSchema>

export function useStayBookingItemMutation() {
  const { baseUrl, fetcher } = useVoyantHospitalityContext()
  const queryClient = useQueryClient()

  const create = useMutation({
    mutationFn: async (input: CreateStayBookingItemInput) => {
      const { data } = await fetchWithValidation(
        "/v1/hospitality/stay-booking-items",
        stayBookingItemSingleResponse,
        { baseUrl, fetcher },
        { method: "POST", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: hospitalityQueryKeys.stayBookingItems() })
      queryClient.setQueryData(hospitalityQueryKeys.stayBookingItem(data.id), { data })
    },
  })

  const update = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateStayBookingItemInput }) => {
      const { data } = await fetchWithValidation(
        `/v1/hospitality/stay-booking-items/${id}`,
        stayBookingItemSingleResponse,
        { baseUrl, fetcher },
        { method: "PATCH", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: hospitalityQueryKeys.stayBookingItems() })
      queryClient.setQueryData(hospitalityQueryKeys.stayBookingItem(data.id), { data })
    },
  })

  const remove = useMutation({
    mutationFn: async (id: string) =>
      fetchWithValidation(
        `/v1/hospitality/stay-booking-items/${id}`,
        successEnvelope,
        { baseUrl, fetcher },
        { method: "DELETE" },
      ),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: hospitalityQueryKeys.stayBookingItems() })
      queryClient.removeQueries({ queryKey: hospitalityQueryKeys.stayBookingItem(id) })
    },
  })

  return { create, update, remove }
}
