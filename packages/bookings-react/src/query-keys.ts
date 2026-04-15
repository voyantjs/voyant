export interface BookingsListFilters {
  status?: string | undefined
  search?: string | undefined
  limit?: number | undefined
  offset?: number | undefined
}

export const bookingsQueryKeys = {
  all: ["voyant", "bookings"] as const,

  bookings: () => [...bookingsQueryKeys.all, "bookings"] as const,
  publicSessions: () => [...bookingsQueryKeys.all, "public-sessions"] as const,
  bookingsList: (filters: BookingsListFilters) =>
    [...bookingsQueryKeys.bookings(), "list", filters] as const,
  booking: (id: string) => [...bookingsQueryKeys.bookings(), "detail", id] as const,
  publicSession: (sessionId: string) =>
    [...bookingsQueryKeys.publicSessions(), "detail", sessionId] as const,
  publicSessionState: (sessionId: string) =>
    [...bookingsQueryKeys.publicSession(sessionId), "state"] as const,

  items: (bookingId: string) => [...bookingsQueryKeys.booking(bookingId), "items"] as const,
  passengers: (bookingId: string) =>
    [...bookingsQueryKeys.booking(bookingId), "passengers"] as const,
  supplierStatuses: (bookingId: string) =>
    [...bookingsQueryKeys.booking(bookingId), "supplier-statuses"] as const,
  activity: (bookingId: string) => [...bookingsQueryKeys.booking(bookingId), "activity"] as const,
  notes: (bookingId: string) => [...bookingsQueryKeys.booking(bookingId), "notes"] as const,
} as const
