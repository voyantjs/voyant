import { and, asc, desc, eq, sql } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import type { z } from "zod"

import {
  availabilityCloseouts,
  availabilityPickupPoints,
  availabilityRules,
  availabilitySlotPickups,
  availabilitySlots,
  availabilityStartTimes,
  customPickupAreas,
  locationPickupTimes,
  pickupGroups,
  pickupLocations,
  productMeetingConfigs,
} from "./schema.js"
import type {
  availabilityCloseoutListQuerySchema,
  availabilityPickupPointListQuerySchema,
  availabilityRuleListQuerySchema,
  availabilitySlotListQuerySchema,
  availabilitySlotPickupListQuerySchema,
  availabilityStartTimeListQuerySchema,
  customPickupAreaListQuerySchema,
  insertAvailabilityCloseoutSchema,
  insertAvailabilityPickupPointSchema,
  insertAvailabilityRuleSchema,
  insertAvailabilitySlotPickupSchema,
  insertAvailabilitySlotSchema,
  insertAvailabilityStartTimeSchema,
  insertCustomPickupAreaSchema,
  insertLocationPickupTimeSchema,
  insertPickupGroupSchema,
  insertPickupLocationSchema,
  insertProductMeetingConfigSchema,
  locationPickupTimeListQuerySchema,
  pickupGroupListQuerySchema,
  pickupLocationListQuerySchema,
  productMeetingConfigListQuerySchema,
  updateAvailabilityCloseoutSchema,
  updateAvailabilityPickupPointSchema,
  updateAvailabilityRuleSchema,
  updateAvailabilitySlotPickupSchema,
  updateAvailabilitySlotSchema,
  updateAvailabilityStartTimeSchema,
  updateCustomPickupAreaSchema,
  updateLocationPickupTimeSchema,
  updatePickupGroupSchema,
  updatePickupLocationSchema,
  updateProductMeetingConfigSchema,
} from "./validation.js"

type AvailabilityRuleListQuery = z.infer<typeof availabilityRuleListQuerySchema>
type AvailabilityStartTimeListQuery = z.infer<typeof availabilityStartTimeListQuerySchema>
type AvailabilitySlotListQuery = z.infer<typeof availabilitySlotListQuerySchema>
type AvailabilityCloseoutListQuery = z.infer<typeof availabilityCloseoutListQuerySchema>
type AvailabilityPickupPointListQuery = z.infer<typeof availabilityPickupPointListQuerySchema>
type AvailabilitySlotPickupListQuery = z.infer<typeof availabilitySlotPickupListQuerySchema>
type ProductMeetingConfigListQuery = z.infer<typeof productMeetingConfigListQuerySchema>
type PickupGroupListQuery = z.infer<typeof pickupGroupListQuerySchema>
type PickupLocationListQuery = z.infer<typeof pickupLocationListQuerySchema>
type LocationPickupTimeListQuery = z.infer<typeof locationPickupTimeListQuerySchema>
type CustomPickupAreaListQuery = z.infer<typeof customPickupAreaListQuerySchema>
type CreateAvailabilityRuleInput = z.infer<typeof insertAvailabilityRuleSchema>
type UpdateAvailabilityRuleInput = z.infer<typeof updateAvailabilityRuleSchema>
type CreateAvailabilityStartTimeInput = z.infer<typeof insertAvailabilityStartTimeSchema>
type UpdateAvailabilityStartTimeInput = z.infer<typeof updateAvailabilityStartTimeSchema>
type CreateAvailabilitySlotInput = z.infer<typeof insertAvailabilitySlotSchema>
type UpdateAvailabilitySlotInput = z.infer<typeof updateAvailabilitySlotSchema>
type CreateAvailabilityCloseoutInput = z.infer<typeof insertAvailabilityCloseoutSchema>
type UpdateAvailabilityCloseoutInput = z.infer<typeof updateAvailabilityCloseoutSchema>
type CreateAvailabilityPickupPointInput = z.infer<typeof insertAvailabilityPickupPointSchema>
type UpdateAvailabilityPickupPointInput = z.infer<typeof updateAvailabilityPickupPointSchema>
type CreateAvailabilitySlotPickupInput = z.infer<typeof insertAvailabilitySlotPickupSchema>
type UpdateAvailabilitySlotPickupInput = z.infer<typeof updateAvailabilitySlotPickupSchema>
type CreateProductMeetingConfigInput = z.infer<typeof insertProductMeetingConfigSchema>
type UpdateProductMeetingConfigInput = z.infer<typeof updateProductMeetingConfigSchema>
type CreatePickupGroupInput = z.infer<typeof insertPickupGroupSchema>
type UpdatePickupGroupInput = z.infer<typeof updatePickupGroupSchema>
type CreatePickupLocationInput = z.infer<typeof insertPickupLocationSchema>
type UpdatePickupLocationInput = z.infer<typeof updatePickupLocationSchema>
type CreateLocationPickupTimeInput = z.infer<typeof insertLocationPickupTimeSchema>
type UpdateLocationPickupTimeInput = z.infer<typeof updateLocationPickupTimeSchema>
type CreateCustomPickupAreaInput = z.infer<typeof insertCustomPickupAreaSchema>
type UpdateCustomPickupAreaInput = z.infer<typeof updateCustomPickupAreaSchema>

