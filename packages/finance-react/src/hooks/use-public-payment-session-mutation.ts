"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import {
  startPublicBookingGuaranteePaymentSession,
  startPublicBookingSchedulePaymentSession,
} from "../operations.js"
import { useVoyantFinanceContext } from "../provider.js"
import { financeQueryKeys } from "../query-keys.js"
import type { PublicStartPaymentSessionInput } from "../schemas.js"

export type StartPublicPaymentSessionTarget =
  | {
      targetType: "booking_payment_schedule"
      bookingId: string
      targetId: string
      input: PublicStartPaymentSessionInput
    }
  | {
      targetType: "booking_guarantee"
      bookingId: string
      targetId: string
      input: PublicStartPaymentSessionInput
    }

export function usePublicPaymentSessionMutation() {
  const { baseUrl, fetcher } = useVoyantFinanceContext()
  const queryClient = useQueryClient()
  const client = { baseUrl, fetcher }

  return useMutation({
    mutationFn: async (payload: StartPublicPaymentSessionTarget) => {
      switch (payload.targetType) {
        case "booking_payment_schedule":
          return startPublicBookingSchedulePaymentSession(
            client,
            payload.bookingId,
            payload.targetId,
            payload.input,
          )
        case "booking_guarantee":
          return startPublicBookingGuaranteePaymentSession(
            client,
            payload.bookingId,
            payload.targetId,
            payload.input,
          )
      }
    },
    onSuccess: async (result, payload) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: financeQueryKeys.publicPaymentSession(result.data.id),
        }),
        queryClient.invalidateQueries({
          queryKey: financeQueryKeys.publicCheckout(),
        }),
        queryClient.invalidateQueries({
          queryKey: financeQueryKeys.publicBookingPaymentOptions(payload.bookingId, {}),
        }),
      ])
    },
  })
}
