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
