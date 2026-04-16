import { and, asc, eq, inArray, sql } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import type { z } from "zod"
import { type Booking, type BookingPassenger, bookingPassengers, bookings } from "./schema-core.js"
import {
  type BookingGroup,
  type BookingGroupMember,
  bookingGroupMembers,
  bookingGroups,
} from "./schema-groups.js"
import type {
  addBookingGroupMemberSchema,
  bookingGroupListQuerySchema,
  insertBookingGroupSchema,
  updateBookingGroupSchema,
} from "./validation.js"

export type BookingGroupListQuery = z.infer<typeof bookingGroupListQuerySchema>
export type CreateBookingGroupInput = z.infer<typeof insertBookingGroupSchema>
export type UpdateBookingGroupInput = z.infer<typeof updateBookingGroupSchema>
export type AddBookingGroupMemberInput = z.infer<typeof addBookingGroupMemberSchema>

export type BookingGroupMemberWithBooking = BookingGroupMember & {
  booking: Booking | null
}

export async function listBookingGroups(
  db: PostgresJsDatabase,
  query: BookingGroupListQuery,
): Promise<{ data: BookingGroup[]; total: number; limit: number; offset: number }> {
  const conditions = []
  if (query.kind) conditions.push(eq(bookingGroups.kind, query.kind))
  if (query.productId) conditions.push(eq(bookingGroups.productId, query.productId))
  if (query.optionUnitId) conditions.push(eq(bookingGroups.optionUnitId, query.optionUnitId))
  const where = conditions.length ? and(...conditions) : undefined

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(bookingGroups)
      .where(where)
      .limit(query.limit)
      .offset(query.offset)
      .orderBy(asc(bookingGroups.createdAt)),
    db.select({ count: sql<number>`count(*)::int` }).from(bookingGroups).where(where),
  ])

  return {
    data: rows,
    total: countResult[0]?.count ?? 0,
    limit: query.limit,
    offset: query.offset,
  }
}

export async function getBookingGroupById(
  db: PostgresJsDatabase,
  id: string,
): Promise<BookingGroup | null> {
  const [row] = await db.select().from(bookingGroups).where(eq(bookingGroups.id, id)).limit(1)
  return row ?? null
}

export async function createBookingGroup(
  db: PostgresJsDatabase,
  data: CreateBookingGroupInput,
): Promise<BookingGroup> {
  const [row] = await db.insert(bookingGroups).values(data).returning()
  if (!row) throw new Error("Failed to create booking group")
  return row
}

export async function updateBookingGroup(
  db: PostgresJsDatabase,
  id: string,
  data: UpdateBookingGroupInput,
): Promise<BookingGroup | null> {
  const [row] = await db
    .update(bookingGroups)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(bookingGroups.id, id))
    .returning()
  return row ?? null
}

export async function deleteBookingGroup(
  db: PostgresJsDatabase,
  id: string,
): Promise<{ id: string } | null> {
  const [row] = await db
    .delete(bookingGroups)
    .where(eq(bookingGroups.id, id))
    .returning({ id: bookingGroups.id })
  return row ?? null
}

export async function listGroupMembers(
  db: PostgresJsDatabase,
  groupId: string,
): Promise<BookingGroupMemberWithBooking[]> {
  const rows = await db
    .select()
    .from(bookingGroupMembers)
    .where(eq(bookingGroupMembers.groupId, groupId))
    .orderBy(asc(bookingGroupMembers.createdAt))

  if (rows.length === 0) return []

  const bookingIds = rows.map((r) => r.bookingId)
  const bookingRows = await db.select().from(bookings).where(inArray(bookings.id, bookingIds))

  const bookingMap = new Map(bookingRows.map((b) => [b.id, b]))

  return rows.map((member) => ({
    ...member,
    booking: bookingMap.get(member.bookingId) ?? null,
  }))
}

export async function getBookingGroupForBooking(
  db: PostgresJsDatabase,
  bookingId: string,
): Promise<(BookingGroup & { membership: BookingGroupMember }) | null> {
  const [membership] = await db
    .select()
    .from(bookingGroupMembers)
    .where(eq(bookingGroupMembers.bookingId, bookingId))
    .limit(1)

  if (!membership) return null

  const [group] = await db
    .select()
    .from(bookingGroups)
    .where(eq(bookingGroups.id, membership.groupId))
    .limit(1)

  if (!group) return null

  return { ...group, membership }
}

