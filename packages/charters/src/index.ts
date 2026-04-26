import type { LinkableDefinition, Module } from "@voyantjs/core"

export { chartersService } from "./service.js"

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
