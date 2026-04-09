"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { fetchWithValidation } from "../client.js"
import { useVoyantBookingsContext } from "../provider.js"
import { bookingsQueryKeys } from "../query-keys.js"
import { bookingPassengersResponse, bookingSingleResponse, successEnvelope } from "../schemas.js"

export interface CreatePassengerInput {
  firstName: string
  lastName: string
  email?: string | null
  phone?: string | null
  specialRequests?: string | null
  isLeadPassenger?: boolean | null
}

export type UpdatePassengerInput = Partial<CreatePassengerInput>

export function usePassengerMutation(bookingId: string) {
  const { baseUrl, fetcher } = useVoyantBookingsContext()
  const queryClient = useQueryClient()

  const create = useMutation({
    mutationFn: async (input: CreatePassengerInput) => {
      const { data } = await fetchWithValidation(
        `/v1/bookings/${bookingId}/passengers`,
        bookingSingleResponse.extend({
          data: bookingPassengersResponse.shape.data.element,
        }),
        { baseUrl, fetcher },
        { method: "POST", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bookingsQueryKeys.passengers(bookingId) })
      void queryClient.invalidateQueries({ queryKey: bookingsQueryKeys.activity(bookingId) })
    },
  })

  const update = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdatePassengerInput }) => {
      const { data } = await fetchWithValidation(
        `/v1/bookings/${bookingId}/passengers/${id}`,
        bookingSingleResponse.extend({
          data: bookingPassengersResponse.shape.data.element,
        }),
        { baseUrl, fetcher },
        { method: "PATCH", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bookingsQueryKeys.passengers(bookingId) })
      void queryClient.invalidateQueries({ queryKey: bookingsQueryKeys.activity(bookingId) })
    },
  })

  const remove = useMutation({
    mutationFn: async (passengerId: string) =>
      fetchWithValidation(
        `/v1/bookings/${bookingId}/passengers/${passengerId}`,
        successEnvelope,
        { baseUrl, fetcher },
        { method: "DELETE" },
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bookingsQueryKeys.passengers(bookingId) })
      void queryClient.invalidateQueries({ queryKey: bookingsQueryKeys.activity(bookingId) })
    },
  })

  return { create, update, remove }
}
