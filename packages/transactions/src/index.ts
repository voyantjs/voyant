import type { LinkableDefinition, Module } from "@voyantjs/core"
import type { HonoModule } from "@voyantjs/hono/module"

export {
  createTransactionPiiService,
  type TransactionPiiAuditEvent,
  type TransactionPiiServiceOptions,
  type UpsertTransactionParticipantIdentityInput,
} from "./pii.js"

import {
  buildTransactionsRouteRuntime,
  TRANSACTIONS_ROUTE_RUNTIME_CONTAINER_KEY,
} from "./route-runtime.js"
import { transactionsRoutes } from "./routes.js"
import { transactionsService } from "./service.js"

export type { TransactionsRoutes } from "./routes.js"

export const orderLinkable: LinkableDefinition = {
  module: "transactions",
  entity: "order",
  table: "orders",
  idPrefix: "ord",
}

export const offerLinkable: LinkableDefinition = {
  module: "transactions",
  entity: "offer",
  table: "offers",
  idPrefix: "ofr",
}

export const transactionsLinkable = {
  order: orderLinkable,
  offer: offerLinkable,
}

export const transactionsModule: Module = {
  name: "transactions",
  linkable: transactionsLinkable,
}

export function createTransactionsHonoModule(): HonoModule {
  const module: Module = {
    ...transactionsModule,
    bootstrap: ({ bindings, container }) => {
      container.register(
        TRANSACTIONS_ROUTE_RUNTIME_CONTAINER_KEY,
        buildTransactionsRouteRuntime(bindings as Record<string, unknown>),
      )
    },
  }

  return {
    module,
    routes: transactionsRoutes,
  }
}

export const transactionsHonoModule: HonoModule = createTransactionsHonoModule()

export { transactionsBookingExtension } from "./booking-extension.js"
export type { TransactionsRouteRuntime } from "./route-runtime.js"
export {
  buildTransactionsRouteRuntime,
  TRANSACTIONS_ROUTE_RUNTIME_CONTAINER_KEY,
} from "./route-runtime.js"
export type {
  DecryptedTransactionParticipantIdentity,
  TransactionParticipantIdentity,
  TransactionParticipantIdentityEnvelope,
} from "./schema/participant-identity.js"
export {
  decryptedTransactionParticipantIdentitySchema,
  transactionParticipantIdentityEnvelopeSchema,
  transactionParticipantIdentitySchema,
} from "./schema/participant-identity.js"
export type {
  NewOffer,
  NewOfferItem,
  NewOfferItemParticipant,
  NewOfferParticipant,
  NewOrder,
  NewOrderItem,
  NewOrderItemParticipant,
  NewOrderParticipant,
  NewOrderTerm,
  Offer,
  OfferItem,
  OfferItemParticipant,
  OfferParticipant,
  Order,
  OrderItem,
  OrderItemParticipant,
  OrderParticipant,
  OrderTerm,
} from "./schema.js"
export {
  offerItemParticipants,
  offerItems,
  offerParticipants,
  offerStatusEnum,
  offers,
  orderItemParticipants,
  orderItems,
  orderParticipants,
  orderStatusEnum,
  orders,
  orderTermAcceptanceStatusEnum,
  orderTerms,
  orderTermTypeEnum,
  transactionItemParticipantRoleEnum,
  transactionItemStatusEnum,
  transactionItemTypeEnum,
  transactionParticipantTypeEnum,
  transactionPiiAccessActionEnum,
  transactionPiiAccessLog,
  transactionPiiAccessOutcomeEnum,
  transactionTravelerCategoryEnum,
} from "./schema.js"
export {
  createStorefrontPromotionalOffersResolver,
  getStorefrontPromotionalOfferBySlug,
  listStorefrontPromotionalOffers,
  storefrontOfferEnvelopeSchema,
  storefrontPromotionalOfferSchema,
} from "./storefront-offers.js"
export {
  insertOfferItemParticipantSchema,
  insertOfferItemSchema,
  insertOfferParticipantSchema,
  insertOfferSchema,
  insertOrderItemParticipantSchema,
  insertOrderItemSchema,
  insertOrderParticipantSchema,
  insertOrderSchema,
  insertOrderTermSchema,
  offerItemListQuerySchema,
  offerItemParticipantListQuerySchema,
  offerListQuerySchema,
  offerMetadataSchema,
  offerParticipantListQuerySchema,
  offerStatusSchema,
  orderItemListQuerySchema,
  orderItemParticipantListQuerySchema,
  orderListQuerySchema,
  orderParticipantListQuerySchema,
  orderStatusSchema,
  orderTermAcceptanceStatusSchema,
  orderTermListQuerySchema,
  orderTermTypeSchema,
  storefrontOfferDiscountTypeSchema,
  storefrontOfferMetadataSchema,
  transactionItemParticipantRoleSchema,
  transactionItemStatusSchema,
  transactionItemTypeSchema,
  transactionParticipantTypeSchema,
  transactionTravelerCategorySchema,
  updateOfferItemParticipantSchema,
  updateOfferItemSchema,
  updateOfferParticipantSchema,
  updateOfferSchema,
  updateOrderItemParticipantSchema,
  updateOrderItemSchema,
  updateOrderParticipantSchema,
  updateOrderSchema,
  updateOrderTermSchema,
} from "./validation.js"
export { transactionsService }
