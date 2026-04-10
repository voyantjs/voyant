import { relations } from "drizzle-orm"

import { offerItemParticipants, offerItems, offerParticipants, offers } from "./schema-offers"
import {
  orderItemParticipants,
  orderItems,
  orderParticipants,
  orders,
  orderTerms,
} from "./schema-orders"

export const offersRelations = relations(offers, ({ many }) => ({
  participants: many(offerParticipants),
  items: many(offerItems),
  orders: many(orders),
  terms: many(orderTerms),
}))

export const offerParticipantsRelations = relations(offerParticipants, ({ one, many }) => ({
  offer: one(offers, { fields: [offerParticipants.offerId], references: [offers.id] }),
  itemLinks: many(offerItemParticipants),
}))

export const offerItemsRelations = relations(offerItems, ({ one, many }) => ({
  offer: one(offers, { fields: [offerItems.offerId], references: [offers.id] }),
  participants: many(offerItemParticipants),
}))

export const offerItemParticipantsRelations = relations(offerItemParticipants, ({ one }) => ({
  offerItem: one(offerItems, {
    fields: [offerItemParticipants.offerItemId],
    references: [offerItems.id],
  }),
  participant: one(offerParticipants, {
    fields: [offerItemParticipants.participantId],
    references: [offerParticipants.id],
  }),
}))

export const ordersRelations = relations(orders, ({ one, many }) => ({
  offer: one(offers, { fields: [orders.offerId], references: [offers.id] }),
  participants: many(orderParticipants),
  items: many(orderItems),
  terms: many(orderTerms),
}))

export const orderParticipantsRelations = relations(orderParticipants, ({ one, many }) => ({
  order: one(orders, { fields: [orderParticipants.orderId], references: [orders.id] }),
  itemLinks: many(orderItemParticipants),
}))

export const orderItemsRelations = relations(orderItems, ({ one, many }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  offerItem: one(offerItems, { fields: [orderItems.offerItemId], references: [offerItems.id] }),
  participants: many(orderItemParticipants),
}))

export const orderItemParticipantsRelations = relations(orderItemParticipants, ({ one }) => ({
  orderItem: one(orderItems, {
    fields: [orderItemParticipants.orderItemId],
    references: [orderItems.id],
  }),
  participant: one(orderParticipants, {
    fields: [orderItemParticipants.participantId],
    references: [orderParticipants.id],
  }),
}))

export const orderTermsRelations = relations(orderTerms, ({ one }) => ({
  offer: one(offers, { fields: [orderTerms.offerId], references: [offers.id] }),
  order: one(orders, { fields: [orderTerms.orderId], references: [orders.id] }),
}))
