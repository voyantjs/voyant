import type { Module } from "@voyantjs/core"
import type { HonoModule } from "@voyantjs/hono/module"

import { customerPortalRoutes } from "./routes.js"
import { publicCustomerPortalRoutes } from "./routes-public.js"

export type { CustomerPortalRoutes } from "./routes.js"
export { customerPortalRoutes } from "./routes.js"
export type { PublicCustomerPortalRoutes } from "./routes-public.js"
export { publicCustomerPortalRoutes } from "./routes-public.js"
export { publicCustomerPortalService } from "./service-public.js"
export type {
  BootstrapCustomerPortalInput,
  BootstrapCustomerPortalResult,
  CreateCustomerPortalCompanionInput,
  CustomerPortalAddress,
  CustomerPortalBookingBillingContact,
  CustomerPortalBookingDetail,
  CustomerPortalBookingDocument,
  CustomerPortalBookingFinancialDocument,
  CustomerPortalBookingFinancials,
  CustomerPortalBookingPayment,
  CustomerPortalBookingSummary,
  CustomerPortalBootstrapCandidate,
  CustomerPortalCompanion,
  CustomerPortalContactExistsQuery,
  CustomerPortalContactExistsResult,
  CustomerPortalPhoneContactExistsQuery,
  CustomerPortalPhoneContactExistsResult,
  CustomerPortalProfile,
  ImportCustomerPortalBookingParticipantsInput,
  ImportCustomerPortalBookingParticipantsResult,
  UpdateCustomerPortalAddressInput,
  UpdateCustomerPortalCompanionInput,
  UpdateCustomerPortalProfileInput,
} from "./validation-public.js"
export {
  bootstrapCustomerPortalResultSchema,
  bootstrapCustomerPortalSchema,
  createCustomerPortalCompanionSchema,
  customerPortalAddressSchema,
  customerPortalBookingBillingContactSchema,
  customerPortalBookingDetailSchema,
  customerPortalBookingDocumentSchema,
  customerPortalBookingFinancialDocumentSchema,
  customerPortalBookingFinancialsSchema,
  customerPortalBookingPaymentSchema,
  customerPortalBookingSummarySchema,
  customerPortalBootstrapCandidateSchema,
  customerPortalCompanionSchema,
  customerPortalContactExistsQuerySchema,
  customerPortalContactExistsResultSchema,
  customerPortalPhoneContactExistsQuerySchema,
  customerPortalPhoneContactExistsResultSchema,
  customerPortalProfileSchema,
  importCustomerPortalBookingParticipantsResultSchema,
  importCustomerPortalBookingParticipantsSchema,
  updateCustomerPortalAddressSchema,
  updateCustomerPortalCompanionSchema,
  updateCustomerPortalProfileSchema,
} from "./validation-public.js"

export const customerPortalModule: Module = {
  name: "customer-portal",
}

export const customerPortalHonoModule: HonoModule = {
  module: customerPortalModule,
  routes: customerPortalRoutes,
  publicRoutes: publicCustomerPortalRoutes,
}
