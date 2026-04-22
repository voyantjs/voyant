import type { z } from "zod"

import type {
  offerContactAssignments,
  offerItemParticipants,
  offerParticipants,
  offerStaffAssignments,
  orderContactAssignments,
  orderItemParticipants,
  orderParticipants,
  orderStaffAssignments,
} from "./schema.js"
import type {
  insertOfferContactAssignmentSchema,
  insertOfferItemSchema,
  insertOfferItemTravelerSchema,
  insertOfferSchema,
  insertOfferStaffAssignmentSchema,
  insertOfferTravelerSchema,
  insertOrderContactAssignmentSchema,
  insertOrderItemSchema,
  insertOrderItemTravelerSchema,
  insertOrderSchema,
  insertOrderStaffAssignmentSchema,
  insertOrderTermSchema,
  insertOrderTravelerSchema,
  offerContactAssignmentListQuerySchema,
  offerItemListQuerySchema,
  offerItemTravelerListQuerySchema,
  offerListQuerySchema,
  offerStaffAssignmentListQuerySchema,
  offerTravelerListQuerySchema,
  orderContactAssignmentListQuerySchema,
  orderItemListQuerySchema,
  orderItemTravelerListQuerySchema,
  orderListQuerySchema,
  orderStaffAssignmentListQuerySchema,
  orderTermListQuerySchema,
  orderTravelerListQuerySchema,
  updateOfferContactAssignmentSchema,
  updateOfferItemSchema,
  updateOfferItemTravelerSchema,
  updateOfferSchema,
  updateOfferStaffAssignmentSchema,
  updateOfferTravelerSchema,
  updateOrderContactAssignmentSchema,
  updateOrderItemSchema,
  updateOrderItemTravelerSchema,
  updateOrderSchema,
  updateOrderStaffAssignmentSchema,
  updateOrderTermSchema,
  updateOrderTravelerSchema,
} from "./validation.js"

export type OfferListQuery = z.infer<typeof offerListQuerySchema>
export type OfferTravelerListQuery = z.infer<typeof offerTravelerListQuerySchema>
export type OfferContactAssignmentListQuery = z.infer<typeof offerContactAssignmentListQuerySchema>
export type OfferStaffAssignmentListQuery = z.infer<typeof offerStaffAssignmentListQuerySchema>
export type OfferItemListQuery = z.infer<typeof offerItemListQuerySchema>
export type OfferItemTravelerListQuery = z.infer<typeof offerItemTravelerListQuerySchema>
export type OrderListQuery = z.infer<typeof orderListQuerySchema>
export type OrderTravelerListQuery = z.infer<typeof orderTravelerListQuerySchema>
export type OrderContactAssignmentListQuery = z.infer<typeof orderContactAssignmentListQuerySchema>
export type OrderStaffAssignmentListQuery = z.infer<typeof orderStaffAssignmentListQuerySchema>
export type OrderItemListQuery = z.infer<typeof orderItemListQuerySchema>
export type OrderItemTravelerListQuery = z.infer<typeof orderItemTravelerListQuerySchema>
export type OrderTermListQuery = z.infer<typeof orderTermListQuerySchema>
export type OfferParticipantListQuery = OfferTravelerListQuery
export type OfferItemParticipantListQuery = OfferItemTravelerListQuery
export type OrderParticipantListQuery = OrderTravelerListQuery
export type OrderItemParticipantListQuery = OrderItemTravelerListQuery

