import type { LinkableDefinition, Module } from "@voyantjs/core"
import type { HonoModule } from "@voyantjs/hono/module"

import { cruiseAdminRoutes } from "./routes.js"
import { cruisePublicRoutes } from "./routes-public.js"

export {
  type BookingCruiseDetail,
  type BookingGroupCruiseDetail,
  bookingCruiseDetails,
  bookingCruiseDetailsService,
  bookingGroupCruiseDetails,
  bookingGroupCruiseDetailsService,
  cruiseBookingModeEnum,
  cruisesBookingExtension,
  cruisesBookingExtensionRoutes,
  type NewBookingCruiseDetail,
  type NewBookingGroupCruiseDetail,
} from "./booking-extension.js"
export type { CruiseAdminRoutes } from "./routes.js"
export { cruiseAdminRoutes } from "./routes.js"
export type { CruisePublicRoutes } from "./routes-public.js"
export { cruisePublicRoutes } from "./routes-public.js"
export type { EffectiveItineraryDay } from "./service.js"
export { cruisesService } from "./service.js"
export {
  type CreateCruiseBookingInput,
  type CreateCruiseBookingResult,
  type CreateCruisePartyBookingInput,
  type CreateCruisePartyBookingResult,
  type CruiseBookingContact,
  type CruiseBookingMode,
  type CruiseBookingPassenger,
  type CruisePartyCabinEntry,
  cruisesBookingService,
} from "./service-bookings.js"
export {
  type ComposeQuoteInput,
  composeQuote,
  type GridCell,
  type LowestPriceResult,
  pricingService,
  type Quote,
  type QuoteComponent,
} from "./service-pricing.js"

// Linkable definitions for cross-module links from a template's links/ directory.
export const cruiseLinkable: LinkableDefinition = {
  module: "cruises",
  entity: "cruise",
  table: "cruises",
  idPrefix: "cru",
}

export const cruiseSailingLinkable: LinkableDefinition = {
  module: "cruises",
  entity: "cruise_sailing",
  table: "cruise_sailings",
  idPrefix: "crsl",
}

export const cruiseShipLinkable: LinkableDefinition = {
  module: "cruises",
  entity: "cruise_ship",
  table: "cruise_ships",
  idPrefix: "crsh",
}

export const cruisesModule: Module = {
  name: "cruises",
  linkable: {
    cruise: cruiseLinkable,
    cruise_sailing: cruiseSailingLinkable,
    cruise_ship: cruiseShipLinkable,
  },
}

export const cruisesHonoModule: HonoModule = {
  module: cruisesModule,
  adminRoutes: cruiseAdminRoutes,
  publicRoutes: cruisePublicRoutes,
}

export type {
  CruiseCabin,
  CruiseCabinCategory,
  CruiseDeck,
  CruiseShip,
  NewCruiseCabin,
  NewCruiseCabinCategory,
  NewCruiseDeck,
  NewCruiseShip,
} from "./schema-cabins.js"
export {
  cruiseCabinCategories,
  cruiseCabins,
  cruiseDecks,
  cruiseShips,
} from "./schema-cabins.js"
export type {
  CruiseInclusion,
  CruiseMedia,
  NewCruiseInclusion,
  NewCruiseMedia,
} from "./schema-content.js"
export {
  cruiseInclusions,
  cruiseMedia,
} from "./schema-content.js"
// Schema and validation re-exports — keep these in sync with package.json `exports`.
export type {
  Cruise,
  CruiseSailing,
  NewCruise,
  NewCruiseSailing,
} from "./schema-core.js"
export {
  cruiseSailings,
  cruises,
} from "./schema-core.js"
export type {
  CruiseDay,
  CruiseSailingDay,
  NewCruiseDay,
  NewCruiseSailingDay,
} from "./schema-itinerary.js"
export {
  cruiseDays,
  cruiseSailingDays,
} from "./schema-itinerary.js"
export type {
  CruisePrice,
  CruisePriceComponent,
  NewCruisePrice,
  NewCruisePriceComponent,
} from "./schema-pricing.js"
export {
  cruisePriceComponents,
  cruisePrices,
} from "./schema-pricing.js"
export type {
  CruiseSearchIndexRow,
  NewCruiseSearchIndexRow,
} from "./schema-search.js"
export { cruiseSearchIndex } from "./schema-search.js"
export {
  cabinRoomTypeEnum,
  cruiseInclusionKindEnum,
  cruiseMediaTypeEnum,
  cruiseSourceEnum,
  cruiseStatusEnum,
  cruiseTypeEnum,
  priceAvailabilityEnum,
  priceComponentDirectionEnum,
  priceComponentKindEnum,
  sailingSalesStatusEnum,
  shipTypeEnum,
} from "./schema-shared.js"