async function paginate<T extends object>(
  rowsQuery: Promise<T[]>,
  countQuery: Promise<Array<{ count: number }>>,
  limit: number,
  offset: number,
) {
  const [data, countResult] = await Promise.all([rowsQuery, countQuery])

  return {
    data,
    total: countResult[0]?.count ?? 0,
    limit,
    offset,
  }
}

function toDateOrNull(value: string | null | undefined) {
  return value ? new Date(value) : null
}

export const availabilityService = {
  async listRules(db: PostgresJsDatabase, query: AvailabilityRuleListQuery) {
    const conditions = []
    if (query.productId) conditions.push(eq(availabilityRules.productId, query.productId))
    if (query.optionId) conditions.push(eq(availabilityRules.optionId, query.optionId))
    if (query.facilityId) conditions.push(eq(availabilityRules.facilityId, query.facilityId))
    if (query.active !== undefined) conditions.push(eq(availabilityRules.active, query.active))

    const where = conditions.length ? and(...conditions) : undefined
    return paginate(
      db
        .select()
        .from(availabilityRules)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(desc(availabilityRules.updatedAt)),
      db.select({ count: sql<number>`count(*)::int` }).from(availabilityRules).where(where),
      query.limit,
      query.offset,
    )
  },

  async getRuleById(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .select()
      .from(availabilityRules)
      .where(eq(availabilityRules.id, id))
      .limit(1)
    return row ?? null
  },

  async createRule(db: PostgresJsDatabase, data: CreateAvailabilityRuleInput) {
    const [row] = await db.insert(availabilityRules).values(data).returning()
    return row
  },

  async updateRule(db: PostgresJsDatabase, id: string, data: UpdateAvailabilityRuleInput) {
    const [row] = await db
      .update(availabilityRules)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(availabilityRules.id, id))
      .returning()
    return row ?? null
  },

  async deleteRule(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(availabilityRules)
      .where(eq(availabilityRules.id, id))
      .returning({ id: availabilityRules.id })
    return row ?? null
  },

  async listStartTimes(db: PostgresJsDatabase, query: AvailabilityStartTimeListQuery) {
    const conditions = []
    if (query.productId) conditions.push(eq(availabilityStartTimes.productId, query.productId))
    if (query.optionId) conditions.push(eq(availabilityStartTimes.optionId, query.optionId))
    if (query.facilityId) conditions.push(eq(availabilityStartTimes.facilityId, query.facilityId))
    if (query.active !== undefined) conditions.push(eq(availabilityStartTimes.active, query.active))
    const where = conditions.length ? and(...conditions) : undefined

    return paginate(
      db
        .select()
        .from(availabilityStartTimes)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(availabilityStartTimes.sortOrder, availabilityStartTimes.createdAt),
      db.select({ count: sql<number>`count(*)::int` }).from(availabilityStartTimes).where(where),
      query.limit,
      query.offset,
    )
  },

  async getStartTimeById(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .select()
      .from(availabilityStartTimes)
      .where(eq(availabilityStartTimes.id, id))
      .limit(1)
    return row ?? null
  },

  async createStartTime(db: PostgresJsDatabase, data: CreateAvailabilityStartTimeInput) {
    const [row] = await db.insert(availabilityStartTimes).values(data).returning()
    return row
  },

  async updateStartTime(
    db: PostgresJsDatabase,
    id: string,
    data: UpdateAvailabilityStartTimeInput,
  ) {
    const [row] = await db
      .update(availabilityStartTimes)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(availabilityStartTimes.id, id))
      .returning()
    return row ?? null
  },

  async deleteStartTime(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(availabilityStartTimes)
      .where(eq(availabilityStartTimes.id, id))
      .returning({ id: availabilityStartTimes.id })
    return row ?? null
  },

  async listSlots(db: PostgresJsDatabase, query: AvailabilitySlotListQuery) {
    const conditions = []
    if (query.productId) conditions.push(eq(availabilitySlots.productId, query.productId))
    if (query.optionId) conditions.push(eq(availabilitySlots.optionId, query.optionId))
    if (query.facilityId) conditions.push(eq(availabilitySlots.facilityId, query.facilityId))
    if (query.availabilityRuleId)
      conditions.push(eq(availabilitySlots.availabilityRuleId, query.availabilityRuleId))
    if (query.startTimeId) conditions.push(eq(availabilitySlots.startTimeId, query.startTimeId))
    if (query.dateLocal) conditions.push(eq(availabilitySlots.dateLocal, query.dateLocal))
    if (query.status) conditions.push(eq(availabilitySlots.status, query.status))
    const where = conditions.length ? and(...conditions) : undefined

    return paginate(
      db
        .select()
        .from(availabilitySlots)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(asc(availabilitySlots.startsAt)),
      db.select({ count: sql<number>`count(*)::int` }).from(availabilitySlots).where(where),
      query.limit,
      query.offset,
    )
  },

  async getSlotById(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .select()
      .from(availabilitySlots)
      .where(eq(availabilitySlots.id, id))
      .limit(1)
    return row ?? null
  },

  async createSlot(db: PostgresJsDatabase, data: CreateAvailabilitySlotInput) {
    const [row] = await db
      .insert(availabilitySlots)
      .values({
        ...data,
        startsAt: new Date(data.startsAt),
        endsAt: toDateOrNull(data.endsAt),
      })
      .returning()
    return row
  },

  async updateSlot(db: PostgresJsDatabase, id: string, data: UpdateAvailabilitySlotInput) {
    const patch = {
      ...data,
      startsAt: data.startsAt === undefined ? undefined : new Date(data.startsAt),
      endsAt: data.endsAt === undefined ? undefined : toDateOrNull(data.endsAt),
      updatedAt: new Date(),
    }

    const [row] = await db
      .update(availabilitySlots)
      .set(patch)
      .where(eq(availabilitySlots.id, id))
      .returning()
    return row ?? null
  },

  async deleteSlot(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(availabilitySlots)
      .where(eq(availabilitySlots.id, id))
      .returning({ id: availabilitySlots.id })
    return row ?? null
  },

  async listCloseouts(db: PostgresJsDatabase, query: AvailabilityCloseoutListQuery) {
    const conditions = []
    if (query.productId) conditions.push(eq(availabilityCloseouts.productId, query.productId))
    if (query.slotId) conditions.push(eq(availabilityCloseouts.slotId, query.slotId))
    if (query.dateLocal) conditions.push(eq(availabilityCloseouts.dateLocal, query.dateLocal))
    const where = conditions.length ? and(...conditions) : undefined

    return paginate(
      db
        .select()
        .from(availabilityCloseouts)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(desc(availabilityCloseouts.createdAt)),
      db.select({ count: sql<number>`count(*)::int` }).from(availabilityCloseouts).where(where),
      query.limit,
      query.offset,
    )
  },

  async getCloseoutById(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .select()
      .from(availabilityCloseouts)
      .where(eq(availabilityCloseouts.id, id))
      .limit(1)
    return row ?? null
  },

  async createCloseout(db: PostgresJsDatabase, data: CreateAvailabilityCloseoutInput) {
    const [row] = await db.insert(availabilityCloseouts).values(data).returning()
    return row
  },

  async updateCloseout(db: PostgresJsDatabase, id: string, data: UpdateAvailabilityCloseoutInput) {
    const [row] = await db
      .update(availabilityCloseouts)
      .set(data)
      .where(eq(availabilityCloseouts.id, id))
      .returning()
    return row ?? null
  },

  async deleteCloseout(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(availabilityCloseouts)
      .where(eq(availabilityCloseouts.id, id))
      .returning({ id: availabilityCloseouts.id })
    return row ?? null
  },

  async listPickupPoints(db: PostgresJsDatabase, query: AvailabilityPickupPointListQuery) {
    const conditions = []
    if (query.productId) conditions.push(eq(availabilityPickupPoints.productId, query.productId))
    if (query.facilityId) conditions.push(eq(availabilityPickupPoints.facilityId, query.facilityId))
    if (query.active !== undefined)
      conditions.push(eq(availabilityPickupPoints.active, query.active))
    const where = conditions.length ? and(...conditions) : undefined

    return paginate(
      db
        .select()
        .from(availabilityPickupPoints)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(availabilityPickupPoints.createdAt),
      db.select({ count: sql<number>`count(*)::int` }).from(availabilityPickupPoints).where(where),
      query.limit,
      query.offset,
    )
  },

  async getPickupPointById(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .select()
      .from(availabilityPickupPoints)
      .where(eq(availabilityPickupPoints.id, id))
      .limit(1)
    return row ?? null
  },

  async createPickupPoint(db: PostgresJsDatabase, data: CreateAvailabilityPickupPointInput) {
    const [row] = await db.insert(availabilityPickupPoints).values(data).returning()
    return row
  },

  async updatePickupPoint(
    db: PostgresJsDatabase,
    id: string,
    data: UpdateAvailabilityPickupPointInput,
  ) {
    const [row] = await db
      .update(availabilityPickupPoints)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(availabilityPickupPoints.id, id))
      .returning()
    return row ?? null
  },

  async deletePickupPoint(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(availabilityPickupPoints)
      .where(eq(availabilityPickupPoints.id, id))
      .returning({ id: availabilityPickupPoints.id })
    return row ?? null
  },

  async listSlotPickups(db: PostgresJsDatabase, query: AvailabilitySlotPickupListQuery) {
    const conditions = []
    if (query.slotId) conditions.push(eq(availabilitySlotPickups.slotId, query.slotId))
    if (query.pickupPointId)
      conditions.push(eq(availabilitySlotPickups.pickupPointId, query.pickupPointId))
    const where = conditions.length ? and(...conditions) : undefined

    return paginate(
      db
        .select()
        .from(availabilitySlotPickups)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(availabilitySlotPickups.createdAt),
      db.select({ count: sql<number>`count(*)::int` }).from(availabilitySlotPickups).where(where),
      query.limit,
      query.offset,
    )
  },

  async getSlotPickupById(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .select()
      .from(availabilitySlotPickups)
      .where(eq(availabilitySlotPickups.id, id))
      .limit(1)
    return row ?? null
  },

  async createSlotPickup(db: PostgresJsDatabase, data: CreateAvailabilitySlotPickupInput) {
    const [row] = await db.insert(availabilitySlotPickups).values(data).returning()
    return row
  },

  async updateSlotPickup(
    db: PostgresJsDatabase,
    id: string,
    data: UpdateAvailabilitySlotPickupInput,
  ) {
    const [row] = await db
      .update(availabilitySlotPickups)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(availabilitySlotPickups.id, id))
      .returning()
    return row ?? null
  },

  async deleteSlotPickup(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(availabilitySlotPickups)
      .where(eq(availabilitySlotPickups.id, id))
      .returning({ id: availabilitySlotPickups.id })
    return row ?? null
  },

  async listMeetingConfigs(db: PostgresJsDatabase, query: ProductMeetingConfigListQuery) {
    const conditions = []
    if (query.productId) conditions.push(eq(productMeetingConfigs.productId, query.productId))
    if (query.optionId) conditions.push(eq(productMeetingConfigs.optionId, query.optionId))
    if (query.facilityId) conditions.push(eq(productMeetingConfigs.facilityId, query.facilityId))
    if (query.mode) conditions.push(eq(productMeetingConfigs.mode, query.mode))
    if (query.active !== undefined) conditions.push(eq(productMeetingConfigs.active, query.active))
    const where = conditions.length ? and(...conditions) : undefined

    return paginate(
      db
        .select()
        .from(productMeetingConfigs)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(desc(productMeetingConfigs.updatedAt)),
      db.select({ count: sql<number>`count(*)::int` }).from(productMeetingConfigs).where(where),
      query.limit,
      query.offset,
    )
  },

  async getMeetingConfigById(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .select()
      .from(productMeetingConfigs)
      .where(eq(productMeetingConfigs.id, id))
      .limit(1)
    return row ?? null
  },

  async createMeetingConfig(db: PostgresJsDatabase, data: CreateProductMeetingConfigInput) {
    const [row] = await db.insert(productMeetingConfigs).values(data).returning()
    return row
  },

  async updateMeetingConfig(
    db: PostgresJsDatabase,
    id: string,
    data: UpdateProductMeetingConfigInput,
  ) {
    const [row] = await db
      .update(productMeetingConfigs)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(productMeetingConfigs.id, id))
      .returning()
    return row ?? null
  },

  async deleteMeetingConfig(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(productMeetingConfigs)
      .where(eq(productMeetingConfigs.id, id))
      .returning({ id: productMeetingConfigs.id })
    return row ?? null
  },

  async listPickupGroups(db: PostgresJsDatabase, query: PickupGroupListQuery) {
    const conditions = []
    if (query.meetingConfigId)
      conditions.push(eq(pickupGroups.meetingConfigId, query.meetingConfigId))
    if (query.kind) conditions.push(eq(pickupGroups.kind, query.kind))
    if (query.active !== undefined) conditions.push(eq(pickupGroups.active, query.active))
    const where = conditions.length ? and(...conditions) : undefined

    return paginate(
      db
        .select()
        .from(pickupGroups)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(asc(pickupGroups.sortOrder), pickupGroups.createdAt),
      db.select({ count: sql<number>`count(*)::int` }).from(pickupGroups).where(where),
      query.limit,
      query.offset,
    )
  },

  async getPickupGroupById(db: PostgresJsDatabase, id: string) {
    const [row] = await db.select().from(pickupGroups).where(eq(pickupGroups.id, id)).limit(1)
    return row ?? null
  },

  async createPickupGroup(db: PostgresJsDatabase, data: CreatePickupGroupInput) {
    const [row] = await db.insert(pickupGroups).values(data).returning()
    return row
  },

  async updatePickupGroup(db: PostgresJsDatabase, id: string, data: UpdatePickupGroupInput) {
    const [row] = await db
      .update(pickupGroups)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(pickupGroups.id, id))
      .returning()
    return row ?? null
  },

  async deletePickupGroup(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(pickupGroups)
      .where(eq(pickupGroups.id, id))
      .returning({ id: pickupGroups.id })
    return row ?? null
  },

  async listPickupLocations(db: PostgresJsDatabase, query: PickupLocationListQuery) {
    const conditions = []
    if (query.groupId) conditions.push(eq(pickupLocations.groupId, query.groupId))
    if (query.facilityId) conditions.push(eq(pickupLocations.facilityId, query.facilityId))
    if (query.active !== undefined) conditions.push(eq(pickupLocations.active, query.active))
    const where = conditions.length ? and(...conditions) : undefined

    return paginate(
      db
        .select()
        .from(pickupLocations)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(asc(pickupLocations.sortOrder), pickupLocations.createdAt),
      db.select({ count: sql<number>`count(*)::int` }).from(pickupLocations).where(where),
      query.limit,
      query.offset,
    )
  },

  async getPickupLocationById(db: PostgresJsDatabase, id: string) {
    const [row] = await db.select().from(pickupLocations).where(eq(pickupLocations.id, id)).limit(1)
    return row ?? null
  },

  async createPickupLocation(db: PostgresJsDatabase, data: CreatePickupLocationInput) {
    const [row] = await db.insert(pickupLocations).values(data).returning()
    return row
  },

  async updatePickupLocation(db: PostgresJsDatabase, id: string, data: UpdatePickupLocationInput) {
    const [row] = await db
      .update(pickupLocations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(pickupLocations.id, id))
      .returning()
    return row ?? null
  },

  async deletePickupLocation(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(pickupLocations)
      .where(eq(pickupLocations.id, id))
      .returning({ id: pickupLocations.id })
    return row ?? null
  },

  async listLocationPickupTimes(db: PostgresJsDatabase, query: LocationPickupTimeListQuery) {
    const conditions = []
    if (query.pickupLocationId)
      conditions.push(eq(locationPickupTimes.pickupLocationId, query.pickupLocationId))
    if (query.slotId) conditions.push(eq(locationPickupTimes.slotId, query.slotId))
    if (query.startTimeId) conditions.push(eq(locationPickupTimes.startTimeId, query.startTimeId))
    if (query.active !== undefined) conditions.push(eq(locationPickupTimes.active, query.active))
    const where = conditions.length ? and(...conditions) : undefined

    return paginate(
      db
        .select()
        .from(locationPickupTimes)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(locationPickupTimes.createdAt),
      db.select({ count: sql<number>`count(*)::int` }).from(locationPickupTimes).where(where),
      query.limit,
      query.offset,
    )
  },

  async getLocationPickupTimeById(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .select()
      .from(locationPickupTimes)
      .where(eq(locationPickupTimes.id, id))
      .limit(1)
    return row ?? null
  },

  async createLocationPickupTime(db: PostgresJsDatabase, data: CreateLocationPickupTimeInput) {
    const [row] = await db.insert(locationPickupTimes).values(data).returning()
    return row
  },

  async updateLocationPickupTime(
    db: PostgresJsDatabase,
    id: string,
    data: UpdateLocationPickupTimeInput,
  ) {
    const [row] = await db
      .update(locationPickupTimes)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(locationPickupTimes.id, id))
      .returning()
    return row ?? null
  },

  async deleteLocationPickupTime(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(locationPickupTimes)
      .where(eq(locationPickupTimes.id, id))
      .returning({ id: locationPickupTimes.id })
    return row ?? null
  },

  async listCustomPickupAreas(db: PostgresJsDatabase, query: CustomPickupAreaListQuery) {
    const conditions = []
    if (query.meetingConfigId)
      conditions.push(eq(customPickupAreas.meetingConfigId, query.meetingConfigId))
    if (query.active !== undefined) conditions.push(eq(customPickupAreas.active, query.active))
    const where = conditions.length ? and(...conditions) : undefined

    return paginate(
      db
        .select()
        .from(customPickupAreas)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(customPickupAreas.createdAt),
      db.select({ count: sql<number>`count(*)::int` }).from(customPickupAreas).where(where),
      query.limit,
      query.offset,
    )
  },

  async getCustomPickupAreaById(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .select()
      .from(customPickupAreas)
      .where(eq(customPickupAreas.id, id))
      .limit(1)
    return row ?? null
  },

  async createCustomPickupArea(db: PostgresJsDatabase, data: CreateCustomPickupAreaInput) {
    const [row] = await db.insert(customPickupAreas).values(data).returning()
    return row
  },

  async updateCustomPickupArea(
    db: PostgresJsDatabase,
    id: string,
    data: UpdateCustomPickupAreaInput,
  ) {
    const [row] = await db
      .update(customPickupAreas)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(customPickupAreas.id, id))
      .returning()
    return row ?? null
  },

  async deleteCustomPickupArea(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(customPickupAreas)
      .where(eq(customPickupAreas.id, id))
      .returning({ id: customPickupAreas.id })
    return row ?? null
  },
}
