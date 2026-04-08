import type { LinkableDefinition, Module } from "@voyantjs/core"
import type { HonoModule } from "@voyantjs/hono/module"

export {
  createTransactionPiiService,
  type TransactionPiiAuditEvent,
  type TransactionPiiServiceOptions,
  type UpsertTransactionParticipantIdentityInput,
} from "./pii.js"
import { transactionsRoutes } from "./routes.js"
import { transactionsService } from "./service.js"

export type { TransactionsRoutes } from "./routes.js"

export const orderLinkable: LinkableDefinition = {
  module: "transactions",
  entity: "order",
  table: "orders",
  idPrefix: "ordr",
}

export const offerLinkable: LinkableDefinition = {
  module: "transactions",
  entity: "offer",
  table: "offers",
  idPrefix: "offr",
}

export const transactionsLinkable = {
  order: orderLinkable,
  offer: offerLinkable,
}

export const transactionsModule: Module = {
  name: "transactions",
  linkable: transactionsLinkable,
}

export const transactionsHonoModule: HonoModule = {
  module: transactionsModule,
  routes: transactionsRoutes,
}

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
  transactionPiiAccessActionEnum,
  transactionPiiAccessLog,
  transactionPiiAccessOutcomeEnum,
  transactionItemParticipantRoleEnum,
  transactionItemStatusEnum,
  transactionItemTypeEnum,
  transactionParticipantTypeEnum,
  transactionTravelerCategoryEnum,
} from "./schema.js"
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
export { transactionsService }
export { transactionsBookingExtension } from "./booking-extension.js"
