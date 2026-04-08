import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import type { z } from "zod"

import {
  offerItemParticipants,
  offerItems,
  offerParticipants,
  offers,
  orderItemParticipants,
  orderItems,
  orderParticipants,
  orders,
  orderTerms,
} from "./schema.js"
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

type OfferListQuery = z.infer<typeof offerListQuerySchema>
type OfferParticipantListQuery = z.infer<typeof offerParticipantListQuerySchema>
type OfferItemListQuery = z.infer<typeof offerItemListQuerySchema>
type OfferItemParticipantListQuery = z.infer<typeof offerItemParticipantListQuerySchema>
type OrderListQuery = z.infer<typeof orderListQuerySchema>
type OrderParticipantListQuery = z.infer<typeof orderParticipantListQuerySchema>
type OrderItemListQuery = z.infer<typeof orderItemListQuerySchema>
type OrderItemParticipantListQuery = z.infer<typeof orderItemParticipantListQuerySchema>
type OrderTermListQuery = z.infer<typeof orderTermListQuerySchema>

type CreateOfferInput = z.infer<typeof insertOfferSchema>
type UpdateOfferInput = z.infer<typeof updateOfferSchema>
type CreateOfferParticipantInput = z.infer<typeof insertOfferParticipantSchema>
type UpdateOfferParticipantInput = z.infer<typeof updateOfferParticipantSchema>
type CreateOfferItemInput = z.infer<typeof insertOfferItemSchema>
type UpdateOfferItemInput = z.infer<typeof updateOfferItemSchema>
type CreateOfferItemParticipantInput = z.infer<typeof insertOfferItemParticipantSchema>
type UpdateOfferItemParticipantInput = z.infer<typeof updateOfferItemParticipantSchema>
type CreateOrderInput = z.infer<typeof insertOrderSchema>
type UpdateOrderInput = z.infer<typeof updateOrderSchema>
type CreateOrderParticipantInput = z.infer<typeof insertOrderParticipantSchema>
type UpdateOrderParticipantInput = z.infer<typeof updateOrderParticipantSchema>
type CreateOrderItemInput = z.infer<typeof insertOrderItemSchema>
type UpdateOrderItemInput = z.infer<typeof updateOrderItemSchema>
type CreateOrderItemParticipantInput = z.infer<typeof insertOrderItemParticipantSchema>
type UpdateOrderItemParticipantInput = z.infer<typeof updateOrderItemParticipantSchema>
type CreateOrderTermInput = z.infer<typeof insertOrderTermSchema>
type UpdateOrderTermInput = z.infer<typeof updateOrderTermSchema>
type OfferBundleParticipantInput = Omit<CreateOfferParticipantInput, "offerId">
type OfferBundleItemInput = Omit<CreateOfferItemInput, "offerId">
type OfferBundleItemParticipantInput = Omit<
  CreateOfferItemParticipantInput,
  "offerItemId" | "participantId"
> & {
  itemIndex: number
  participantIndex: number
}
type CreateOfferBundleInput = {
  offer: CreateOfferInput
  participants?: OfferBundleParticipantInput[]
  items: OfferBundleItemInput[]
  itemParticipants?: OfferBundleItemParticipantInput[]
}

async function paginate<T extends object>(
  rowsQuery: Promise<T[]>,
  countQuery: Promise<Array<{ count: number }>>,
  limit: number,
  offset: number,
) {
  const [data, countResult] = await Promise.all([rowsQuery, countQuery])
  return { data, total: countResult[0]?.count ?? 0, limit, offset }
}

function normalizeTimestamp(value: string | null | undefined) {
  if (value === undefined || value === "") return undefined
  if (value === null) return null
  return new Date(value)
}

