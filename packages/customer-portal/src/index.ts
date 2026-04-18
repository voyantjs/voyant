import type { Module } from "@voyantjs/core"
import type { HonoModule } from "@voyantjs/hono/module"

import {
  buildCustomerPortalRouteRuntime,
  CUSTOMER_PORTAL_ROUTE_RUNTIME_CONTAINER_KEY,
} from "./route-runtime.js"
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

export function createCustomerPortalHonoModule(): HonoModule {
  const module: Module = {
    ...customerPortalModule,
    bootstrap: ({ bindings, container }) => {
      container.register(
        CUSTOMER_PORTAL_ROUTE_RUNTIME_CONTAINER_KEY,
        buildCustomerPortalRouteRuntime(bindings as Record<string, unknown>),
      )
    },
  }

  return {
    module,
    routes: customerPortalRoutes,
    publicRoutes: publicCustomerPortalRoutes,
  }
}

export const customerPortalHonoModule: HonoModule = createCustomerPortalHonoModule()
export type { CustomerPortalRouteRuntime } from "./route-runtime.js"
export {
  buildCustomerPortalRouteRuntime,
  CUSTOMER_PORTAL_ROUTE_RUNTIME_CONTAINER_KEY,
} from "./route-runtime.js"
