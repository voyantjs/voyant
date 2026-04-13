"use client"

import { type FetchWithValidationOptions, fetchWithValidation, withQueryParams } from "./client.js"
import {
  type PublicStartPaymentSessionInput,
  type PublicValidateVoucherInput,
  publicBookingFinanceDocumentsResponse,
  publicBookingPaymentOptionsResponse,
  publicPaymentSessionResponse,
  publicVoucherValidationResponse,
} from "./schemas.js"

export function getPublicBookingDocuments(client: FetchWithValidationOptions, bookingId: string) {
  return fetchWithValidation(
    `/v1/public/finance/bookings/${bookingId}/documents`,
    publicBookingFinanceDocumentsResponse,
    client,
  )
}

export function getPublicBookingPaymentOptions(
  client: FetchWithValidationOptions,
  bookingId: string,
  filters?: {
    personId?: string
    organizationId?: string
    provider?: string
    instrumentType?: string
    includeInactive?: boolean
  },
) {
  return fetchWithValidation(
    withQueryParams(`/v1/public/finance/bookings/${bookingId}/payment-options`, filters),
    publicBookingPaymentOptionsResponse,
    client,
  )
}

export function getPublicPaymentSession(client: FetchWithValidationOptions, sessionId: string) {
  return fetchWithValidation(
    `/v1/public/finance/payment-sessions/${sessionId}`,
    publicPaymentSessionResponse,
    client,
  )
}

export function startPublicBookingSchedulePaymentSession(
  client: FetchWithValidationOptions,
  bookingId: string,
  scheduleId: string,
  input: PublicStartPaymentSessionInput,
) {
  return fetchWithValidation(
    `/v1/public/finance/bookings/${bookingId}/payment-schedules/${scheduleId}/payment-session`,
    publicPaymentSessionResponse,
    client,
    { method: "POST", body: JSON.stringify(input) },
  )
}

export function startPublicBookingGuaranteePaymentSession(
  client: FetchWithValidationOptions,
  bookingId: string,
  guaranteeId: string,
  input: PublicStartPaymentSessionInput,
) {
  return fetchWithValidation(
    `/v1/public/finance/bookings/${bookingId}/guarantees/${guaranteeId}/payment-session`,
    publicPaymentSessionResponse,
    client,
    { method: "POST", body: JSON.stringify(input) },
  )
}

export function validatePublicVoucher(
  client: FetchWithValidationOptions,
  input: PublicValidateVoucherInput,
) {
  return fetchWithValidation(
    "/v1/public/finance/vouchers/validate",
    publicVoucherValidationResponse,
    client,
    { method: "POST", body: JSON.stringify(input) },
  )
}
