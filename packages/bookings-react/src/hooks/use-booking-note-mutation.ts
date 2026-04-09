"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { z } from "zod"

import { fetchWithValidation } from "../client.js"
import { useVoyantBookingsContext } from "../provider.js"
import { bookingsQueryKeys } from "../query-keys.js"
import { bookingNoteRecordSchema } from "../schemas.js"

export interface CreateBookingNoteInput {
  content: string
}

const bookingNoteSingleResponse = z.object({
  data: bookingNoteRecordSchema,
})

export function useBookingNoteMutation(bookingId: string) {
  const { baseUrl, fetcher } = useVoyantBookingsContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateBookingNoteInput) => {
      const { data } = await fetchWithValidation(
        `/v1/bookings/${bookingId}/notes`,
        bookingNoteSingleResponse,
        { baseUrl, fetcher },
        { method: "POST", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bookingsQueryKeys.notes(bookingId) })
      void queryClient.invalidateQueries({ queryKey: bookingsQueryKeys.activity(bookingId) })
    },
  })
}
