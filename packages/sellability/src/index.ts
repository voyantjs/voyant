import type { Module } from "@voyantjs/core"
import type { HonoModule } from "@voyantjs/hono/module"

import { sellabilityRoutes } from "./routes.js"
import { sellabilityService } from "./service.js"

export type { SellabilityRoutes } from "./routes.js"

export const sellabilityModule: Module = {
  name: "sellability",
}

export const sellabilityHonoModule: HonoModule = {
  module: sellabilityModule,
  routes: sellabilityRoutes,
}

export type {
  NewOfferExpirationEvent,
  NewOfferRefreshRun,
  NewSellabilityExplanation,
  NewSellabilityPolicy,
  NewSellabilityPolicyResult,
  NewSellabilitySnapshot,
  NewSellabilitySnapshotItem,
  OfferExpirationEvent,
  OfferRefreshRun,
  SellabilityExplanation,
  SellabilityPolicy,
  SellabilityPolicyResult,
  SellabilitySnapshot,
  SellabilitySnapshotItem,
} from "./schema.js"
export {
  offerExpirationEventStatusEnum,
  offerExpirationEvents,
  offerRefreshRunStatusEnum,
  offerRefreshRuns,
  sellabilityExplanations,
  sellabilityExplanationTypeEnum,
  sellabilityPolicies,
  sellabilityPolicyResultStatusEnum,
  sellabilityPolicyResults,
  sellabilityPolicyScopeEnum,
  sellabilityPolicyTypeEnum,
  sellabilitySnapshotComponentKindEnum,
  sellabilitySnapshotItems,
  sellabilitySnapshotStatusEnum,
  sellabilitySnapshots,
} from "./schema.js"
export {
  insertOfferExpirationEventSchema,
  insertOfferRefreshRunSchema,
  insertSellabilityExplanationSchema,
  insertSellabilityPolicyResultSchema,
  insertSellabilityPolicySchema,
  offerExpirationEventListQuerySchema,
  offerExpirationEventStatusSchema,
  offerRefreshRunListQuerySchema,
  offerRefreshRunStatusSchema,
  sellabilityConstructOfferSchema,
  sellabilityExplanationListQuerySchema,
  sellabilityExplanationTypeSchema,
  sellabilityOfferParticipantSchema,
  sellabilityPersistSnapshotSchema,
  sellabilityPolicyListQuerySchema,
  sellabilityPolicyResultListQuerySchema,
  sellabilityPolicyResultStatusSchema,
  sellabilityPolicyScopeSchema,
  sellabilityPolicyTypeSchema,
  sellabilityResolveQuerySchema,
  sellabilitySnapshotItemListQuerySchema,
  sellabilitySnapshotListQuerySchema,
  sellabilitySnapshotStatusSchema,
  updateOfferExpirationEventSchema,
  updateOfferRefreshRunSchema,
  updateSellabilityExplanationSchema,
  updateSellabilityPolicyResultSchema,
  updateSellabilityPolicySchema,
} from "./validation.js"
export { sellabilityService }
