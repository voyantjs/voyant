import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"

import { offerItemParticipants, offerItems, offerParticipants, offers } from "./schema.js"
import type {
  CreateOfferBundleInput,
  CreateOfferInput,
  CreateOfferItemInput,
  CreateOfferItemParticipantInput,
  CreateOfferParticipantInput,
  OfferItemListQuery,
  OfferItemParticipantListQuery,
  OfferListQuery,
  OfferParticipantListQuery,
  UpdateOfferInput,
  UpdateOfferItemInput,
  UpdateOfferItemParticipantInput,
  UpdateOfferParticipantInput,
} from "./service-shared.js"
import { normalizeTimestamp, paginate, toOfferParticipantResponse } from "./service-shared.js"

export async function listOffers(db: PostgresJsDatabase, query: OfferListQuery) {
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
}

export async function getOfferById(db: PostgresJsDatabase, id: string) {
  const [row] = await db.select().from(offers).where(eq(offers.id, id)).limit(1)
  return row ?? null
}

export async function createOffer(db: PostgresJsDatabase, data: CreateOfferInput) {
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
}

export async function createOfferBundle(db: PostgresJsDatabase, input: CreateOfferBundleInput) {
  return db.transaction(async (tx) => {
    const offer = await createOffer(tx as PostgresJsDatabase, input.offer)
    if (!offer) return null

    const participants = [] as NonNullable<Awaited<ReturnType<typeof createOfferParticipant>>>[]
    for (const participant of input.participants ?? []) {
      const created = await createOfferParticipant(tx as PostgresJsDatabase, {
        ...participant,
        offerId: offer.id,
      })
      if (!created) throw new Error("Failed to create offer participant")
      participants.push(created)
    }

    const items = [] as NonNullable<Awaited<ReturnType<typeof createOfferItem>>>[]
    for (const item of input.items) {
      const created = await createOfferItem(tx as PostgresJsDatabase, {
        ...item,
        offerId: offer.id,
      })
      if (!created) throw new Error("Failed to create offer item")
      items.push(created)
    }

    const itemParticipants = [] as NonNullable<
      Awaited<ReturnType<typeof createOfferItemParticipant>>
    >[]
    for (const link of input.itemParticipants ?? []) {
      const item = items[link.itemIndex]
      const participant = participants[link.participantIndex]
      if (!item || !participant) throw new Error("Invalid offer item participant link")
      const created = await createOfferItemParticipant(tx as PostgresJsDatabase, {
        offerItemId: item.id,
        participantId: participant.id,
        role: link.role,
        isPrimary: link.isPrimary,
      })
      if (!created) throw new Error("Failed to create offer item participant")
      itemParticipants.push(created)
    }

    return { offer, participants, items, itemParticipants }
  })
}

export async function updateOffer(db: PostgresJsDatabase, id: string, data: UpdateOfferInput) {
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
}

export async function deleteOffer(db: PostgresJsDatabase, id: string) {
  const [row] = await db.delete(offers).where(eq(offers.id, id)).returning({ id: offers.id })
  return row ?? null
}

export async function listOfferParticipants(
  db: PostgresJsDatabase,
  query: OfferParticipantListQuery,
) {
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
}

export async function getOfferParticipantById(db: PostgresJsDatabase, id: string) {
  const [row] = await db
    .select()
    .from(offerParticipants)
    .where(eq(offerParticipants.id, id))
    .limit(1)
  return row ? toOfferParticipantResponse(row) : null
}

export async function createOfferParticipant(
  db: PostgresJsDatabase,
  data: CreateOfferParticipantInput,
) {
  const { dateOfBirth, nationality, ...rest } = data
  void dateOfBirth
  void nationality
  const [row] = await db.insert(offerParticipants).values(rest).returning()
  return row ? toOfferParticipantResponse(row) : null
}

export async function updateOfferParticipant(
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
}

export async function deleteOfferParticipant(db: PostgresJsDatabase, id: string) {
  const [row] = await db
    .delete(offerParticipants)
    .where(eq(offerParticipants.id, id))
    .returning({ id: offerParticipants.id })
  return row ?? null
}

export async function listOfferItems(db: PostgresJsDatabase, query: OfferItemListQuery) {
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
}

export async function getOfferItemById(db: PostgresJsDatabase, id: string) {
  const [row] = await db.select().from(offerItems).where(eq(offerItems.id, id)).limit(1)
  return row ?? null
}

export async function createOfferItem(db: PostgresJsDatabase, data: CreateOfferItemInput) {
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
}

export async function updateOfferItem(
  db: PostgresJsDatabase,
  id: string,
  data: UpdateOfferItemInput,
) {
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
}

export async function deleteOfferItem(db: PostgresJsDatabase, id: string) {
  const [row] = await db
    .delete(offerItems)
    .where(eq(offerItems.id, id))
    .returning({ id: offerItems.id })
  return row ?? null
}

export async function listOfferItemParticipants(
  db: PostgresJsDatabase,
  query: OfferItemParticipantListQuery,
) {
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
}

export async function getOfferItemParticipantById(db: PostgresJsDatabase, id: string) {
  const [row] = await db
    .select()
    .from(offerItemParticipants)
    .where(eq(offerItemParticipants.id, id))
    .limit(1)
  return row ?? null
}

export async function createOfferItemParticipant(
  db: PostgresJsDatabase,
  data: CreateOfferItemParticipantInput,
) {
  const [row] = await db.insert(offerItemParticipants).values(data).returning()
  return row ?? null
}

export async function updateOfferItemParticipant(
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
}

export async function deleteOfferItemParticipant(db: PostgresJsDatabase, id: string) {
  const [row] = await db
    .delete(offerItemParticipants)
    .where(eq(offerItemParticipants.id, id))
    .returning({ id: offerItemParticipants.id })
  return row ?? null
}