export type CreateOfferInput = z.infer<typeof insertOfferSchema>
export type UpdateOfferInput = z.infer<typeof updateOfferSchema>
export type CreateOfferTravelerInput = z.infer<typeof insertOfferTravelerSchema>
export type UpdateOfferTravelerInput = z.infer<typeof updateOfferTravelerSchema>
export type CreateOfferContactAssignmentInput = z.infer<typeof insertOfferContactAssignmentSchema>
export type UpdateOfferContactAssignmentInput = z.infer<typeof updateOfferContactAssignmentSchema>
export type CreateOfferStaffAssignmentInput = z.infer<typeof insertOfferStaffAssignmentSchema>
export type UpdateOfferStaffAssignmentInput = z.infer<typeof updateOfferStaffAssignmentSchema>
export type CreateOfferItemInput = z.infer<typeof insertOfferItemSchema>
export type UpdateOfferItemInput = z.infer<typeof updateOfferItemSchema>
export type CreateOfferItemTravelerInput = z.infer<typeof insertOfferItemTravelerSchema>
export type UpdateOfferItemTravelerInput = z.infer<typeof updateOfferItemTravelerSchema>
export type CreateOrderInput = z.infer<typeof insertOrderSchema>
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>
export type CreateOrderTravelerInput = z.infer<typeof insertOrderTravelerSchema>
export type UpdateOrderTravelerInput = z.infer<typeof updateOrderTravelerSchema>
export type CreateOrderContactAssignmentInput = z.infer<typeof insertOrderContactAssignmentSchema>
export type UpdateOrderContactAssignmentInput = z.infer<typeof updateOrderContactAssignmentSchema>
export type CreateOrderStaffAssignmentInput = z.infer<typeof insertOrderStaffAssignmentSchema>
export type UpdateOrderStaffAssignmentInput = z.infer<typeof updateOrderStaffAssignmentSchema>
export type CreateOrderItemInput = z.infer<typeof insertOrderItemSchema>
export type UpdateOrderItemInput = z.infer<typeof updateOrderItemSchema>
export type CreateOrderItemTravelerInput = z.infer<typeof insertOrderItemTravelerSchema>
export type UpdateOrderItemTravelerInput = z.infer<typeof updateOrderItemTravelerSchema>
export type CreateOrderTermInput = z.infer<typeof insertOrderTermSchema>
export type UpdateOrderTermInput = z.infer<typeof updateOrderTermSchema>
export type CreateOfferParticipantInput = CreateOfferTravelerInput
export type UpdateOfferParticipantInput = UpdateOfferTravelerInput
export type CreateOfferItemParticipantInput = CreateOfferItemTravelerInput
export type UpdateOfferItemParticipantInput = UpdateOfferItemTravelerInput
export type CreateOrderParticipantInput = CreateOrderTravelerInput
export type UpdateOrderParticipantInput = UpdateOrderTravelerInput
export type CreateOrderItemParticipantInput = CreateOrderItemTravelerInput
export type UpdateOrderItemParticipantInput = UpdateOrderItemTravelerInput
export type OfferBundleTravelerInput = Omit<CreateOfferTravelerInput, "offerId">
export type OfferBundleContactAssignmentInput = Omit<
  CreateOfferContactAssignmentInput,
  "offerId" | "offerItemId"
> & {
  itemIndex?: number | null
}
export type OfferBundleItemInput = Omit<CreateOfferItemInput, "offerId">
export type OfferBundleItemTravelerInput = Omit<
  CreateOfferItemTravelerInput,
  "offerItemId" | "travelerId"
> & {
  itemIndex: number
  participantIndex: number
}
export type CreateOfferBundleInput = {
  offer: CreateOfferInput
  travelers?: OfferBundleTravelerInput[]
  contactAssignments?: OfferBundleContactAssignmentInput[]
  items: OfferBundleItemInput[]
  itemTravelers?: OfferBundleItemTravelerInput[]
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

export function toOfferTravelerResponse(row: typeof offerParticipants.$inferSelect) {
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
export const toOfferParticipantResponse = toOfferTravelerResponse

export function toOfferContactAssignmentResponse(row: typeof offerContactAssignments.$inferSelect) {
  return row
}

export function toOfferStaffAssignmentResponse(row: typeof offerStaffAssignments.$inferSelect) {
  return row
}

export function toOfferItemTravelerResponse(row: typeof offerItemParticipants.$inferSelect) {
  return row
}
export const toOfferItemParticipantResponse = toOfferItemTravelerResponse

export function toOrderTravelerResponse(row: typeof orderParticipants.$inferSelect) {
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
export const toOrderParticipantResponse = toOrderTravelerResponse

export function toOrderContactAssignmentResponse(row: typeof orderContactAssignments.$inferSelect) {
  return row
}

export function toOrderStaffAssignmentResponse(row: typeof orderStaffAssignments.$inferSelect) {
  return row
}

export function toOrderItemTravelerResponse(row: typeof orderItemParticipants.$inferSelect) {
  return row
}
export const toOrderItemParticipantResponse = toOrderItemTravelerResponse

export function toTravelerIdentityResponse<
  T extends {
    travelerId?: string
    participantId?: string
  },
>(row: T) {
  return {
    ...row,
    travelerId: row.travelerId ?? row.participantId!,
  }
}
