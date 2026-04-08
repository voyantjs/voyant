import { and, asc, desc, eq, sql } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import type { z } from "zod"

import {
  groundDispatchAssignments,
  groundDispatchCheckpoints,
  groundDispatches,
  groundDispatchLegs,
  groundDispatchPassengers,
  groundDriverShifts,
  groundDrivers,
  groundExecutionEvents,
  groundOperators,
  groundServiceIncidents,
  groundTransferPreferences,
  groundVehicles,
} from "./schema.js"
import type {
  groundDispatchAssignmentListQuerySchema,
  groundDispatchCheckpointListQuerySchema,
  groundDispatchLegListQuerySchema,
  groundDispatchListQuerySchema,
  groundDispatchPassengerListQuerySchema,
  groundDriverListQuerySchema,
  groundDriverShiftListQuerySchema,
  groundExecutionEventListQuerySchema,
  groundOperatorListQuerySchema,
  groundServiceIncidentListQuerySchema,
  groundTransferPreferenceListQuerySchema,
  groundVehicleListQuerySchema,
  insertGroundDispatchAssignmentSchema,
  insertGroundDispatchCheckpointSchema,
  insertGroundDispatchLegSchema,
  insertGroundDispatchPassengerSchema,
  insertGroundDispatchSchema,
  insertGroundDriverSchema,
  insertGroundDriverShiftSchema,
  insertGroundExecutionEventSchema,
  insertGroundOperatorSchema,
  insertGroundServiceIncidentSchema,
  insertGroundTransferPreferenceSchema,
  insertGroundVehicleSchema,
  updateGroundDispatchAssignmentSchema,
  updateGroundDispatchCheckpointSchema,
  updateGroundDispatchLegSchema,
  updateGroundDispatchPassengerSchema,
  updateGroundDispatchSchema,
  updateGroundDriverSchema,
  updateGroundDriverShiftSchema,
  updateGroundExecutionEventSchema,
  updateGroundOperatorSchema,
  updateGroundServiceIncidentSchema,
  updateGroundTransferPreferenceSchema,
  updateGroundVehicleSchema,
} from "./validation.js"

type GroundOperatorListQuery = z.infer<typeof groundOperatorListQuerySchema>
type CreateGroundOperatorInput = z.infer<typeof insertGroundOperatorSchema>
type UpdateGroundOperatorInput = z.infer<typeof updateGroundOperatorSchema>
type GroundVehicleListQuery = z.infer<typeof groundVehicleListQuerySchema>
type CreateGroundVehicleInput = z.infer<typeof insertGroundVehicleSchema>
type UpdateGroundVehicleInput = z.infer<typeof updateGroundVehicleSchema>
type GroundDriverListQuery = z.infer<typeof groundDriverListQuerySchema>
type CreateGroundDriverInput = z.infer<typeof insertGroundDriverSchema>
type UpdateGroundDriverInput = z.infer<typeof updateGroundDriverSchema>
type GroundTransferPreferenceListQuery = z.infer<typeof groundTransferPreferenceListQuerySchema>
type CreateGroundTransferPreferenceInput = z.infer<typeof insertGroundTransferPreferenceSchema>
type UpdateGroundTransferPreferenceInput = z.infer<typeof updateGroundTransferPreferenceSchema>
type GroundDispatchListQuery = z.infer<typeof groundDispatchListQuerySchema>
type CreateGroundDispatchInput = z.infer<typeof insertGroundDispatchSchema>
type UpdateGroundDispatchInput = z.infer<typeof updateGroundDispatchSchema>
type GroundExecutionEventListQuery = z.infer<typeof groundExecutionEventListQuerySchema>
type CreateGroundExecutionEventInput = z.infer<typeof insertGroundExecutionEventSchema>
type UpdateGroundExecutionEventInput = z.infer<typeof updateGroundExecutionEventSchema>
type GroundDispatchAssignmentListQuery = z.infer<typeof groundDispatchAssignmentListQuerySchema>
type CreateGroundDispatchAssignmentInput = z.infer<typeof insertGroundDispatchAssignmentSchema>
type UpdateGroundDispatchAssignmentInput = z.infer<typeof updateGroundDispatchAssignmentSchema>
type GroundDispatchLegListQuery = z.infer<typeof groundDispatchLegListQuerySchema>
type CreateGroundDispatchLegInput = z.infer<typeof insertGroundDispatchLegSchema>
type UpdateGroundDispatchLegInput = z.infer<typeof updateGroundDispatchLegSchema>
type GroundDispatchPassengerListQuery = z.infer<typeof groundDispatchPassengerListQuerySchema>
type CreateGroundDispatchPassengerInput = z.infer<typeof insertGroundDispatchPassengerSchema>
type UpdateGroundDispatchPassengerInput = z.infer<typeof updateGroundDispatchPassengerSchema>
type GroundDriverShiftListQuery = z.infer<typeof groundDriverShiftListQuerySchema>
type CreateGroundDriverShiftInput = z.infer<typeof insertGroundDriverShiftSchema>
type UpdateGroundDriverShiftInput = z.infer<typeof updateGroundDriverShiftSchema>
type GroundServiceIncidentListQuery = z.infer<typeof groundServiceIncidentListQuerySchema>
type CreateGroundServiceIncidentInput = z.infer<typeof insertGroundServiceIncidentSchema>
type UpdateGroundServiceIncidentInput = z.infer<typeof updateGroundServiceIncidentSchema>
type GroundDispatchCheckpointListQuery = z.infer<typeof groundDispatchCheckpointListQuerySchema>
type CreateGroundDispatchCheckpointInput = z.infer<typeof insertGroundDispatchCheckpointSchema>
type UpdateGroundDispatchCheckpointInput = z.infer<typeof updateGroundDispatchCheckpointSchema>

