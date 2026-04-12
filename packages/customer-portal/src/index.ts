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
  CustomerPortalBookingDetail,
  CustomerPortalBookingDocument,
  CustomerPortalBookingSummary,
  CustomerPortalBootstrapCandidate,
  CustomerPortalCompanion,
  CustomerPortalContactExistsQuery,
  CustomerPortalContactExistsResult,
  CustomerPortalProfile,
  UpdateCustomerPortalCompanionInput,
  UpdateCustomerPortalProfileInput,
} from "./validation-public.js"
export {
  bootstrapCustomerPortalResultSchema,
  bootstrapCustomerPortalSchema,
  createCustomerPortalCompanionSchema,
  customerPortalBookingDetailSchema,
  customerPortalBookingDocumentSchema,
  customerPortalBookingSummarySchema,
  customerPortalBootstrapCandidateSchema,
  customerPortalCompanionSchema,
  customerPortalContactExistsQuerySchema,
  customerPortalContactExistsResultSchema,
  customerPortalProfileSchema,
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
