import { asc, eq } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"

import {
  bookingAllocations,
  bookingDocuments,
  bookingFulfillments,
  bookingItemParticipants,
  bookingItems,
  bookingParticipants,
  bookings,
} from "./schema.js"
import { bookingsService } from "./service.js"
import type {
  PublicBookingOverviewLookupQuery,
  PublicBookingSessionMutationInput,
  PublicCreateBookingSessionInput,
  PublicUpdateBookingSessionInput,
} from "./validation-public.js"

const travelerParticipantTypes = new Set(["traveler", "occupant"])

function normalizeDate(value: Date | string | null | undefined) {
  if (!value) {
    return null
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10)
  }

  return value
}

function normalizeDateTime(value: Date | string | null | undefined) {
  if (!value) {
    return null
  }

  return value instanceof Date ? value.toISOString() : value
}

function countTravelerParticipants(participants: Array<{ participantType: string }>) {
  return participants.filter((participant) =>
    travelerParticipantTypes.has(participant.participantType),
  ).length
}

async function generateBookingNumber(db: PostgresJsDatabase) {
  const now = new Date()
  const y = now.getFullYear().toString().slice(-2)
  const m = String(now.getMonth() + 1).padStart(2, "0")

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const suffix = String(Math.floor(Math.random() * 900000) + 100000)
    const bookingNumber = `BK-${y}${m}-${suffix}`

    const [existing] = await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(eq(bookings.bookingNumber, bookingNumber))
      .limit(1)

    if (!existing) {
      return bookingNumber
    }
  }

  throw new Error("Unable to generate a unique booking number")
}

async function buildSessionSnapshot(db: PostgresJsDatabase, bookingId: string) {
  const [booking, participants, items, allocations, itemParticipantLinks] = await Promise.all([
    bookingsService.getBookingById(db, bookingId),
    db
      .select()
      .from(bookingParticipants)
      .where(eq(bookingParticipants.bookingId, bookingId))
      .orderBy(asc(bookingParticipants.createdAt)),
    db
      .select()
      .from(bookingItems)
      .where(eq(bookingItems.bookingId, bookingId))
      .orderBy(asc(bookingItems.createdAt)),
    db
      .select()
      .from(bookingAllocations)
      .where(eq(bookingAllocations.bookingId, bookingId))
      .orderBy(asc(bookingAllocations.createdAt)),
    db
      .select({
        id: bookingItemParticipants.id,
        bookingItemId: bookingItemParticipants.bookingItemId,
        participantId: bookingItemParticipants.participantId,
        role: bookingItemParticipants.role,
        isPrimary: bookingItemParticipants.isPrimary,
      })
      .from(bookingItemParticipants)
      .innerJoin(bookingItems, eq(bookingItems.id, bookingItemParticipants.bookingItemId))
      .where(eq(bookingItems.bookingId, bookingId))
      .orderBy(asc(bookingItemParticipants.createdAt)),
  ])

  if (!booking) {
    return null
  }

  const itemLinksByItemId = new Map<
    string,
    Array<{
      id: string
      participantId: string
      role: string
      isPrimary: boolean
    }>
  >()

  for (const link of itemParticipantLinks) {
    const existing = itemLinksByItemId.get(link.bookingItemId) ?? []
    existing.push({
      id: link.id,
      participantId: link.participantId,
      role: link.role,
      isPrimary: link.isPrimary,
    })
    itemLinksByItemId.set(link.bookingItemId, existing)
  }

  const hasParticipants = participants.length > 0
  const hasTraveler = countTravelerParticipants(participants) > 0
  const hasPrimaryParticipant = participants.some((participant) => participant.isPrimary)
  const hasItems = items.length > 0
  const hasAllocations = allocations.length > 0

  return {
    sessionId: booking.id,
    bookingNumber: booking.bookingNumber,
    status: booking.status,
    externalBookingRef: booking.externalBookingRef ?? null,
    communicationLanguage: booking.communicationLanguage ?? null,
    sellCurrency: booking.sellCurrency,
    sellAmountCents: booking.sellAmountCents ?? null,
    startDate: normalizeDate(booking.startDate),
    endDate: normalizeDate(booking.endDate),
    pax: booking.pax ?? null,
    holdExpiresAt: normalizeDateTime(booking.holdExpiresAt),
    confirmedAt: normalizeDateTime(booking.confirmedAt),
    expiredAt: normalizeDateTime(booking.expiredAt),
    cancelledAt: normalizeDateTime(booking.cancelledAt),
    completedAt: normalizeDateTime(booking.completedAt),
    participants: participants.map((participant) => ({
      id: participant.id,
      participantType: participant.participantType,
      travelerCategory: participant.travelerCategory ?? null,
      firstName: participant.firstName,
      lastName: participant.lastName,
      email: participant.email ?? null,
      phone: participant.phone ?? null,
      preferredLanguage: participant.preferredLanguage ?? null,
      accessibilityNeeds: participant.accessibilityNeeds ?? null,
      specialRequests: participant.specialRequests ?? null,
      isPrimary: participant.isPrimary,
      notes: participant.notes ?? null,
    })),
    items: items.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description ?? null,
      itemType: item.itemType,
      status: item.status,
      serviceDate: normalizeDate(item.serviceDate),
      startsAt: normalizeDateTime(item.startsAt),
      endsAt: normalizeDateTime(item.endsAt),
      quantity: item.quantity,
      sellCurrency: item.sellCurrency,
      unitSellAmountCents: item.unitSellAmountCents ?? null,
      totalSellAmountCents: item.totalSellAmountCents ?? null,
      costCurrency: item.costCurrency ?? null,
      unitCostAmountCents: item.unitCostAmountCents ?? null,
      totalCostAmountCents: item.totalCostAmountCents ?? null,
      notes: item.notes ?? null,
      productId: item.productId ?? null,
      optionId: item.optionId ?? null,
      optionUnitId: item.optionUnitId ?? null,
      pricingCategoryId: item.pricingCategoryId ?? null,
      participantLinks: itemLinksByItemId.get(item.id) ?? [],
    })),
    allocations: allocations.map((allocation) => ({
      id: allocation.id,
      bookingItemId: allocation.bookingItemId ?? null,
      productId: allocation.productId ?? null,
      optionId: allocation.optionId ?? null,
      optionUnitId: allocation.optionUnitId ?? null,
      pricingCategoryId: allocation.pricingCategoryId ?? null,
      availabilitySlotId: allocation.availabilitySlotId ?? null,
      quantity: allocation.quantity,
      allocationType: allocation.allocationType,
      status: allocation.status,
      holdExpiresAt: normalizeDateTime(allocation.holdExpiresAt),
      confirmedAt: normalizeDateTime(allocation.confirmedAt),
      releasedAt: normalizeDateTime(allocation.releasedAt),
    })),
    checklist: {
      hasParticipants,
      hasTraveler,
      hasPrimaryParticipant,
      hasItems,
      hasAllocations,
      readyForConfirmation:
        booking.status === "on_hold" &&
        hasParticipants &&
        hasTraveler &&
        hasPrimaryParticipant &&
        hasItems &&
        hasAllocations,
    },
  }
}