async function paginate<T extends object>(
  rowsQuery: Promise<T[]>,
  countQuery: Promise<Array<{ count: number }>>,
  limit: number,
  offset: number,
) {
  const [data, countResult] = await Promise.all([rowsQuery, countQuery])
  return { data, total: countResult[0]?.count ?? 0, limit, offset }
}

function toDateOrNull(value: string | null | undefined) {
  return value ? new Date(value) : null
}

export const groundService = {
  async listOperators(db: PostgresJsDatabase, query: GroundOperatorListQuery) {
    const conditions = []
    if (query.supplierId) conditions.push(eq(groundOperators.supplierId, query.supplierId))
    if (query.facilityId) conditions.push(eq(groundOperators.facilityId, query.facilityId))
    if (query.active !== undefined) conditions.push(eq(groundOperators.active, query.active))
    const where = conditions.length > 0 ? and(...conditions) : undefined

    return paginate(
      db
        .select()
        .from(groundOperators)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(asc(groundOperators.name), asc(groundOperators.createdAt)),
      db.select({ count: sql<number>`count(*)::int` }).from(groundOperators).where(where),
      query.limit,
      query.offset,
    )
  },

  async getOperatorById(db: PostgresJsDatabase, id: string) {
    const [row] = await db.select().from(groundOperators).where(eq(groundOperators.id, id)).limit(1)
    return row ?? null
  },

  async createOperator(db: PostgresJsDatabase, data: CreateGroundOperatorInput) {
    const [row] = await db.insert(groundOperators).values(data).returning()
    return row
  },

  async updateOperator(db: PostgresJsDatabase, id: string, data: UpdateGroundOperatorInput) {
    const [row] = await db
      .update(groundOperators)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(groundOperators.id, id))
      .returning()
    return row ?? null
  },

  async deleteOperator(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(groundOperators)
      .where(eq(groundOperators.id, id))
      .returning({ id: groundOperators.id })
    return row ?? null
  },

  async listVehicles(db: PostgresJsDatabase, query: GroundVehicleListQuery) {
    const conditions = []
    if (query.resourceId) conditions.push(eq(groundVehicles.resourceId, query.resourceId))
    if (query.operatorId) conditions.push(eq(groundVehicles.operatorId, query.operatorId))
    if (query.category) conditions.push(eq(groundVehicles.category, query.category))
    if (query.active !== undefined) conditions.push(eq(groundVehicles.active, query.active))
    const where = conditions.length > 0 ? and(...conditions) : undefined

    return paginate(
      db
        .select()
        .from(groundVehicles)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(asc(groundVehicles.createdAt)),
      db.select({ count: sql<number>`count(*)::int` }).from(groundVehicles).where(where),
      query.limit,
      query.offset,
    )
  },

  async getVehicleById(db: PostgresJsDatabase, id: string) {
    const [row] = await db.select().from(groundVehicles).where(eq(groundVehicles.id, id)).limit(1)
    return row ?? null
  },

  async createVehicle(db: PostgresJsDatabase, data: CreateGroundVehicleInput) {
    const [row] = await db.insert(groundVehicles).values(data).returning()
    return row
  },

  async updateVehicle(db: PostgresJsDatabase, id: string, data: UpdateGroundVehicleInput) {
    const [row] = await db
      .update(groundVehicles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(groundVehicles.id, id))
      .returning()
    return row ?? null
  },

  async deleteVehicle(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(groundVehicles)
      .where(eq(groundVehicles.id, id))
      .returning({ id: groundVehicles.id })
    return row ?? null
  },

  async listDrivers(db: PostgresJsDatabase, query: GroundDriverListQuery) {
    const conditions = []
    if (query.resourceId) conditions.push(eq(groundDrivers.resourceId, query.resourceId))
    if (query.operatorId) conditions.push(eq(groundDrivers.operatorId, query.operatorId))
    if (query.active !== undefined) conditions.push(eq(groundDrivers.active, query.active))
    const where = conditions.length > 0 ? and(...conditions) : undefined

    return paginate(
      db
        .select()
        .from(groundDrivers)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(asc(groundDrivers.createdAt)),
      db.select({ count: sql<number>`count(*)::int` }).from(groundDrivers).where(where),
      query.limit,
      query.offset,
    )
  },

  async getDriverById(db: PostgresJsDatabase, id: string) {
    const [row] = await db.select().from(groundDrivers).where(eq(groundDrivers.id, id)).limit(1)
    return row ?? null
  },

  async createDriver(db: PostgresJsDatabase, data: CreateGroundDriverInput) {
    const [row] = await db.insert(groundDrivers).values(data).returning()
    return row
  },

  async updateDriver(db: PostgresJsDatabase, id: string, data: UpdateGroundDriverInput) {
    const [row] = await db
      .update(groundDrivers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(groundDrivers.id, id))
      .returning()
    return row ?? null
  },

  async deleteDriver(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(groundDrivers)
      .where(eq(groundDrivers.id, id))
      .returning({ id: groundDrivers.id })
    return row ?? null
  },

  async listTransferPreferences(db: PostgresJsDatabase, query: GroundTransferPreferenceListQuery) {
    const conditions = []
    if (query.bookingId) {
      conditions.push(eq(groundTransferPreferences.bookingId, query.bookingId))
    }
    if (query.bookingItemId) {
      conditions.push(eq(groundTransferPreferences.bookingItemId, query.bookingItemId))
    }
    if (query.serviceLevel) {
      conditions.push(eq(groundTransferPreferences.serviceLevel, query.serviceLevel))
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined

    return paginate(
      db
        .select()
        .from(groundTransferPreferences)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(asc(groundTransferPreferences.createdAt)),
      db.select({ count: sql<number>`count(*)::int` }).from(groundTransferPreferences).where(where),
      query.limit,
      query.offset,
    )
  },

  async getTransferPreferenceById(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .select()
      .from(groundTransferPreferences)
      .where(eq(groundTransferPreferences.id, id))
      .limit(1)
    return row ?? null
  },

  async createTransferPreference(
    db: PostgresJsDatabase,
    data: CreateGroundTransferPreferenceInput,
  ) {
    const [row] = await db.insert(groundTransferPreferences).values(data).returning()
    return row
  },

  async updateTransferPreference(
    db: PostgresJsDatabase,
    id: string,
    data: UpdateGroundTransferPreferenceInput,
  ) {
    const [row] = await db
      .update(groundTransferPreferences)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(groundTransferPreferences.id, id))
      .returning()
    return row ?? null
  },

  async deleteTransferPreference(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(groundTransferPreferences)
      .where(eq(groundTransferPreferences.id, id))
      .returning({ id: groundTransferPreferences.id })
    return row ?? null
  },

  async listDispatches(db: PostgresJsDatabase, query: GroundDispatchListQuery) {
    const conditions = []
    if (query.transferPreferenceId) {
      conditions.push(eq(groundDispatches.transferPreferenceId, query.transferPreferenceId))
    }
    if (query.bookingId) conditions.push(eq(groundDispatches.bookingId, query.bookingId))
    if (query.bookingItemId)
      conditions.push(eq(groundDispatches.bookingItemId, query.bookingItemId))
    if (query.operatorId) conditions.push(eq(groundDispatches.operatorId, query.operatorId))
    if (query.vehicleId) conditions.push(eq(groundDispatches.vehicleId, query.vehicleId))
    if (query.driverId) conditions.push(eq(groundDispatches.driverId, query.driverId))
    if (query.status) conditions.push(eq(groundDispatches.status, query.status))
    if (query.serviceDate) conditions.push(eq(groundDispatches.serviceDate, query.serviceDate))
    const where = conditions.length > 0 ? and(...conditions) : undefined

    return paginate(
      db
        .select()
        .from(groundDispatches)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(asc(groundDispatches.serviceDate), asc(groundDispatches.createdAt)),
      db.select({ count: sql<number>`count(*)::int` }).from(groundDispatches).where(where),
      query.limit,
      query.offset,
    )
  },

  async getDispatchById(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .select()
      .from(groundDispatches)
      .where(eq(groundDispatches.id, id))
      .limit(1)
    return row ?? null
  },

  async createDispatch(db: PostgresJsDatabase, data: CreateGroundDispatchInput) {
    const { scheduledPickupAt, scheduledDropoffAt, actualPickupAt, actualDropoffAt, ...rest } = data
    const [row] = await db
      .insert(groundDispatches)
      .values({
        ...rest,
        scheduledPickupAt: toDateOrNull(scheduledPickupAt),
        scheduledDropoffAt: toDateOrNull(scheduledDropoffAt),
        actualPickupAt: toDateOrNull(actualPickupAt),
        actualDropoffAt: toDateOrNull(actualDropoffAt),
      })
      .returning()
    return row
  },

  async updateDispatch(db: PostgresJsDatabase, id: string, data: UpdateGroundDispatchInput) {
    const { scheduledPickupAt, scheduledDropoffAt, actualPickupAt, actualDropoffAt, ...rest } = data
    const [row] = await db
      .update(groundDispatches)
      .set({
        ...rest,
        scheduledPickupAt: toDateOrNull(scheduledPickupAt),
        scheduledDropoffAt: toDateOrNull(scheduledDropoffAt),
        actualPickupAt: toDateOrNull(actualPickupAt),
        actualDropoffAt: toDateOrNull(actualDropoffAt),
        updatedAt: new Date(),
      })
      .where(eq(groundDispatches.id, id))
      .returning()
    return row ?? null
  },

  async deleteDispatch(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(groundDispatches)
      .where(eq(groundDispatches.id, id))
      .returning({ id: groundDispatches.id })
    return row ?? null
  },

  async listExecutionEvents(db: PostgresJsDatabase, query: GroundExecutionEventListQuery) {
    const conditions = []
    if (query.dispatchId) conditions.push(eq(groundExecutionEvents.dispatchId, query.dispatchId))
    if (query.eventType) conditions.push(eq(groundExecutionEvents.eventType, query.eventType))
    const where = conditions.length > 0 ? and(...conditions) : undefined

    return paginate(
      db
        .select()
        .from(groundExecutionEvents)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(asc(groundExecutionEvents.occurredAt), asc(groundExecutionEvents.createdAt)),
      db.select({ count: sql<number>`count(*)::int` }).from(groundExecutionEvents).where(where),
      query.limit,
      query.offset,
    )
  },

  async getExecutionEventById(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .select()
      .from(groundExecutionEvents)
      .where(eq(groundExecutionEvents.id, id))
      .limit(1)
    return row ?? null
  },

  async createExecutionEvent(db: PostgresJsDatabase, data: CreateGroundExecutionEventInput) {
    const { occurredAt, ...rest } = data
    const [row] = await db
      .insert(groundExecutionEvents)
      .values({
        ...rest,
        occurredAt: toDateOrNull(occurredAt) ?? new Date(),
      })
      .returning()
    return row
  },

  async updateExecutionEvent(
    db: PostgresJsDatabase,
    id: string,
    data: UpdateGroundExecutionEventInput,
  ) {
    const { occurredAt, ...rest } = data
    const [row] = await db
      .update(groundExecutionEvents)
      .set({
        ...rest,
        occurredAt: occurredAt === undefined ? undefined : (toDateOrNull(occurredAt) ?? new Date()),
      })
      .where(eq(groundExecutionEvents.id, id))
      .returning()
    return row ?? null
  },

  async deleteExecutionEvent(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(groundExecutionEvents)
      .where(eq(groundExecutionEvents.id, id))
      .returning({ id: groundExecutionEvents.id })
    return row ?? null
  },

  async listDispatchAssignments(db: PostgresJsDatabase, query: GroundDispatchAssignmentListQuery) {
    const conditions = []
    if (query.dispatchId)
      conditions.push(eq(groundDispatchAssignments.dispatchId, query.dispatchId))
    if (query.operatorId)
      conditions.push(eq(groundDispatchAssignments.operatorId, query.operatorId))
    if (query.vehicleId) conditions.push(eq(groundDispatchAssignments.vehicleId, query.vehicleId))
    if (query.driverId) conditions.push(eq(groundDispatchAssignments.driverId, query.driverId))
    if (query.assignmentSource)
      conditions.push(eq(groundDispatchAssignments.assignmentSource, query.assignmentSource))
    const where = conditions.length ? and(...conditions) : undefined
    return paginate(
      db
        .select()
        .from(groundDispatchAssignments)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(asc(groundDispatchAssignments.assignedAt)),
      db.select({ count: sql<number>`count(*)::int` }).from(groundDispatchAssignments).where(where),
      query.limit,
      query.offset,
    )
  },

  async getDispatchAssignmentById(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .select()
      .from(groundDispatchAssignments)
      .where(eq(groundDispatchAssignments.id, id))
      .limit(1)
    return row ?? null
  },

  async createDispatchAssignment(
    db: PostgresJsDatabase,
    data: CreateGroundDispatchAssignmentInput,
  ) {
    const [row] = await db
      .insert(groundDispatchAssignments)
      .values({
        ...data,
        assignedAt: toDateOrNull(data.assignedAt) ?? new Date(),
        acceptedAt: toDateOrNull(data.acceptedAt),
      })
      .returning()
    return row
  },

  async updateDispatchAssignment(
    db: PostgresJsDatabase,
    id: string,
    data: UpdateGroundDispatchAssignmentInput,
  ) {
    const [row] = await db
      .update(groundDispatchAssignments)
      .set({
        ...data,
        assignedAt: data.assignedAt ? new Date(data.assignedAt) : undefined,
        acceptedAt: data.acceptedAt ? new Date(data.acceptedAt) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(groundDispatchAssignments.id, id))
      .returning()
    return row ?? null
  },

  async deleteDispatchAssignment(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(groundDispatchAssignments)
      .where(eq(groundDispatchAssignments.id, id))
      .returning({ id: groundDispatchAssignments.id })
    return row ?? null
  },

  async listDispatchLegs(db: PostgresJsDatabase, query: GroundDispatchLegListQuery) {
    const conditions = []
    if (query.dispatchId) conditions.push(eq(groundDispatchLegs.dispatchId, query.dispatchId))
    if (query.legType) conditions.push(eq(groundDispatchLegs.legType, query.legType))
    const where = conditions.length ? and(...conditions) : undefined
    return paginate(
      db
        .select()
        .from(groundDispatchLegs)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(asc(groundDispatchLegs.sequence)),
      db.select({ count: sql<number>`count(*)::int` }).from(groundDispatchLegs).where(where),
      query.limit,
      query.offset,
    )
  },

  async getDispatchLegById(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .select()
      .from(groundDispatchLegs)
      .where(eq(groundDispatchLegs.id, id))
      .limit(1)
    return row ?? null
  },

  async createDispatchLeg(db: PostgresJsDatabase, data: CreateGroundDispatchLegInput) {
    const [row] = await db
      .insert(groundDispatchLegs)
      .values({
        ...data,
        scheduledAt: toDateOrNull(data.scheduledAt),
        actualAt: toDateOrNull(data.actualAt),
      })
      .returning()
    return row
  },

  async updateDispatchLeg(db: PostgresJsDatabase, id: string, data: UpdateGroundDispatchLegInput) {
    const [row] = await db
      .update(groundDispatchLegs)
      .set({
        ...data,
        scheduledAt: toDateOrNull(data.scheduledAt),
        actualAt: toDateOrNull(data.actualAt),
        updatedAt: new Date(),
      })
      .where(eq(groundDispatchLegs.id, id))
      .returning()
    return row ?? null
  },

  async deleteDispatchLeg(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(groundDispatchLegs)
      .where(eq(groundDispatchLegs.id, id))
      .returning({ id: groundDispatchLegs.id })
    return row ?? null
  },

  async listDispatchPassengers(db: PostgresJsDatabase, query: GroundDispatchPassengerListQuery) {
    const conditions = []
    if (query.dispatchId) conditions.push(eq(groundDispatchPassengers.dispatchId, query.dispatchId))
    if (query.participantId)
      conditions.push(eq(groundDispatchPassengers.participantId, query.participantId))
    const where = conditions.length ? and(...conditions) : undefined
    return paginate(
      db
        .select()
        .from(groundDispatchPassengers)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(asc(groundDispatchPassengers.createdAt)),
      db.select({ count: sql<number>`count(*)::int` }).from(groundDispatchPassengers).where(where),
      query.limit,
      query.offset,
    )
  },

  async getDispatchPassengerById(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .select()
      .from(groundDispatchPassengers)
      .where(eq(groundDispatchPassengers.id, id))
      .limit(1)
    return row ?? null
  },

  async createDispatchPassenger(db: PostgresJsDatabase, data: CreateGroundDispatchPassengerInput) {
    const [row] = await db.insert(groundDispatchPassengers).values(data).returning()
    return row
  },

  async updateDispatchPassenger(
    db: PostgresJsDatabase,
    id: string,
    data: UpdateGroundDispatchPassengerInput,
  ) {
    const [row] = await db
      .update(groundDispatchPassengers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(groundDispatchPassengers.id, id))
      .returning()
    return row ?? null
  },

  async deleteDispatchPassenger(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(groundDispatchPassengers)
      .where(eq(groundDispatchPassengers.id, id))
      .returning({ id: groundDispatchPassengers.id })
    return row ?? null
  },

  async listDriverShifts(db: PostgresJsDatabase, query: GroundDriverShiftListQuery) {
    const conditions = []
    if (query.driverId) conditions.push(eq(groundDriverShifts.driverId, query.driverId))
    if (query.operatorId) conditions.push(eq(groundDriverShifts.operatorId, query.operatorId))
    if (query.facilityId) conditions.push(eq(groundDriverShifts.facilityId, query.facilityId))
    if (query.status) conditions.push(eq(groundDriverShifts.status, query.status))
    const where = conditions.length ? and(...conditions) : undefined
    return paginate(
      db
        .select()
        .from(groundDriverShifts)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(asc(groundDriverShifts.startsAt)),
      db.select({ count: sql<number>`count(*)::int` }).from(groundDriverShifts).where(where),
      query.limit,
      query.offset,
    )
  },

  async getDriverShiftById(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .select()
      .from(groundDriverShifts)
      .where(eq(groundDriverShifts.id, id))
      .limit(1)
    return row ?? null
  },

  async createDriverShift(db: PostgresJsDatabase, data: CreateGroundDriverShiftInput) {
    const [row] = await db
      .insert(groundDriverShifts)
      .values({
        ...data,
        startsAt: new Date(data.startsAt),
        endsAt: new Date(data.endsAt),
      })
      .returning()
    return row
  },

  async updateDriverShift(db: PostgresJsDatabase, id: string, data: UpdateGroundDriverShiftInput) {
    const [row] = await db
      .update(groundDriverShifts)
      .set({
        ...data,
        startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
        endsAt: data.endsAt ? new Date(data.endsAt) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(groundDriverShifts.id, id))
      .returning()
    return row ?? null
  },

  async deleteDriverShift(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(groundDriverShifts)
      .where(eq(groundDriverShifts.id, id))
      .returning({ id: groundDriverShifts.id })
    return row ?? null
  },

  async listServiceIncidents(db: PostgresJsDatabase, query: GroundServiceIncidentListQuery) {
    const conditions = []
    if (query.dispatchId) conditions.push(eq(groundServiceIncidents.dispatchId, query.dispatchId))
    if (query.severity) conditions.push(eq(groundServiceIncidents.severity, query.severity))
    if (query.resolutionStatus)
      conditions.push(eq(groundServiceIncidents.resolutionStatus, query.resolutionStatus))
    const where = conditions.length ? and(...conditions) : undefined
    return paginate(
      db
        .select()
        .from(groundServiceIncidents)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(desc(groundServiceIncidents.openedAt)),
      db.select({ count: sql<number>`count(*)::int` }).from(groundServiceIncidents).where(where),
      query.limit,
      query.offset,
    )
  },

  async getServiceIncidentById(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .select()
      .from(groundServiceIncidents)
      .where(eq(groundServiceIncidents.id, id))
      .limit(1)
    return row ?? null
  },

  async createServiceIncident(db: PostgresJsDatabase, data: CreateGroundServiceIncidentInput) {
    const [row] = await db
      .insert(groundServiceIncidents)
      .values({
        ...data,
        openedAt: toDateOrNull(data.openedAt) ?? new Date(),
        resolvedAt: toDateOrNull(data.resolvedAt),
      })
      .returning()
    return row
  },

  async updateServiceIncident(
    db: PostgresJsDatabase,
    id: string,
    data: UpdateGroundServiceIncidentInput,
  ) {
    const [row] = await db
      .update(groundServiceIncidents)
      .set({
        ...data,
        openedAt: data.openedAt ? new Date(data.openedAt) : undefined,
        resolvedAt: data.resolvedAt ? new Date(data.resolvedAt) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(groundServiceIncidents.id, id))
      .returning()
    return row ?? null
  },

  async deleteServiceIncident(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(groundServiceIncidents)
      .where(eq(groundServiceIncidents.id, id))
      .returning({ id: groundServiceIncidents.id })
    return row ?? null
  },

  async listDispatchCheckpoints(db: PostgresJsDatabase, query: GroundDispatchCheckpointListQuery) {
    const conditions = []
    if (query.dispatchId)
      conditions.push(eq(groundDispatchCheckpoints.dispatchId, query.dispatchId))
    if (query.status) conditions.push(eq(groundDispatchCheckpoints.status, query.status))
    const where = conditions.length ? and(...conditions) : undefined
    return paginate(
      db
        .select()
        .from(groundDispatchCheckpoints)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(asc(groundDispatchCheckpoints.sequence)),
      db.select({ count: sql<number>`count(*)::int` }).from(groundDispatchCheckpoints).where(where),
      query.limit,
      query.offset,
    )
  },

  async getDispatchCheckpointById(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .select()
      .from(groundDispatchCheckpoints)
      .where(eq(groundDispatchCheckpoints.id, id))
      .limit(1)
    return row ?? null
  },

  async createDispatchCheckpoint(
    db: PostgresJsDatabase,
    data: CreateGroundDispatchCheckpointInput,
  ) {
    const [row] = await db
      .insert(groundDispatchCheckpoints)
      .values({
        ...data,
        plannedAt: toDateOrNull(data.plannedAt),
        actualAt: toDateOrNull(data.actualAt),
      })
      .returning()
    return row
  },

  async updateDispatchCheckpoint(
    db: PostgresJsDatabase,
    id: string,
    data: UpdateGroundDispatchCheckpointInput,
  ) {
    const [row] = await db
      .update(groundDispatchCheckpoints)
      .set({
        ...data,
        plannedAt: toDateOrNull(data.plannedAt),
        actualAt: toDateOrNull(data.actualAt),
        updatedAt: new Date(),
      })
      .where(eq(groundDispatchCheckpoints.id, id))
      .returning()
    return row ?? null
  },

  async deleteDispatchCheckpoint(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(groundDispatchCheckpoints)
      .where(eq(groundDispatchCheckpoints.id, id))
      .returning({ id: groundDispatchCheckpoints.id })
    return row ?? null
  },
}
