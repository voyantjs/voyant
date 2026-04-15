"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { fetchWithValidation } from "../client.js"
import { useVoyantBookingsContext } from "../provider.js"
import { bookingsQueryKeys } from "../query-keys.js"
import { getBookingItemParticipantsQueryOptions } from "../query-options.js"
import {
  bookingItemParticipantsResponse,
  bookingSingleResponse,
  successEnvelope,
} from "../schemas.js"

export interface UseBookingItemParticipantsOptions {
  enabled?: boolean
}

export function useBookingItemParticipants(
  bookingId: string | null | undefined,
  itemId: string | null | undefined,
  options: UseBookingItemParticipantsOptions = {},
) {
  const { baseUrl, fetcher } = useVoyantBookingsContext()
  const { enabled = true } = options

  return useQuery({
    ...getBookingItemParticipantsQueryOptions({ baseUrl, fetcher }, bookingId, itemId),
    enabled: enabled && Boolean(bookingId) && Boolean(itemId),
  })
}

export interface AddItemParticipantInput {
  participantId: string
  role?: string
  isPrimary?: boolean
}

export function useBookingItemParticipantMutation(bookingId: string, itemId: string) {
  const { baseUrl, fetcher } = useVoyantBookingsContext()
  const queryClient = useQueryClient()

  const add = useMutation({
    mutationFn: async (input: AddItemParticipantInput) => {
      const { data } = await fetchWithValidation(
        `/v1/bookings/${bookingId}/items/${itemId}/participants`,
        bookingSingleResponse.extend({
          data: bookingItemParticipantsResponse.shape.data.element,
        }),
        { baseUrl, fetcher },
        { method: "POST", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: bookingsQueryKeys.itemParticipants(bookingId, itemId),
      })
    },
  })

  const remove = useMutation({
    mutationFn: async (linkId: string) =>
      fetchWithValidation(
        `/v1/bookings/${bookingId}/items/${itemId}/participants/${linkId}`,
        successEnvelope,
        { baseUrl, fetcher },
        { method: "DELETE" },
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: bookingsQueryKeys.itemParticipants(bookingId, itemId),
      })
    },
  })

  return { add, remove }
}
