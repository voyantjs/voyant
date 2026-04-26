import type { LinkableDefinition, Module } from "@voyantjs/core"
import type { HonoModule } from "@voyantjs/hono/module"

import { chartersAdminRoutes } from "./routes.js"
import { chartersPublicRoutes } from "./routes-public.js"

// Booking extension (1:1 with bookings — populated when a booking is for a charter).
export {
  type BookingCharterDetail,
  bookingCharterDetails,
  bookingCharterDetailsService,
  type CharterDetailUpsert,
  type CharterSourceRef,
  charterDetailUpsertSchema,
  chartersBookingExtension,
  chartersBookingExtensionRoutes,
  type NewBookingCharterDetail,
} from "./booking-extension.js"
// Routes — admin + public.
export type { ChartersAdminRoutes } from "./routes.js"
export { chartersAdminRoutes } from "./routes.js"
export type { ChartersPublicRoutes } from "./routes-public.js"
export { chartersPublicRoutes } from "./routes-public.js"
export { chartersService } from "./service.js"
// Booking creation entry points + supporting types.
export {
  type CharterContact,
  type CharterGuest,
  type CreatePerSuiteBookingInput,
  type CreatePerSuiteBookingResult,
  type CreateWholeYachtBookingInput,
  type CreateWholeYachtBookingResult,
  chartersBookingService,
} from "./service-bookings.js"
// MYBA contract wrapper (DI-shaped, no hard dep on @voyantjs/legal).
export {
  type CharterContractsService,
  type GenerateMybaContractInput,
  type GenerateMybaContractResult,
  mybaService,
} from "./service-myba.js"
export {
  composePerSuiteQuote,
  composeWholeYachtQuote,
  computeApaAmount,
  FIRST_CLASS_CURRENCIES,
  type FirstClassCurrency,
  type PerSuiteQuote,
  pricingService,
  type WholeYachtQuote,
} from "./service-pricing.js"

// Linkables for cross-module links from a template's links/ directory.
export const charterProductLinkable: LinkableDefinition = {
  module: "charters",
  entity: "charter_product",
  table: "charter_products",
  idPrefix: "chrt",
}

export const charterVoyageLinkable: LinkableDefinition = {
  module: "charters",
  entity: "charter_voyage",
  table: "charter_voyages",
  idPrefix: "chrv",
}

export const charterYachtLinkable: LinkableDefinition = {
  module: "charters",
  entity: "charter_yacht",
  table: "charter_yachts",
  idPrefix: "chry",
}

export const chartersModule: Module = {
  name: "charters",
  linkable: {
    charter_product: charterProductLinkable,
    charter_voyage: charterVoyageLinkable,
    charter_yacht: charterYachtLinkable,
  },
}

export const chartersHonoModule: HonoModule = {
  module: chartersModule,
  adminRoutes: chartersAdminRoutes,
  publicRoutes: chartersPublicRoutes,
}

// Unified key parser (admin routes accept TypeIDs or `<provider>:<ref>`).
export { type ParsedKey, parseUnifiedKey } from "./lib/key.js"
// Schema re-exports (mirrors packages/cruises pattern).
export type {
  CharterProduct,
  CharterVoyage,
  NewCharterProduct,
  NewCharterVoyage,
} from "./schema-core.js"
export { charterProducts, charterVoyages } from "./schema-core.js"
export type { CharterScheduleDay, NewCharterScheduleDay } from "./schema-itinerary.js"
export { charterScheduleDays } from "./schema-itinerary.js"
export type { CharterSuite, NewCharterSuite } from "./schema-pricing.js"
export { charterSuites } from "./schema-pricing.js"
export {
  charterBookingModeEnum,
  charterSourceEnum,
  charterStatusEnum,
  suiteAvailabilityEnum,
  suiteCategoryEnum,
  voyageSalesStatusEnum,
  yachtClassEnum,
} from "./schema-shared.js"
export type { CharterYacht, NewCharterYacht } from "./schema-yachts.js"
export { charterYachts } from "./schema-yachts.js"