function toOfferParticipantResponse(row: typeof offerParticipants.$inferSelect) {
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

function toOrderParticipantResponse(row: typeof orderParticipants.$inferSelect) {
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

export const transactionsService = {
  async listOffers(db: PostgresJsDatabase, query: OfferListQuery) {
    const conditions = []
    if (query.status) conditions.push(eq(offers.status, query.status))
    if (query.opportunityId) conditions.push(eq(offers.opportunityId, query.opportunityId))
    if (query.quoteId) conditions.push(eq(offers.quoteId, query.quoteId))
    if (query.personId) conditions.push(eq(offers.personId, query.personId))
    if (query.organizationId) conditions.push(eq(offers.organizationId, query.organizationId))
    if (query.marketId) conditions.push(eq(offers.marketId, query.marketId))
    if (query.search) {
      const term = `%${query.search}%`
      conditions.push(or(ilike(offers.offerNumber, term), ilike(offers.title, term)))
    }
    const where = conditions.length ? and(...conditions) : undefined
    return paginate(
      db
        .select()
        .from(offers)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(desc(offers.createdAt)),
      db.select({ count: sql<number>`count(*)::int` }).from(offers).where(where),
      query.limit,
      query.offset,
    )
  },
  async getOfferById(db: PostgresJsDatabase, id: string) {
    const [row] = await db.select().from(offers).where(eq(offers.id, id)).limit(1)
    return row ?? null
  },
  async createOffer(db: PostgresJsDatabase, data: CreateOfferInput) {
    const { sentAt, acceptedAt, convertedAt, ...rest } = data
    const [row] = await db
      .insert(offers)
      .values({
        ...rest,
        sentAt: normalizeTimestamp(sentAt),
        acceptedAt: normalizeTimestamp(acceptedAt),
        convertedAt: normalizeTimestamp(convertedAt),
      })
      .returning()
    return row ?? null
  },
  async createOfferBundle(db: PostgresJsDatabase, input: CreateOfferBundleInput) {
    return db.transaction(async (tx) => {
      const offer = await transactionsService.createOffer(tx as PostgresJsDatabase, input.offer)
      if (!offer) {
        return null
      }

      const participants = [] as NonNullable<
        Awaited<ReturnType<typeof transactionsService.createOfferParticipant>>
      >[]
      for (const participant of input.participants ?? []) {
        const created = await transactionsService.createOfferParticipant(tx as PostgresJsDatabase, {
          ...participant,
          offerId: offer.id,
        })
        if (!created) {
          throw new Error("Failed to create offer participant")
        }
        participants.push(created)
      }

      const items = [] as NonNullable<
        Awaited<ReturnType<typeof transactionsService.createOfferItem>>
      >[]
      for (const item of input.items) {
        const created = await transactionsService.createOfferItem(tx as PostgresJsDatabase, {
          ...item,
          offerId: offer.id,
        })
        if (!created) {
          throw new Error("Failed to create offer item")
        }
        items.push(created)
      }

      const itemParticipants = [] as NonNullable<
        Awaited<ReturnType<typeof transactionsService.createOfferItemParticipant>>
      >[]
      for (const link of input.itemParticipants ?? []) {
        const item = items[link.itemIndex]
        const participant = participants[link.participantIndex]
        if (!item || !participant) {
          throw new Error("Invalid offer item participant link")
        }
        const created = await transactionsService.createOfferItemParticipant(
          tx as PostgresJsDatabase,
          {
            offerItemId: item.id,
            participantId: participant.id,
            role: link.role,
            isPrimary: link.isPrimary,
          },
        )
        if (!created) {
          throw new Error("Failed to create offer item participant")
        }
        itemParticipants.push(created)
      }

      return {
        offer,
        participants,
        items,
        itemParticipants,
      }
    })
  },
  async updateOffer(db: PostgresJsDatabase, id: string, data: UpdateOfferInput) {
    const { sentAt, acceptedAt, convertedAt, ...rest } = data
    const [row] = await db
      .update(offers)
      .set({
        ...rest,
        sentAt: normalizeTimestamp(sentAt),
        acceptedAt: normalizeTimestamp(acceptedAt),
        convertedAt: normalizeTimestamp(convertedAt),
        updatedAt: new Date(),
      })
      .where(eq(offers.id, id))
      .returning()
    return row ?? null
  },
  async deleteOffer(db: PostgresJsDatabase, id: string) {
    const [row] = await db.delete(offers).where(eq(offers.id, id)).returning({ id: offers.id })
    return row ?? null
  },

  async listOfferParticipants(db: PostgresJsDatabase, query: OfferParticipantListQuery) {
    const conditions = []
    if (query.offerId) conditions.push(eq(offerParticipants.offerId, query.offerId))
    if (query.personId) conditions.push(eq(offerParticipants.personId, query.personId))
    const where = conditions.length ? and(...conditions) : undefined
    const rows = db
      .select()
      .from(offerParticipants)
      .where(where)
      .limit(query.limit)
      .offset(query.offset)
      .orderBy(asc(offerParticipants.createdAt))
      .then((items) => items.map(toOfferParticipantResponse))
    return paginate(
      rows,
      db.select({ count: sql<number>`count(*)::int` }).from(offerParticipants).where(where),
      query.limit,
      query.offset,
    )
  },
  async getOfferParticipantById(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .select()
      .from(offerParticipants)
      .where(eq(offerParticipants.id, id))
      .limit(1)
    return row ? toOfferParticipantResponse(row) : null
  },
  async createOfferParticipant(db: PostgresJsDatabase, data: CreateOfferParticipantInput) {
    const { dateOfBirth, nationality, ...rest } = data
    void dateOfBirth
    void nationality
    const [row] = await db.insert(offerParticipants).values(rest).returning()
    return row ? toOfferParticipantResponse(row) : null
  },
  async updateOfferParticipant(
    db: PostgresJsDatabase,
    id: string,
    data: UpdateOfferParticipantInput,
  ) {
    const { dateOfBirth, nationality, ...rest } = data
    void dateOfBirth
    void nationality
    const [row] = await db
      .update(offerParticipants)
      .set({ ...rest, updatedAt: new Date() })
      .where(eq(offerParticipants.id, id))
      .returning()
    return row ? toOfferParticipantResponse(row) : null
  },
  async deleteOfferParticipant(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(offerParticipants)
      .where(eq(offerParticipants.id, id))
      .returning({ id: offerParticipants.id })
    return row ?? null
  },

  async listOfferItems(db: PostgresJsDatabase, query: OfferItemListQuery) {
    const conditions = []
    if (query.offerId) conditions.push(eq(offerItems.offerId, query.offerId))
    if (query.productId) conditions.push(eq(offerItems.productId, query.productId))
    if (query.optionId) conditions.push(eq(offerItems.optionId, query.optionId))
    if (query.unitId) conditions.push(eq(offerItems.unitId, query.unitId))
    if (query.slotId) conditions.push(eq(offerItems.slotId, query.slotId))
    if (query.status) conditions.push(eq(offerItems.status, query.status))
    const where = conditions.length ? and(...conditions) : undefined
    return paginate(
      db
        .select()
        .from(offerItems)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(asc(offerItems.createdAt)),
      db.select({ count: sql<number>`count(*)::int` }).from(offerItems).where(where),
      query.limit,
      query.offset,
    )
  },
  async getOfferItemById(db: PostgresJsDatabase, id: string) {
    const [row] = await db.select().from(offerItems).where(eq(offerItems.id, id)).limit(1)
    return row ?? null
  },
  async createOfferItem(db: PostgresJsDatabase, data: CreateOfferItemInput) {
    const { startsAt, endsAt, ...rest } = data
    const [row] = await db
      .insert(offerItems)
      .values({
        ...rest,
        startsAt: normalizeTimestamp(startsAt),
        endsAt: normalizeTimestamp(endsAt),
      })
      .returning()
    return row ?? null
  },
  async updateOfferItem(db: PostgresJsDatabase, id: string, data: UpdateOfferItemInput) {
    const { startsAt, endsAt, ...rest } = data
    const [row] = await db
      .update(offerItems)
      .set({
        ...rest,
        startsAt: normalizeTimestamp(startsAt),
        endsAt: normalizeTimestamp(endsAt),
        updatedAt: new Date(),
      })
      .where(eq(offerItems.id, id))
      .returning()
    return row ?? null
  },
  async deleteOfferItem(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(offerItems)
      .where(eq(offerItems.id, id))
      .returning({ id: offerItems.id })
    return row ?? null
  },

  async listOfferItemParticipants(db: PostgresJsDatabase, query: OfferItemParticipantListQuery) {
    const conditions = []
    if (query.offerItemId) conditions.push(eq(offerItemParticipants.offerItemId, query.offerItemId))
    if (query.participantId)
      conditions.push(eq(offerItemParticipants.participantId, query.participantId))
    const where = conditions.length ? and(...conditions) : undefined
    return paginate(
      db
        .select()
        .from(offerItemParticipants)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(asc(offerItemParticipants.createdAt)),
      db.select({ count: sql<number>`count(*)::int` }).from(offerItemParticipants).where(where),
      query.limit,
      query.offset,
    )
  },
  async getOfferItemParticipantById(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .select()
      .from(offerItemParticipants)
      .where(eq(offerItemParticipants.id, id))
      .limit(1)
    return row ?? null
  },
  async createOfferItemParticipant(db: PostgresJsDatabase, data: CreateOfferItemParticipantInput) {
    const [row] = await db.insert(offerItemParticipants).values(data).returning()
    return row ?? null
  },
  async updateOfferItemParticipant(
    db: PostgresJsDatabase,
    id: string,
    data: UpdateOfferItemParticipantInput,
  ) {
    const [row] = await db
      .update(offerItemParticipants)
      .set(data)
      .where(eq(offerItemParticipants.id, id))
      .returning()
    return row ?? null
  },
  async deleteOfferItemParticipant(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(offerItemParticipants)
      .where(eq(offerItemParticipants.id, id))
      .returning({ id: offerItemParticipants.id })
    return row ?? null
  },

  async listOrders(db: PostgresJsDatabase, query: OrderListQuery) {
    const conditions = []
    if (query.status) conditions.push(eq(orders.status, query.status))
    if (query.offerId) conditions.push(eq(orders.offerId, query.offerId))
    if (query.opportunityId) conditions.push(eq(orders.opportunityId, query.opportunityId))
    if (query.quoteId) conditions.push(eq(orders.quoteId, query.quoteId))
    if (query.personId) conditions.push(eq(orders.personId, query.personId))
    if (query.organizationId) conditions.push(eq(orders.organizationId, query.organizationId))
    if (query.marketId) conditions.push(eq(orders.marketId, query.marketId))
    if (query.search) {
      const term = `%${query.search}%`
      conditions.push(or(ilike(orders.orderNumber, term), ilike(orders.title, term)))
    }
    const where = conditions.length ? and(...conditions) : undefined
    return paginate(
      db
        .select()
        .from(orders)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(desc(orders.createdAt)),
      db.select({ count: sql<number>`count(*)::int` }).from(orders).where(where),
      query.limit,
      query.offset,
    )
  },
  async getOrderById(db: PostgresJsDatabase, id: string) {
    const [row] = await db.select().from(orders).where(eq(orders.id, id)).limit(1)
    return row ?? null
  },
  async createOrder(db: PostgresJsDatabase, data: CreateOrderInput) {
    const { orderedAt, confirmedAt, cancelledAt, expiresAt, ...rest } = data
    const [row] = await db
      .insert(orders)
      .values({
        ...rest,
        orderedAt: normalizeTimestamp(orderedAt),
        confirmedAt: normalizeTimestamp(confirmedAt),
        cancelledAt: normalizeTimestamp(cancelledAt),
        expiresAt: normalizeTimestamp(expiresAt),
      })
      .returning()
    return row ?? null
  },
  async updateOrder(db: PostgresJsDatabase, id: string, data: UpdateOrderInput) {
    const { orderedAt, confirmedAt, cancelledAt, expiresAt, ...rest } = data
    const [row] = await db
      .update(orders)
      .set({
        ...rest,
        orderedAt: normalizeTimestamp(orderedAt),
        confirmedAt: normalizeTimestamp(confirmedAt),
        cancelledAt: normalizeTimestamp(cancelledAt),
        expiresAt: normalizeTimestamp(expiresAt),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning()
    return row ?? null
  },
  async deleteOrder(db: PostgresJsDatabase, id: string) {
    const [row] = await db.delete(orders).where(eq(orders.id, id)).returning({ id: orders.id })
    return row ?? null
  },

  async listOrderParticipants(db: PostgresJsDatabase, query: OrderParticipantListQuery) {
    const conditions = []
    if (query.orderId) conditions.push(eq(orderParticipants.orderId, query.orderId))
    if (query.personId) conditions.push(eq(orderParticipants.personId, query.personId))
    const where = conditions.length ? and(...conditions) : undefined
    const rows = db
      .select()
      .from(orderParticipants)
      .where(where)
      .limit(query.limit)
      .offset(query.offset)
      .orderBy(asc(orderParticipants.createdAt))
      .then((items) => items.map(toOrderParticipantResponse))
    return paginate(
      rows,
      db.select({ count: sql<number>`count(*)::int` }).from(orderParticipants).where(where),
      query.limit,
      query.offset,
    )
  },
  async getOrderParticipantById(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .select()
      .from(orderParticipants)
      .where(eq(orderParticipants.id, id))
      .limit(1)
    return row ? toOrderParticipantResponse(row) : null
  },
  async createOrderParticipant(db: PostgresJsDatabase, data: CreateOrderParticipantInput) {
    const { dateOfBirth, nationality, ...rest } = data
    void dateOfBirth
    void nationality
    const [row] = await db.insert(orderParticipants).values(rest).returning()
    return row ? toOrderParticipantResponse(row) : null
  },
  async updateOrderParticipant(
    db: PostgresJsDatabase,
    id: string,
    data: UpdateOrderParticipantInput,
  ) {
    const { dateOfBirth, nationality, ...rest } = data
    void dateOfBirth
    void nationality
    const [row] = await db
      .update(orderParticipants)
      .set({ ...rest, updatedAt: new Date() })
      .where(eq(orderParticipants.id, id))
      .returning()
    return row ? toOrderParticipantResponse(row) : null
  },
  async deleteOrderParticipant(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(orderParticipants)
      .where(eq(orderParticipants.id, id))
      .returning({ id: orderParticipants.id })
    return row ?? null
  },

  async listOrderItems(db: PostgresJsDatabase, query: OrderItemListQuery) {
    const conditions = []
    if (query.orderId) conditions.push(eq(orderItems.orderId, query.orderId))
    if (query.offerItemId) conditions.push(eq(orderItems.offerItemId, query.offerItemId))
    if (query.productId) conditions.push(eq(orderItems.productId, query.productId))
    if (query.optionId) conditions.push(eq(orderItems.optionId, query.optionId))
    if (query.unitId) conditions.push(eq(orderItems.unitId, query.unitId))
    if (query.slotId) conditions.push(eq(orderItems.slotId, query.slotId))
    if (query.status) conditions.push(eq(orderItems.status, query.status))
    const where = conditions.length ? and(...conditions) : undefined
    return paginate(
      db
        .select()
        .from(orderItems)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(asc(orderItems.createdAt)),
      db.select({ count: sql<number>`count(*)::int` }).from(orderItems).where(where),
      query.limit,
      query.offset,
    )
  },
  async getOrderItemById(db: PostgresJsDatabase, id: string) {
    const [row] = await db.select().from(orderItems).where(eq(orderItems.id, id)).limit(1)
    return row ?? null
  },
  async createOrderItem(db: PostgresJsDatabase, data: CreateOrderItemInput) {
    const { startsAt, endsAt, ...rest } = data
    const [row] = await db
      .insert(orderItems)
      .values({
        ...rest,
        startsAt: normalizeTimestamp(startsAt),
        endsAt: normalizeTimestamp(endsAt),
      })
      .returning()
    return row ?? null
  },
  async updateOrderItem(db: PostgresJsDatabase, id: string, data: UpdateOrderItemInput) {
    const { startsAt, endsAt, ...rest } = data
    const [row] = await db
      .update(orderItems)
      .set({
        ...rest,
        startsAt: normalizeTimestamp(startsAt),
        endsAt: normalizeTimestamp(endsAt),
        updatedAt: new Date(),
      })
      .where(eq(orderItems.id, id))
      .returning()
    return row ?? null
  },
  async deleteOrderItem(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(orderItems)
      .where(eq(orderItems.id, id))
      .returning({ id: orderItems.id })
    return row ?? null
  },

  async listOrderItemParticipants(db: PostgresJsDatabase, query: OrderItemParticipantListQuery) {
    const conditions = []
    if (query.orderItemId) conditions.push(eq(orderItemParticipants.orderItemId, query.orderItemId))
    if (query.participantId)
      conditions.push(eq(orderItemParticipants.participantId, query.participantId))
    const where = conditions.length ? and(...conditions) : undefined
    return paginate(
      db
        .select()
        .from(orderItemParticipants)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(asc(orderItemParticipants.createdAt)),
      db.select({ count: sql<number>`count(*)::int` }).from(orderItemParticipants).where(where),
      query.limit,
      query.offset,
    )
  },
  async getOrderItemParticipantById(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .select()
      .from(orderItemParticipants)
      .where(eq(orderItemParticipants.id, id))
      .limit(1)
    return row ?? null
  },
  async createOrderItemParticipant(db: PostgresJsDatabase, data: CreateOrderItemParticipantInput) {
    const [row] = await db.insert(orderItemParticipants).values(data).returning()
    return row ?? null
  },
  async updateOrderItemParticipant(
    db: PostgresJsDatabase,
    id: string,
    data: UpdateOrderItemParticipantInput,
  ) {
    const [row] = await db
      .update(orderItemParticipants)
      .set(data)
      .where(eq(orderItemParticipants.id, id))
      .returning()
    return row ?? null
  },
  async deleteOrderItemParticipant(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(orderItemParticipants)
      .where(eq(orderItemParticipants.id, id))
      .returning({ id: orderItemParticipants.id })
    return row ?? null
  },

  async listOrderTerms(db: PostgresJsDatabase, query: OrderTermListQuery) {
    const conditions = []
    if (query.offerId) conditions.push(eq(orderTerms.offerId, query.offerId))
    if (query.orderId) conditions.push(eq(orderTerms.orderId, query.orderId))
    if (query.termType) conditions.push(eq(orderTerms.termType, query.termType))
    if (query.acceptanceStatus)
      conditions.push(eq(orderTerms.acceptanceStatus, query.acceptanceStatus))
    const where = conditions.length ? and(...conditions) : undefined
    return paginate(
      db
        .select()
        .from(orderTerms)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(asc(orderTerms.sortOrder), asc(orderTerms.createdAt)),
      db.select({ count: sql<number>`count(*)::int` }).from(orderTerms).where(where),
      query.limit,
      query.offset,
    )
  },
  async getOrderTermById(db: PostgresJsDatabase, id: string) {
    const [row] = await db.select().from(orderTerms).where(eq(orderTerms.id, id)).limit(1)
    return row ?? null
  },
  async createOrderTerm(db: PostgresJsDatabase, data: CreateOrderTermInput) {
    const { acceptedAt, ...rest } = data
    const [row] = await db
      .insert(orderTerms)
      .values({
        ...rest,
        acceptedAt: normalizeTimestamp(acceptedAt),
      })
      .returning()
    return row ?? null
  },
  async updateOrderTerm(db: PostgresJsDatabase, id: string, data: UpdateOrderTermInput) {
    const { acceptedAt, ...rest } = data
    const [row] = await db
      .update(orderTerms)
      .set({
        ...rest,
        acceptedAt: normalizeTimestamp(acceptedAt),
        updatedAt: new Date(),
      })
      .where(eq(orderTerms.id, id))
      .returning()
    return row ?? null
  },
  async deleteOrderTerm(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(orderTerms)
      .where(eq(orderTerms.id, id))
      .returning({ id: orderTerms.id })
    return row ?? null
  },
}
