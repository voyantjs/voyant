"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { fetchWithValidation } from "../client.js"
import { useVoyantBookingsContext } from "../provider.js"
import { bookingsQueryKeys } from "../query-keys.js"
import { bookingItemsResponse, bookingSingleResponse, successEnvelope } from "../schemas.js"

export interface CreateBookingItemInput {
  title: string
  itemType?: string
  status?: string
  quantity?: number
  sellCurrency: string
  unitSellAmountCents?: number | null
  totalSellAmountCents?: number | null
  costCurrency?: string | null
  unitCostAmountCents?: number | null
  totalCostAmountCents?: number | null
  serviceDate?: string | null
  startsAt?: string | null
  endsAt?: string | null
  description?: string | null
  notes?: string | null
}

export type UpdateBookingItemInput = Partial<CreateBookingItemInput>

export function useBookingItemMutation(bookingId: string) {
  const { baseUrl, fetcher } = useVoyantBookingsContext()
  const queryClient = useQueryClient()

  const create = useMutation({
    mutationFn: async (input: CreateBookingItemInput) => {
      const { data } = await fetchWithValidation(
        `/v1/bookings/${bookingId}/items`,
        bookingSingleResponse.extend({
          data: bookingItemsResponse.shape.data.element,
        }),
        { baseUrl, fetcher },
        { method: "POST", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bookingsQueryKeys.items(bookingId) })
      void queryClient.invalidateQueries({ queryKey: bookingsQueryKeys.activity(bookingId) })
    },
  })

  const update = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateBookingItemInput }) => {
      const { data } = await fetchWithValidation(
        `/v1/bookings/${bookingId}/items/${id}`,
        bookingSingleResponse.extend({
          data: bookingItemsResponse.shape.data.element,
        }),
        { baseUrl, fetcher },
        { method: "PATCH", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bookingsQueryKeys.items(bookingId) })
      void queryClient.invalidateQueries({ queryKey: bookingsQueryKeys.activity(bookingId) })
    },
  })

  const remove = useMutation({
    mutationFn: async (itemId: string) =>
      fetchWithValidation(
        `/v1/bookings/${bookingId}/items/${itemId}`,
        successEnvelope,
        { baseUrl, fetcher },
        { method: "DELETE" },
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bookingsQueryKeys.items(bookingId) })
      void queryClient.invalidateQueries({ queryKey: bookingsQueryKeys.activity(bookingId) })
    },
  })

  return { create, update, remove }
}
