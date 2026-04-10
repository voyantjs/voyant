import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"

import {
  orderItemParticipants,
  orderItems,
  orderParticipants,
  orders,
  orderTerms,
} from "./schema.js"
import type {
  CreateOrderInput,
  CreateOrderItemInput,
  CreateOrderItemParticipantInput,
  CreateOrderParticipantInput,
  CreateOrderTermInput,
  OrderItemListQuery,
  OrderItemParticipantListQuery,
  OrderListQuery,
  OrderParticipantListQuery,
  OrderTermListQuery,
  UpdateOrderInput,
  UpdateOrderItemInput,
  UpdateOrderItemParticipantInput,
  UpdateOrderParticipantInput,
  UpdateOrderTermInput,
} from "./service-shared.js"
import { normalizeTimestamp, paginate, toOrderParticipantResponse } from "./service-shared.js"

export async function listOrders(db: PostgresJsDatabase, query: OrderListQuery) {
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
}

export async function getOrderById(db: PostgresJsDatabase, id: string) {
  const [row] = await db.select().from(orders).where(eq(orders.id, id)).limit(1)
  return row ?? null
}

export async function createOrder(db: PostgresJsDatabase, data: CreateOrderInput) {
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
}

export async function updateOrder(db: PostgresJsDatabase, id: string, data: UpdateOrderInput) {
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
}

export async function deleteOrder(db: PostgresJsDatabase, id: string) {
  const [row] = await db.delete(orders).where(eq(orders.id, id)).returning({ id: orders.id })
  return row ?? null
}

export async function listOrderParticipants(
  db: PostgresJsDatabase,
  query: OrderParticipantListQuery,
) {
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
}

export async function getOrderParticipantById(db: PostgresJsDatabase, id: string) {
  const [row] = await db
    .select()
    .from(orderParticipants)
    .where(eq(orderParticipants.id, id))
    .limit(1)
  return row ? toOrderParticipantResponse(row) : null
}

export async function createOrderParticipant(
  db: PostgresJsDatabase,
  data: CreateOrderParticipantInput,
) {
  const { dateOfBirth, nationality, ...rest } = data
  void dateOfBirth
  void nationality
  const [row] = await db.insert(orderParticipants).values(rest).returning()
  return row ? toOrderParticipantResponse(row) : null
}

export async function updateOrderParticipant(
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
}

export async function deleteOrderParticipant(db: PostgresJsDatabase, id: string) {
  const [row] = await db
    .delete(orderParticipants)
    .where(eq(orderParticipants.id, id))
    .returning({ id: orderParticipants.id })
  return row ?? null
}

export async function listOrderItems(db: PostgresJsDatabase, query: OrderItemListQuery) {
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
}

export async function getOrderItemById(db: PostgresJsDatabase, id: string) {
  const [row] = await db.select().from(orderItems).where(eq(orderItems.id, id)).limit(1)
  return row ?? null
}

export async function createOrderItem(db: PostgresJsDatabase, data: CreateOrderItemInput) {
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
}

export async function updateOrderItem(
  db: PostgresJsDatabase,
  id: string,
  data: UpdateOrderItemInput,
) {
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
}

export async function deleteOrderItem(db: PostgresJsDatabase, id: string) {
  const [row] = await db
    .delete(orderItems)
    .where(eq(orderItems.id, id))
    .returning({ id: orderItems.id })
  return row ?? null
}

export async function listOrderItemParticipants(
  db: PostgresJsDatabase,
  query: OrderItemParticipantListQuery,
) {
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
}

export async function getOrderItemParticipantById(db: PostgresJsDatabase, id: string) {
  const [row] = await db
    .select()
    .from(orderItemParticipants)
    .where(eq(orderItemParticipants.id, id))
    .limit(1)
  return row ?? null
}

export async function createOrderItemParticipant(
  db: PostgresJsDatabase,
  data: CreateOrderItemParticipantInput,
) {
  const [row] = await db.insert(orderItemParticipants).values(data).returning()
  return row ?? null
}

export async function updateOrderItemParticipant(
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
}

export async function deleteOrderItemParticipant(db: PostgresJsDatabase, id: string) {
  const [row] = await db
    .delete(orderItemParticipants)
    .where(eq(orderItemParticipants.id, id))
    .returning({ id: orderItemParticipants.id })
  return row ?? null
}

export async function listOrderTerms(db: PostgresJsDatabase, query: OrderTermListQuery) {
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
}

export async function getOrderTermById(db: PostgresJsDatabase, id: string) {
  const [row] = await db.select().from(orderTerms).where(eq(orderTerms.id, id)).limit(1)
  return row ?? null
}

export async function createOrderTerm(db: PostgresJsDatabase, data: CreateOrderTermInput) {
  const { acceptedAt, ...rest } = data
  const [row] = await db
    .insert(orderTerms)
    .values({
      ...rest,
      acceptedAt: normalizeTimestamp(acceptedAt),
    })
    .returning()
  return row ?? null
}

export async function updateOrderTerm(
  db: PostgresJsDatabase,
  id: string,
  data: UpdateOrderTermInput,
) {
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
}

export async function deleteOrderTerm(db: PostgresJsDatabase, id: string) {
  const [row] = await db
    .delete(orderTerms)
    .where(eq(orderTerms.id, id))
    .returning({ id: orderTerms.id })
  return row ?? null
}
