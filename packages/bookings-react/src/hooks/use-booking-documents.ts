"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { fetchWithValidation } from "../client.js"
import { useVoyantBookingsContext } from "../provider.js"
import { bookingsQueryKeys } from "../query-keys.js"
import { getBookingDocumentsQueryOptions } from "../query-options.js"
import { bookingDocumentsResponse, bookingSingleResponse, successEnvelope } from "../schemas.js"

export interface UseBookingDocumentsOptions {
  enabled?: boolean
}

export function useBookingDocuments(
  bookingId: string | null | undefined,
  options: UseBookingDocumentsOptions = {},
) {
  const { baseUrl, fetcher } = useVoyantBookingsContext()
  const { enabled = true } = options

  return useQuery({
    ...getBookingDocumentsQueryOptions({ baseUrl, fetcher }, bookingId),
    enabled: enabled && Boolean(bookingId),
  })
}

export interface CreateBookingDocumentInput {
  type: string
  fileName: string
  fileUrl: string
  participantId?: string | null
  expiresAt?: string | null
  notes?: string | null
}

export function useBookingDocumentMutation(bookingId: string) {
  const { baseUrl, fetcher } = useVoyantBookingsContext()
  const queryClient = useQueryClient()

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: bookingsQueryKeys.documents(bookingId) })
  }

  const create = useMutation({
    mutationFn: async (input: CreateBookingDocumentInput) => {
      const { data } = await fetchWithValidation(
        `/v1/bookings/${bookingId}/documents`,
        bookingSingleResponse.extend({
          data: bookingDocumentsResponse.shape.data.element,
        }),
        { baseUrl, fetcher },
        { method: "POST", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: async (documentId: string) =>
      fetchWithValidation(
        `/v1/bookings/${bookingId}/documents/${documentId}`,
        successEnvelope,
        { baseUrl, fetcher },
        { method: "DELETE" },
      ),
    onSuccess: invalidate,
  })

  return { create, remove }
}