export const publicBookingsService = {
  async createSession(
    db: PostgresJsDatabase,
    input: PublicCreateBookingSessionInput,
    userId?: string,
  ) {
    const travelerCount = countTravelerParticipants(input.participants)
    const bookingNumber = await generateBookingNumber(db)
    const result = await bookingsService.reserveBooking(
      db,
      {
        bookingNumber,
        sourceType: "direct",
        externalBookingRef: input.externalBookingRef ?? null,
        communicationLanguage: input.communicationLanguage ?? null,
        sellCurrency: input.sellCurrency,
        baseCurrency: input.baseCurrency ?? null,
        sellAmountCents: input.sellAmountCents ?? null,
        baseSellAmountCents: input.baseSellAmountCents ?? null,
        costAmountCents: input.costAmountCents ?? null,
        baseCostAmountCents: input.baseCostAmountCents ?? null,
        marginPercent: input.marginPercent ?? null,
        startDate: input.startDate ?? null,
        endDate: input.endDate ?? null,
        pax: input.pax ?? (travelerCount > 0 ? travelerCount : null),
        holdMinutes: input.holdMinutes,
        holdExpiresAt: input.holdExpiresAt ?? null,
        items: input.items.map((item) => ({
          ...item,
          sellCurrency: item.sellCurrency ?? input.sellCurrency,
          costCurrency: item.costCurrency ?? null,
          description: item.description ?? null,
          notes: item.notes ?? null,
          productId: item.productId ?? null,
          optionId: item.optionId ?? null,
          optionUnitId: item.optionUnitId ?? null,
          pricingCategoryId: item.pricingCategoryId ?? null,
          sourceSnapshotId: item.sourceSnapshotId ?? null,
          sourceOfferId: null,
          metadata: item.metadata ?? null,
        })),
        internalNotes: null,
      },
      userId,
    )

    if (!("booking" in result) || !result.booking) {
      return result
    }

    for (const participant of input.participants) {
      await bookingsService.createParticipant(
        db,
        result.booking.id,
        {
          participantType: participant.participantType,
          travelerCategory: participant.travelerCategory ?? null,
          firstName: participant.firstName,
          lastName: participant.lastName,
          email: participant.email ?? null,
          phone: participant.phone ?? null,
          preferredLanguage: participant.preferredLanguage ?? null,
          accessibilityNeeds: participant.accessibilityNeeds ?? null,
          specialRequests: participant.specialRequests ?? null,
          isPrimary: participant.isPrimary,
          notes: participant.notes ?? null,
          personId: null,
        },
        userId,
      )
    }

    const session = await buildSessionSnapshot(db, result.booking.id)
    return session ? { status: "ok" as const, session } : { status: "not_found" as const }
  },

  getSessionById(db: PostgresJsDatabase, bookingId: string) {
    return buildSessionSnapshot(db, bookingId)
  },

  async updateSession(
    db: PostgresJsDatabase,
    bookingId: string,
    input: PublicUpdateBookingSessionInput,
    userId?: string,
  ) {
    const booking = await bookingsService.getBookingById(db, bookingId)
    if (!booking) {
      return { status: "not_found" as const }
    }

    if (
      input.externalBookingRef !== undefined ||
      input.communicationLanguage !== undefined ||
      input.pax !== undefined
    ) {
      await bookingsService.updateBooking(db, bookingId, {
        externalBookingRef: input.externalBookingRef,
        communicationLanguage: input.communicationLanguage,
        pax: input.pax,
      })
    }

    for (const participantId of input.removedParticipantIds) {
      const participant = await bookingsService.getParticipantById(db, bookingId, participantId)
      if (participant) {
        await bookingsService.deleteParticipant(db, participant.id)
      }
    }

    if (input.participants) {
      for (const participant of input.participants) {
        if (participant.id) {
          const existing = await bookingsService.getParticipantById(db, bookingId, participant.id)
          if (!existing) {
            return { status: "participant_not_found" as const }
          }

          await bookingsService.updateParticipant(db, participant.id, {
            participantType: participant.participantType,
            travelerCategory: participant.travelerCategory ?? null,
            firstName: participant.firstName,
            lastName: participant.lastName,
            email: participant.email ?? null,
            phone: participant.phone ?? null,
            preferredLanguage: participant.preferredLanguage ?? null,
            accessibilityNeeds: participant.accessibilityNeeds ?? null,
            specialRequests: participant.specialRequests ?? null,
            isPrimary: participant.isPrimary,
            notes: participant.notes ?? null,
          })
          continue
        }

        await bookingsService.createParticipant(
          db,
          bookingId,
          {
            participantType: participant.participantType,
            travelerCategory: participant.travelerCategory ?? null,
            firstName: participant.firstName,
            lastName: participant.lastName,
            email: participant.email ?? null,
            phone: participant.phone ?? null,
            preferredLanguage: participant.preferredLanguage ?? null,
            accessibilityNeeds: participant.accessibilityNeeds ?? null,
            specialRequests: participant.specialRequests ?? null,
            isPrimary: participant.isPrimary,
            notes: participant.notes ?? null,
            personId: null,
          },
          userId,
        )
      }
    }

    if (input.holdMinutes !== undefined || input.holdExpiresAt !== undefined) {
      const holdResult = await bookingsService.extendBookingHold(
        db,
        bookingId,
        {
          holdMinutes: input.holdMinutes,
          holdExpiresAt: input.holdExpiresAt,
        },
        userId,
      )

      if (holdResult.status !== "ok") {
        return holdResult
      }
    }

    if (input.pax === undefined && (input.participants || input.removedParticipantIds.length > 0)) {
      const participants = await db
        .select({ participantType: bookingParticipants.participantType })
        .from(bookingParticipants)
        .where(eq(bookingParticipants.bookingId, bookingId))
      const travelerCount = countTravelerParticipants(participants)
      await bookingsService.updateBooking(db, bookingId, {
        pax: travelerCount > 0 ? travelerCount : null,
      })
    }

    const session = await buildSessionSnapshot(db, bookingId)
    return session ? { status: "ok" as const, session } : { status: "not_found" as const }
  },

  async confirmSession(
    db: PostgresJsDatabase,
    bookingId: string,
    input: PublicBookingSessionMutationInput,
    userId?: string,
  ) {
    const result = await bookingsService.confirmBooking(db, bookingId, input, userId)
    if (result.status !== "ok") {
      return result
    }

    const session = await buildSessionSnapshot(db, bookingId)
    return session ? { status: "ok" as const, session } : { status: "not_found" as const }
  },

  async expireSession(
    db: PostgresJsDatabase,
    bookingId: string,
    input: PublicBookingSessionMutationInput,
    userId?: string,
  ) {
    const result = await bookingsService.expireBooking(db, bookingId, input, userId)
    if (result.status !== "ok") {
      return result
    }

    const session = await buildSessionSnapshot(db, bookingId)
    return session ? { status: "ok" as const, session } : { status: "not_found" as const }
  },

  async getOverview(db: PostgresJsDatabase, query: PublicBookingOverviewLookupQuery) {
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.bookingNumber, query.bookingNumber))
      .limit(1)

    if (!booking) {
      return null
    }

    const [participants, items, itemParticipantLinks, documents, fulfillments] = await Promise.all([
      db
        .select()
        .from(bookingParticipants)
        .where(eq(bookingParticipants.bookingId, booking.id))
        .orderBy(asc(bookingParticipants.createdAt)),
      db
        .select()
        .from(bookingItems)
        .where(eq(bookingItems.bookingId, booking.id))
        .orderBy(asc(bookingItems.createdAt)),
      db
        .select({
          id: bookingItemParticipants.id,
          bookingItemId: bookingItemParticipants.bookingItemId,
          participantId: bookingItemParticipants.participantId,
          role: bookingItemParticipants.role,
          isPrimary: bookingItemParticipants.isPrimary,
        })
        .from(bookingItemParticipants)
        .innerJoin(bookingItems, eq(bookingItems.id, bookingItemParticipants.bookingItemId))
        .where(eq(bookingItems.bookingId, booking.id))
        .orderBy(asc(bookingItemParticipants.createdAt)),
      db
        .select()
        .from(bookingDocuments)
        .where(eq(bookingDocuments.bookingId, booking.id))
        .orderBy(asc(bookingDocuments.createdAt)),
      db
        .select()
        .from(bookingFulfillments)
        .where(eq(bookingFulfillments.bookingId, booking.id))
        .orderBy(asc(bookingFulfillments.createdAt)),
    ])

    const email = query.email.trim().toLowerCase()
    const authorized = participants.some(
      (participant) => participant.email?.toLowerCase() === email,
    )
    if (!authorized) {
      return null
    }

    const itemLinksByItemId = new Map<
      string,
      Array<{
        id: string
        participantId: string
        role: string
        isPrimary: boolean
      }>
    >()

    for (const link of itemParticipantLinks) {
      const existing = itemLinksByItemId.get(link.bookingItemId) ?? []
      existing.push({
        id: link.id,
        participantId: link.participantId,
        role: link.role,
        isPrimary: link.isPrimary,
      })
      itemLinksByItemId.set(link.bookingItemId, existing)
    }

    return {
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
      status: booking.status,
      sellCurrency: booking.sellCurrency,
      sellAmountCents: booking.sellAmountCents ?? null,
      startDate: normalizeDate(booking.startDate),
      endDate: normalizeDate(booking.endDate),
      pax: booking.pax ?? null,
      confirmedAt: normalizeDateTime(booking.confirmedAt),
      cancelledAt: normalizeDateTime(booking.cancelledAt),
      completedAt: normalizeDateTime(booking.completedAt),
      participants: participants.map((participant) => ({
        id: participant.id,
        participantType: participant.participantType,
        firstName: participant.firstName,
        lastName: participant.lastName,
        isPrimary: participant.isPrimary,
      })),
      items: items.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description ?? null,
        itemType: item.itemType,
        status: item.status,
        serviceDate: normalizeDate(item.serviceDate),
        startsAt: normalizeDateTime(item.startsAt),
        endsAt: normalizeDateTime(item.endsAt),
        quantity: item.quantity,
        sellCurrency: item.sellCurrency,
        unitSellAmountCents: item.unitSellAmountCents ?? null,
        totalSellAmountCents: item.totalSellAmountCents ?? null,
        costCurrency: item.costCurrency ?? null,
        unitCostAmountCents: item.unitCostAmountCents ?? null,
        totalCostAmountCents: item.totalCostAmountCents ?? null,
        notes: item.notes ?? null,
        productId: item.productId ?? null,
        optionId: item.optionId ?? null,
        optionUnitId: item.optionUnitId ?? null,
        pricingCategoryId: item.pricingCategoryId ?? null,
        participantLinks: itemLinksByItemId.get(item.id) ?? [],
      })),
      documents: documents.map((document) => ({
        id: document.id,
        participantId: document.participantId ?? null,
        type: document.type,
        fileName: document.fileName,
        fileUrl: document.fileUrl,
      })),
      fulfillments: fulfillments.map((fulfillment) => ({
        id: fulfillment.id,
        bookingItemId: fulfillment.bookingItemId ?? null,
        participantId: fulfillment.participantId ?? null,
        fulfillmentType: fulfillment.fulfillmentType,
        deliveryChannel: fulfillment.deliveryChannel,
        status: fulfillment.status,
        artifactUrl: fulfillment.artifactUrl ?? null,
      })),
    }
  },
}
