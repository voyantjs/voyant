"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { fetchWithValidation } from "../client.js"
import { useVoyantBookingsContext } from "../provider.js"
import { bookingsQueryKeys } from "../query-keys.js"
import { bookingItemTravelersResponse, bookingSingleResponse, successEnvelope } from "../schemas.js"

export {
  type UseBookingItemTravelersOptions as UseBookingItemParticipantsOptions,
  useBookingItemTravelers as useBookingItemParticipants,
} from "./use-booking-item-travelers.js"

export interface AddItemParticipantInput {
  travelerId?: string
  participantId?: string
  passengerId?: string
  role?: string
  isPrimary?: boolean
}

export function useBookingItemParticipantMutation(bookingId: string, itemId: string) {
  const { baseUrl, fetcher } = useVoyantBookingsContext()
  const queryClient = useQueryClient()

  const add = useMutation({
    mutationFn: async (input: AddItemParticipantInput) => {
      const travelerId = input.travelerId ?? input.participantId ?? input.passengerId
      if (!travelerId) throw new Error("travelerId is required")

      const { data } = await fetchWithValidation(
        `/v1/bookings/${bookingId}/items/${itemId}/travelers`,
        bookingSingleResponse.extend({
          data: bookingItemTravelersResponse.shape.data.element,
        }),
        { baseUrl, fetcher },
        {
          method: "POST",
          body: JSON.stringify({
            travelerId,
            role: input.role,
            isPrimary: input.isPrimary,
          }),
        },
      )
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: bookingsQueryKeys.itemTravelers(bookingId, itemId),
      })
    },
  })

  const remove = useMutation({
    mutationFn: async (linkId: string) =>
      fetchWithValidation(
        `/v1/bookings/${bookingId}/items/${itemId}/travelers/${linkId}`,
        successEnvelope,
        { baseUrl, fetcher },
        { method: "DELETE" },
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: bookingsQueryKeys.itemTravelers(bookingId, itemId),
      })
    },
  })

  return { add, remove }
}
