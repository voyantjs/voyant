import type { z } from "zod"

import type { offerParticipants, orderParticipants } from "./schema.js"
import type {
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
  orderItemListQuerySchema,
  orderItemParticipantListQuerySchema,
  orderListQuerySchema,
  orderParticipantListQuerySchema,
  orderTermListQuerySchema,
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

export type OfferListQuery = z.infer<typeof offerListQuerySchema>
export type OfferParticipantListQuery = z.infer<typeof offerParticipantListQuerySchema>
export type OfferItemListQuery = z.infer<typeof offerItemListQuerySchema>
export type OfferItemParticipantListQuery = z.infer<typeof offerItemParticipantListQuerySchema>
export type OrderListQuery = z.infer<typeof orderListQuerySchema>
export type OrderParticipantListQuery = z.infer<typeof orderParticipantListQuerySchema>
export type OrderItemListQuery = z.infer<typeof orderItemListQuerySchema>
export type OrderItemParticipantListQuery = z.infer<typeof orderItemParticipantListQuerySchema>
export type OrderTermListQuery = z.infer<typeof orderTermListQuerySchema>

export type CreateOfferInput = z.infer<typeof insertOfferSchema>
export type UpdateOfferInput = z.infer<typeof updateOfferSchema>
export type CreateOfferParticipantInput = z.infer<typeof insertOfferParticipantSchema>
export type UpdateOfferParticipantInput = z.infer<typeof updateOfferParticipantSchema>
export type CreateOfferItemInput = z.infer<typeof insertOfferItemSchema>
export type UpdateOfferItemInput = z.infer<typeof updateOfferItemSchema>
export type CreateOfferItemParticipantInput = z.infer<typeof insertOfferItemParticipantSchema>
export type UpdateOfferItemParticipantInput = z.infer<typeof updateOfferItemParticipantSchema>
export type CreateOrderInput = z.infer<typeof insertOrderSchema>
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>
export type CreateOrderParticipantInput = z.infer<typeof insertOrderParticipantSchema>
export type UpdateOrderParticipantInput = z.infer<typeof updateOrderParticipantSchema>
export type CreateOrderItemInput = z.infer<typeof insertOrderItemSchema>
export type UpdateOrderItemInput = z.infer<typeof updateOrderItemSchema>
export type CreateOrderItemParticipantInput = z.infer<typeof insertOrderItemParticipantSchema>
export type UpdateOrderItemParticipantInput = z.infer<typeof updateOrderItemParticipantSchema>
export type CreateOrderTermInput = z.infer<typeof insertOrderTermSchema>
export type UpdateOrderTermInput = z.infer<typeof updateOrderTermSchema>
export type OfferBundleParticipantInput = Omit<CreateOfferParticipantInput, "offerId">
export type OfferBundleItemInput = Omit<CreateOfferItemInput, "offerId">
export type OfferBundleItemParticipantInput = Omit<
  CreateOfferItemParticipantInput,
  "offerItemId" | "participantId"
> & {
  itemIndex: number
  participantIndex: number
}
export type CreateOfferBundleInput = {
  offer: CreateOfferInput
  participants?: OfferBundleParticipantInput[]
  items: OfferBundleItemInput[]
  itemParticipants?: OfferBundleItemParticipantInput[]
}

export async function paginate<T extends object>(
  rowsQuery: Promise<T[]>,
  countQuery: Promise<Array<{ count: number }>>,
  limit: number,
  offset: number,
) {
  const [data, countResult] = await Promise.all([rowsQuery, countQuery])
  return { data, total: countResult[0]?.count ?? 0, limit, offset }
}

export function normalizeTimestamp(value: string | null | undefined) {
  if (value === undefined || value === "") return undefined
  if (value === null) return null
  return new Date(value)
}

export function toOfferParticipantResponse(row: typeof offerParticipants.$inferSelect) {
  return {
    id: row.id,
    offerId: row.offerId,
    personId: row.personId,
    participantType: row.participantType,
    travelerCategory: row.travelerCategory,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    phone: row.phone,
    preferredLanguage: row.preferredLanguage,
    isPrimary: row.isPrimary,
    notes: row.notes,
    hasTravelIdentity: Boolean(row.identityEncrypted),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export function toOrderParticipantResponse(row: typeof orderParticipants.$inferSelect) {
  return {
    id: row.id,
    orderId: row.orderId,
    personId: row.personId,
    participantType: row.participantType,
    travelerCategory: row.travelerCategory,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    phone: row.phone,
    preferredLanguage: row.preferredLanguage,
    isPrimary: row.isPrimary,
    notes: row.notes,
    hasTravelIdentity: Boolean(row.identityEncrypted),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}
