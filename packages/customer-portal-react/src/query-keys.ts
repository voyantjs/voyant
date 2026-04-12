export interface CustomerPortalContactExistsFilters {
  email: string
}

export const customerPortalQueryKeys = {
  all: ["customer-portal"] as const,
  profile: () => [...customerPortalQueryKeys.all, "profile"] as const,
  companions: () => [...customerPortalQueryKeys.all, "companions"] as const,
  bookings: () => [...customerPortalQueryKeys.all, "bookings"] as const,
  booking: (bookingId: string) => [...customerPortalQueryKeys.bookings(), bookingId] as const,
  bookingDocuments: (bookingId: string) =>
    [...customerPortalQueryKeys.booking(bookingId), "documents"] as const,
  contactExists: () => [...customerPortalQueryKeys.all, "contact-exists"] as const,
  contactExistsLookup: (filters: CustomerPortalContactExistsFilters) =>
    [...customerPortalQueryKeys.contactExists(), filters] as const,
}
