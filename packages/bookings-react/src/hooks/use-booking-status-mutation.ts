"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { fetchWithValidation } from "../client.js"
import { useVoyantBookingsContext } from "../provider.js"
import { bookingsQueryKeys } from "../query-keys.js"
import { type BookingRecord, bookingSingleResponse } from "../schemas.js"

export interface UpdateBookingStatusInput {
  status: BookingRecord["status"]
  note?: string | null
}

export function useBookingStatusMutation(bookingId: string) {
  const { baseUrl, fetcher } = useVoyantBookingsContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateBookingStatusInput) => {
      const { data } = await fetchWithValidation(
        `/v1/bookings/${bookingId}/status`,
        bookingSingleResponse,
        { baseUrl, fetcher },
        { method: "PATCH", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: bookingsQueryKeys.bookings() })
      queryClient.setQueryData(bookingsQueryKeys.booking(bookingId), { data })
      void queryClient.invalidateQueries({ queryKey: bookingsQueryKeys.activity(bookingId) })
    },
  })
}

export interface UpdateBookingStatusByIdInput extends UpdateBookingStatusInput {
  bookingId: string
}

/**
 * Variant of `useBookingStatusMutation` that accepts the booking id at call
 * time instead of at hook-setup time. Used by flows that create a booking
 * and immediately transition its status in the same handler — the id only
 * exists after the create returns, so the per-booking hook shape doesn't
 * fit.
 */
export function useBookingStatusByIdMutation() {
  const { baseUrl, fetcher } = useVoyantBookingsContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ bookingId, ...input }: UpdateBookingStatusByIdInput) => {
      const { data } = await fetchWithValidation(
        `/v1/bookings/${bookingId}/status`,
        bookingSingleResponse,
        { baseUrl, fetcher },
        { method: "PATCH", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({ queryKey: bookingsQueryKeys.bookings() })
      queryClient.setQueryData(bookingsQueryKeys.booking(variables.bookingId), { data })
      void queryClient.invalidateQueries({
        queryKey: bookingsQueryKeys.activity(variables.bookingId),
      })
    },
  })
}
