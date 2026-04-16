"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { fetchWithValidation } from "../client.js"
import { useVoyantBookingsContext } from "../provider.js"
import { bookingsQueryKeys } from "../query-keys.js"
import { bookingSingleResponse } from "../schemas.js"

export interface ConvertProductToBookingInput {
  productId: string
  bookingNumber: string
  optionId?: string | null
  personId?: string | null
  organizationId?: string | null
  internalNotes?: string | null
}

/**
 * Creates a draft booking from a product via POST /v1/bookings/from-product.
 * Purpose-built for the operator quick-book flow — the backend seeds items,
 * dates, and pricing from the product definition.
 */
export function useBookingConvertMutation() {
  const { baseUrl, fetcher } = useVoyantBookingsContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: ConvertProductToBookingInput) => {
      const { data } = await fetchWithValidation(
        "/v1/bookings/from-product",
        bookingSingleResponse,
        { baseUrl, fetcher },
        { method: "POST", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bookingsQueryKeys.bookings() })
    },
  })
}
