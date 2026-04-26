import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { fetchWithValidation } from "../client.js"
import { useVoyantChartersContext } from "../provider.js"
import { chartersQueryKeys } from "../query-keys.js"
import { type BookingCharterDetailRecord, charterDetailResponse } from "../schemas.js"

export interface ApaPaymentInput {
  amount: string
  note?: string | null
}

export interface ApaReconcileInput {
  spentAmount?: string
  refundAmount?: string
  settle?: boolean
  note?: string | null
}

/**
 * Fetch the booking_charter_details row for a charter booking. Used by
 * APA UI to show paid / spent / refund balances + settled timestamp.
 */
export function useCharterDetails(
  bookingId: string | null | undefined,
  options: { enabled?: boolean } = {},
) {
  const { baseUrl, fetcher } = useVoyantChartersContext()
  const client = { baseUrl, fetcher }
  const { enabled = true } = options
  return useQuery({
    queryKey: ["voyant", "charters", "booking-details", bookingId ?? ""] as const,
    enabled: enabled && !!bookingId,
    queryFn: async (): Promise<BookingCharterDetailRecord> => {
      const result = await fetchWithValidation(
        `/v1/admin/bookings/${encodeURIComponent(bookingId ?? "")}/charter-details`,
        charterDetailResponse,
        client,
      )
      return result.data
    },
  })
}

/**
 * Record an APA payment for a whole-yacht booking. Adds to apaPaidAmount.
 * Per-suite bookings reject with 400 (server-side guard).
 */
export function useRecordApaPayment() {
  const { baseUrl, fetcher } = useVoyantChartersContext()
  const client = { baseUrl, fetcher }
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      bookingId,
      input,
    }: {
      bookingId: string
      input: ApaPaymentInput
    }): Promise<BookingCharterDetailRecord> => {
      const result = await fetchWithValidation(
        `/v1/admin/bookings/${encodeURIComponent(bookingId)}/charter-details/apa/payment`,
        charterDetailResponse,
        client,
        { method: "POST", body: JSON.stringify(input) },
      )
      return result.data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        ["voyant", "charters", "booking-details", data.bookingId] as const,
        data,
      )
      void queryClient.invalidateQueries({ queryKey: chartersQueryKeys.all })
    },
  })
}

/**
 * Post-charter APA reconciliation. Records what was actually spent on
 * board + any refund due back to the charterer; optionally settles.
 */
export function useReconcileApa() {
  const { baseUrl, fetcher } = useVoyantChartersContext()
  const client = { baseUrl, fetcher }
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      bookingId,
      input,
    }: {
      bookingId: string
      input: ApaReconcileInput
    }): Promise<BookingCharterDetailRecord> => {
      const result = await fetchWithValidation(
        `/v1/admin/bookings/${encodeURIComponent(bookingId)}/charter-details/apa/reconcile`,
        charterDetailResponse,
        client,
        { method: "POST", body: JSON.stringify(input) },
      )
      return result.data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        ["voyant", "charters", "booking-details", data.bookingId] as const,
        data,
      )
      void queryClient.invalidateQueries({ queryKey: chartersQueryKeys.all })
    },
  })
}