export async function addGroupMember(
  db: PostgresJsDatabase,
  groupId: string,
  data: AddBookingGroupMemberInput,
): Promise<
  | { status: "ok"; member: BookingGroupMember }
  | { status: "group_not_found" }
  | { status: "booking_not_found" }
  | { status: "already_in_group"; currentGroupId: string }
> {
  const [group] = await db
    .select({ id: bookingGroups.id })
    .from(bookingGroups)
    .where(eq(bookingGroups.id, groupId))
    .limit(1)
  if (!group) return { status: "group_not_found" }

  const [booking] = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(eq(bookings.id, data.bookingId))
    .limit(1)
  if (!booking) return { status: "booking_not_found" }

  const [existing] = await db
    .select({ groupId: bookingGroupMembers.groupId })
    .from(bookingGroupMembers)
    .where(eq(bookingGroupMembers.bookingId, data.bookingId))
    .limit(1)
  if (existing) {
    return { status: "already_in_group", currentGroupId: existing.groupId }
  }

  const [member] = await db
    .insert(bookingGroupMembers)
    .values({
      groupId,
      bookingId: data.bookingId,
      role: data.role,
    })
    .returning()

  if (!member) throw new Error("Failed to add group member")
  return { status: "ok", member }
}

export async function removeGroupMember(
  db: PostgresJsDatabase,
  groupId: string,
  bookingId: string,
): Promise<{ id: string } | null> {
  const [row] = await db
    .delete(bookingGroupMembers)
    .where(
      and(eq(bookingGroupMembers.groupId, groupId), eq(bookingGroupMembers.bookingId, bookingId)),
    )
    .returning({ id: bookingGroupMembers.id })
  return row ?? null
}

/**
 * Dissolve or slim down a booking group after a member is cancelled.
 *
 * - 3+ active members remain: no-op (group stays intact)
 * - 1 active member remains: dissolve (delete last member + group)
 * - 0 active members remain: delete the group
 */
export async function cleanupGroupOnBookingCancelled(
  db: PostgresJsDatabase,
  bookingId: string,
): Promise<void> {
  const [membership] = await db
    .select()
    .from(bookingGroupMembers)
    .where(eq(bookingGroupMembers.bookingId, bookingId))
    .limit(1)

  if (!membership) return

  // Remove the cancelled booking's membership
  await db.delete(bookingGroupMembers).where(eq(bookingGroupMembers.id, membership.id))

  // Count remaining members with an active (not-cancelled) booking
  const remaining = await db
    .select({
      memberId: bookingGroupMembers.id,
      bookingId: bookingGroupMembers.bookingId,
      status: bookings.status,
    })
    .from(bookingGroupMembers)
    .innerJoin(bookings, eq(bookings.id, bookingGroupMembers.bookingId))
    .where(eq(bookingGroupMembers.groupId, membership.groupId))

  const active = remaining.filter((r) => r.status !== "cancelled")

  if (active.length === 0) {
    // No active members — delete the group (cascades any non-active members)
    await db.delete(bookingGroups).where(eq(bookingGroups.id, membership.groupId))
    return
  }

  if (active.length === 1) {
    // Only one active member left — dissolve the group
    await db.delete(bookingGroupMembers).where(eq(bookingGroupMembers.groupId, membership.groupId))
    await db.delete(bookingGroups).where(eq(bookingGroups.id, membership.groupId))
  }
}

/**
 * Returns all passengers across every member booking in a group.
 * Used by rooming-list exports to show shared-room occupants as one unit.
 */
export async function listGroupBookingPassengers(
  db: PostgresJsDatabase,
  groupId: string,
): Promise<BookingPassenger[]> {
  const members = await db
    .select({ bookingId: bookingGroupMembers.bookingId })
    .from(bookingGroupMembers)
    .where(eq(bookingGroupMembers.groupId, groupId))

  if (members.length === 0) return []

  const bookingIds = members.map((m) => m.bookingId)
  return db
    .select()
    .from(bookingPassengers)
    .where(inArray(bookingPassengers.bookingId, bookingIds))
    .orderBy(asc(bookingPassengers.createdAt))
}

export const bookingGroupsService = {
  listBookingGroups,
  getBookingGroupById,
  createBookingGroup,
  updateBookingGroup,
  deleteBookingGroup,
  listGroupMembers,
  getBookingGroupForBooking,
  addGroupMember,
  removeGroupMember,
  cleanupGroupOnBookingCancelled,
  listGroupBookingPassengers,
}
