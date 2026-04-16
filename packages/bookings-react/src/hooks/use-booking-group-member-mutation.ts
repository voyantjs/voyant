"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { fetchWithValidation } from "../client.js"
import { useVoyantBookingsContext } from "../provider.js"
import { bookingsQueryKeys } from "../query-keys.js"
import { bookingGroupMemberSingleResponse, successEnvelope } from "../schemas.js"

export interface AddBookingGroupMemberInput {
  bookingId: string
  role?: "primary" | "shared"
}

export function useBookingGroupMemberMutation(groupId: string) {
  const { baseUrl, fetcher } = useVoyantBookingsContext()
  const queryClient = useQueryClient()

  const invalidate = (bookingId?: string) => {
    void queryClient.invalidateQueries({ queryKey: bookingsQueryKeys.group(groupId) })
    void queryClient.invalidateQueries({ queryKey: bookingsQueryKeys.groupMembers(groupId) })
    void queryClient.invalidateQueries({ queryKey: bookingsQueryKeys.groups() })
    if (bookingId) {
      void queryClient.invalidateQueries({
        queryKey: bookingsQueryKeys.groupForBooking(bookingId),
      })
    }
  }

  const add = useMutation({
    mutationFn: async (input: AddBookingGroupMemberInput) => {
      const { data } = await fetchWithValidation(
        `/v1/bookings/groups/${groupId}/members`,
        bookingGroupMemberSingleResponse,
        { baseUrl, fetcher },
        { method: "POST", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: (_, variables) => invalidate(variables.bookingId),
  })

  const remove = useMutation({
    mutationFn: async (bookingId: string) =>
      fetchWithValidation(
        `/v1/bookings/groups/${groupId}/members/${bookingId}`,
        successEnvelope,
        { baseUrl, fetcher },
        { method: "DELETE" },
      ),
    onSuccess: (_, bookingId) => invalidate(bookingId),
  })

  return { add, remove }
}
