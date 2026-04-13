export {
  defaultFetcher,
  fetchWithValidation,
  VoyantApiError,
  type VoyantFetcher,
  withQueryParams,
} from "./client.js"
export * from "./hooks/index.js"
export {
  bootstrapCustomerPortal,
  createCustomerPortalCompanion,
  deleteCustomerPortalCompanion,
  getCustomerPortalBooking,
  getCustomerPortalContactExists,
  getCustomerPortalPhoneContactExists,
  getCustomerPortalProfile,
  listCustomerPortalBookingDocuments,
  listCustomerPortalBookings,
  listCustomerPortalCompanions,
  updateCustomerPortalCompanion,
  updateCustomerPortalProfile,
} from "./operations.js"
export {
  useVoyantCustomerPortalContext,
  type VoyantCustomerPortalContextValue,
  VoyantCustomerPortalProvider,
  type VoyantCustomerPortalProviderProps,
} from "./provider.js"
export type {
  CustomerPortalContactExistsFilters,
  CustomerPortalPhoneContactExistsFilters,
} from "./query-keys.js"
export { customerPortalQueryKeys } from "./query-keys.js"
export {
  getCustomerPortalBookingDocumentsQueryOptions,
  getCustomerPortalBookingQueryOptions,
  getCustomerPortalBookingsQueryOptions,
  getCustomerPortalCompanionsQueryOptions,
  getCustomerPortalContactExistsQueryOptions,
  getCustomerPortalPhoneContactExistsQueryOptions,
  getCustomerPortalProfileQueryOptions,
} from "./query-options.js"
export * from "./schemas.js"
