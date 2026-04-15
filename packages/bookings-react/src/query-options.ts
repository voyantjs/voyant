"use client"

import { queryOptions } from "@tanstack/react-query"

import { type FetchWithValidationOptions, fetchWithValidation } from "./client.js"
import type { UseBookingOptions } from "./hooks/use-booking.js"
import type { UseBookingActivityOptions } from "./hooks/use-booking-activity.js"
import type { UseBookingItemParticipantsOptions } from "./hooks/use-booking-item-participants.js"
import type { UseBookingItemsOptions } from "./hooks/use-booking-items.js"
import type { UseBookingNotesOptions } from "./hooks/use-booking-notes.js"
import type { UseBookingsOptions } from "./hooks/use-bookings.js"
import type { UsePassengersOptions } from "./hooks/use-passengers.js"
import type { UseSupplierStatusesOptions } from "./hooks/use-supplier-statuses.js"
import { bookingsQueryKeys } from "./query-keys.js"
import {
  bookingActivityResponse,
  bookingItemParticipantsResponse,
  bookingItemsResponse,
  bookingListResponse,
  bookingNotesResponse,
  bookingPassengersResponse,
  bookingSingleResponse,
  bookingSupplierStatusesResponse,
  publicBookingSessionResponse,
  publicBookingSessionStateResponse,
} from "./schemas.js"

export function getBookingsQueryOptions(
  client: FetchWithValidationOptions,
  options: UseBookingsOptions = {},
) {
  const { enabled: _enabled = true, ...filters } = options

  return queryOptions({
    queryKey: bookingsQueryKeys.bookingsList(filters),
    queryFn: () => {
      const params = new URLSearchParams()
      if (filters.status) params.set("status", filters.status)
      if (filters.search) params.set("search", filters.search)
      if (filters.limit !== undefined) params.set("limit", String(filters.limit))
      if (filters.offset !== undefined) params.set("offset", String(filters.offset))
      const qs = params.toString()

      return fetchWithValidation(`/v1/bookings${qs ? `?${qs}` : ""}`, bookingListResponse, client)
    },
  })
}

export function getBookingQueryOptions(
  client: FetchWithValidationOptions,
  id: string | null | undefined,
  options: UseBookingOptions = {},
) {
  const { enabled: _enabled = true } = options

  return queryOptions({
    queryKey: bookingsQueryKeys.booking(id ?? ""),
    queryFn: () => fetchWithValidation(`/v1/bookings/${id}`, bookingSingleResponse, client),
  })
}

export function getBookingItemsQueryOptions(
  client: FetchWithValidationOptions,
  bookingId: string | null | undefined,
  options: UseBookingItemsOptions = {},
) {
  const { enabled: _enabled = true } = options

  return queryOptions({
    queryKey: bookingsQueryKeys.items(bookingId ?? ""),
    queryFn: () =>
      fetchWithValidation(`/v1/bookings/${bookingId}/items`, bookingItemsResponse, client),
  })
}

export function getBookingItemParticipantsQueryOptions(
  client: FetchWithValidationOptions,
  bookingId: string | null | undefined,
  itemId: string | null | undefined,
  options: UseBookingItemParticipantsOptions = {},
) {
  const { enabled: _enabled = true } = options

  return queryOptions({
    queryKey: bookingsQueryKeys.itemParticipants(bookingId ?? "", itemId ?? ""),
    queryFn: () =>
      fetchWithValidation(
        `/v1/bookings/${bookingId}/items/${itemId}/participants`,
        bookingItemParticipantsResponse,
        client,
      ),
  })
}

export function getPassengersQueryOptions(
  client: FetchWithValidationOptions,
  bookingId: string | null | undefined,
  options: UsePassengersOptions = {},
) {
  const { enabled: _enabled = true } = options

  return queryOptions({
    queryKey: bookingsQueryKeys.passengers(bookingId ?? ""),
    queryFn: () =>
      fetchWithValidation(
        `/v1/bookings/${bookingId}/passengers`,
        bookingPassengersResponse,
        client,
      ),
  })
}

export function getSupplierStatusesQueryOptions(
  client: FetchWithValidationOptions,
  bookingId: string | null | undefined,
  options: UseSupplierStatusesOptions = {},
) {
  const { enabled: _enabled = true } = options

  return queryOptions({
    queryKey: bookingsQueryKeys.supplierStatuses(bookingId ?? ""),
    queryFn: () =>
      fetchWithValidation(
        `/v1/bookings/${bookingId}/supplier-statuses`,
        bookingSupplierStatusesResponse,
        client,
      ),
  })
}

export function getBookingActivityQueryOptions(
  client: FetchWithValidationOptions,
  bookingId: string | null | undefined,
  options: UseBookingActivityOptions = {},
) {
  const { enabled: _enabled = true } = options

  return queryOptions({
    queryKey: bookingsQueryKeys.activity(bookingId ?? ""),
    queryFn: () =>
      fetchWithValidation(`/v1/bookings/${bookingId}/activity`, bookingActivityResponse, client),
  })
}

export function getBookingNotesQueryOptions(
  client: FetchWithValidationOptions,
  bookingId: string | null | undefined,
  options: UseBookingNotesOptions = {},
) {
  const { enabled: _enabled = true } = options

  return queryOptions({
    queryKey: bookingsQueryKeys.notes(bookingId ?? ""),
    queryFn: () =>
      fetchWithValidation(`/v1/bookings/${bookingId}/notes`, bookingNotesResponse, client),
  })
}

export function getPublicBookingSessionQueryOptions(
  client: FetchWithValidationOptions,
  sessionId: string | null | undefined,
) {
  return queryOptions({
    queryKey: bookingsQueryKeys.publicSession(sessionId ?? ""),
    queryFn: () =>
      fetchWithValidation(
        `/v1/public/bookings/sessions/${sessionId}`,
        publicBookingSessionResponse,
        client,
      ),
  })
}

export function getPublicBookingSessionStateQueryOptions(
  client: FetchWithValidationOptions,
  sessionId: string | null | undefined,
) {
  return queryOptions({
    queryKey: bookingsQueryKeys.publicSessionState(sessionId ?? ""),
    queryFn: () =>
      fetchWithValidation(
        `/v1/public/bookings/sessions/${sessionId}/state`,
        publicBookingSessionStateResponse,
        client,
      ),
  })
}
