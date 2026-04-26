"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { fetchWithValidation } from "../client.js"
import { useVoyantBookingsContext } from "../provider.js"
import { bookingsQueryKeys } from "../query-keys.js"
import { type BookingRecord, bookingSingleResponse } from "../schemas.js"

type BookingStatus = BookingRecord["status"]

export interface UpdateBookingStatusInput {
  /**
   * Current status — required for client-side dispatch to the right verb
   * endpoint. The dialog has this in its props; pass it through.
   */
  currentStatus: BookingStatus
  status: BookingStatus
  note?: string | null
}

interface DispatchTarget {
  path: string
  body: Record<string, unknown>
}

/**
 * Map (currentStatus, targetStatus) → which verb endpoint to call. Lifecycle
 * arrows that have a named verb on the server go to that verb; everything else
 * (non-adjacent jumps, e.g. cancelled → confirmed for data correction) falls
 * through to /override-status, which requires a reason. We use the operator's
 * note text as the reason — the server rejects empty reasons with a 400.
 */
function dispatchStatusChange(
  bookingId: string,
  current: BookingStatus,
  target: BookingStatus,
  note: string | null | undefined,
): DispatchTarget {
  const noteBody = note ? { note } : {}

  if (current === "on_hold" && target === "confirmed") {
    return { path: `/v1/bookings/${bookingId}/confirm`, body: noteBody }
  }
  if (current === "on_hold" && target === "expired") {
    return { path: `/v1/bookings/${bookingId}/expire`, body: noteBody }
  }
  if (current === "confirmed" && target === "in_progress") {
    return { path: `/v1/bookings/${bookingId}/start`, body: noteBody }
  }
  if (current === "in_progress" && target === "completed") {
    return { path: `/v1/bookings/${bookingId}/complete`, body: noteBody }
  }
  if (
    target === "cancelled" &&
    (current === "draft" ||
      current === "on_hold" ||
      current === "confirmed" ||
      current === "in_progress")
  ) {
    return { path: `/v1/bookings/${bookingId}/cancel`, body: noteBody }
  }

  return {
    path: `/v1/bookings/${bookingId}/override-status`,
    body: { status: target, reason: note ?? "", ...(note ? { note } : {}) },
  }
}

export function useBookingStatusMutation(bookingId: string) {
  const { baseUrl, fetcher } = useVoyantBookingsContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateBookingStatusInput) => {
      const target = dispatchStatusChange(bookingId, input.currentStatus, input.status, input.note)
      const { data } = await fetchWithValidation(
        target.path,
        bookingSingleResponse,
        { baseUrl, fetcher },
        { method: "POST", body: JSON.stringify(target.body) },
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
    mutationFn: async ({
      bookingId,
      currentStatus,
      status,
      note,
    }: UpdateBookingStatusByIdInput) => {
      const target = dispatchStatusChange(bookingId, currentStatus, status, note)
      const { data } = await fetchWithValidation(
        target.path,
        bookingSingleResponse,
        { baseUrl, fetcher },
        { method: "POST", body: JSON.stringify(target.body) },
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
