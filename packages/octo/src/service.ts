import { availabilitySlots, availabilityStartTimes } from "@voyantjs/availability/schema"
import { bookingsService } from "@voyantjs/bookings"
import { productsService } from "@voyantjs/products"
import { offers, orders } from "@voyantjs/transactions/schema"
import {
  bookingAllocations,
  bookingFulfillments,
  bookingItemParticipants,
  bookingItems,
  bookingParticipants,
  bookingRedemptionEvents,
  bookingSupplierStatuses,
  bookings,
} from "@voyantjs/bookings/schema"
import {
  optionUnits,
  productCapabilities,
  productDeliveryFormats,
  productFaqs,
  productFeatures,
  productLocations,
  productOptions,
  products,
} from "@voyantjs/products/schema"
import { and, asc, eq, gte, inArray, lte, sql } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import type { z } from "zod"

import type {
  OctoAvailabilityStatus,
  OctoAvailabilityType,
  OctoBookingStatus,
  OctoProjectedAvailability,
  OctoProjectedBooking,
  OctoProjectedProduct,
  OctoProjectedProductContent,
  OctoProjectedUnit,
  OctoUnitType,
} from "./types.js"
import type {
  octoAvailabilityCalendarQuerySchema,
  octoAvailabilityListQuerySchema,
  octoBookingListQuerySchema,
  octoProductListQuerySchema,
} from "./validation.js"
import { bookingTransactionDetailsRef } from "./transactions-ref.js"

type ProductRow = typeof products.$inferSelect
type OptionRow = typeof productOptions.$inferSelect
type UnitRow = typeof optionUnits.$inferSelect
type SlotRow = typeof availabilitySlots.$inferSelect
type BookingRow = typeof bookings.$inferSelect
type OctoAvailabilityListQuery = z.infer<typeof octoAvailabilityListQuerySchema>
type OctoAvailabilityCalendarQuery = z.infer<typeof octoAvailabilityCalendarQuerySchema>
type OctoProductListQuery = z.infer<typeof octoProductListQuerySchema>
type OctoBookingListQuery = z.infer<typeof octoBookingListQuerySchema>

function toIsoString(value: Date | null | undefined) {
  return value ? value.toISOString() : null
}

function formatLocalDateTime(value: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(value)

  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${lookup.year}-${lookup.month}-${lookup.day}T${lookup.hour}:${lookup.minute}:${lookup.second}`
}

function buildProjectedAvailability(
  slot: SlotRow,
  product: Pick<ProductRow, "capacityMode" | "timezone"> | null | undefined,
): OctoProjectedAvailability {
  const timeZone = slot.timezone || product?.timezone || "UTC"

  return {
    id: slot.id,
    productId: slot.productId,
    optionId: slot.optionId,
    localDateTimeStart: formatLocalDateTime(slot.startsAt, timeZone),
    localDateTimeEnd: slot.endsAt ? formatLocalDateTime(slot.endsAt, timeZone) : null,
    timeZone,
    status: deriveOctoAvailabilityStatus(slot, product?.capacityMode),
    vacancies: slot.unlimited ? null : slot.remainingPax,
    capacity: slot.unlimited ? null : slot.initialPax,
  }
}

export function inferOctoAvailabilityType(
  bookingMode: ProductRow["bookingMode"],
): OctoAvailabilityType {
  return bookingMode === "open" ? "OPENING_HOURS" : "START_TIME"
}

export function inferOctoUnitType(unit: Pick<UnitRow, "name" | "code" | "unitType">): OctoUnitType {
  const haystack = `${unit.code ?? ""} ${unit.name}`.toLowerCase()

  if (haystack.includes("adult")) return "ADULT"
  if (haystack.includes("child")) return "CHILD"
  if (haystack.includes("youth") || haystack.includes("teen")) return "YOUTH"
  if (haystack.includes("infant") || haystack.includes("baby")) return "INFANT"
  if (haystack.includes("family")) return "FAMILY"
  if (haystack.includes("senior")) return "SENIOR"
  if (haystack.includes("student")) return "STUDENT"
  if (haystack.includes("military")) return "MILITARY"

  return unit.unitType === "person" ? "ADULT" : "OTHER"
}

export function deriveOctoAvailabilityStatus(
  slot: Pick<SlotRow, "status" | "unlimited" | "initialPax" | "remainingPax">,
  capacityMode: ProductRow["capacityMode"] | null | undefined,
): OctoAvailabilityStatus {
  if (slot.status === "sold_out") return "SOLD_OUT"
  if (slot.status === "closed" || slot.status === "cancelled") return "CLOSED"
  if (capacityMode === "free_sale" || slot.unlimited) return "FREESALE"

  if (
    slot.initialPax !== null &&
    slot.initialPax !== undefined &&
    slot.remainingPax !== null &&
    slot.remainingPax !== undefined
  ) {
    if (slot.remainingPax <= 0) return "SOLD_OUT"
    if (slot.initialPax > 0 && slot.remainingPax / slot.initialPax < 0.5) return "LIMITED"
  }

  return "AVAILABLE"
}

export function mapBookingStatus(status: BookingRow["status"]): OctoBookingStatus {
  switch (status) {
    case "on_hold":
      return "ON_HOLD"
    case "expired":
      return "EXPIRED"
    case "cancelled":
      return "CANCELLED"
    default:
      return "CONFIRMED"
  }
}

function mapUnit(unit: UnitRow): OctoProjectedUnit {
  return {
    id: unit.id,
    name: unit.name,
    code: unit.code,
    type: inferOctoUnitType(unit),
    restrictions: {
      minAge: unit.minAge ?? undefined,
      maxAge: unit.maxAge ?? undefined,
      minQuantity: unit.minQuantity ?? undefined,
      maxQuantity: unit.maxQuantity ?? undefined,
      occupancyMin: unit.occupancyMin ?? undefined,
      occupancyMax: unit.occupancyMax ?? undefined,
    },
  }
}

function buildProductContent({
  features,
  faqs,
  locations,
}: {
  features: Array<typeof productFeatures.$inferSelect>
  faqs: Array<typeof productFaqs.$inferSelect>
  locations: Array<typeof productLocations.$inferSelect>
}): OctoProjectedProductContent {
  return {
    highlights: features
      .filter((feature) => feature.featureType === "highlight" || feature.featureType === "other")
      .map((feature) => ({
        id: feature.id,
        title: feature.title,
        description: feature.description,
      })),
    inclusions: features
      .filter((feature) => feature.featureType === "inclusion")
      .map((feature) => ({
        id: feature.id,
        title: feature.title,
        description: feature.description,
      })),
    exclusions: features
      .filter((feature) => feature.featureType === "exclusion")
      .map((feature) => ({
        id: feature.id,
        title: feature.title,
        description: feature.description,
      })),
    importantInformation: features
      .filter((feature) => feature.featureType === "important_information")
      .map((feature) => ({
        id: feature.id,
        title: feature.title,
        description: feature.description,
      })),
    faqs: faqs.map((faq) => ({
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
    })),
    locations: locations.map((location) => ({
      id: location.id,
      type: location.locationType,
      title: location.title,
      address: location.address,
      city: location.city,
      countryCode: location.countryCode,
      latitude: location.latitude,
      longitude: location.longitude,
      googlePlaceId: location.googlePlaceId,
      applePlaceId: location.applePlaceId,
      tripadvisorLocationId: location.tripadvisorLocationId,
    })),
  }
}

function pickOptionStartTimes(
  option: OptionRow,
  startTimes: Array<typeof availabilityStartTimes.$inferSelect>,
) {
  const optionTimes = startTimes.filter((startTime) => startTime.optionId === option.id)
  const sharedTimes = startTimes.filter((startTime) => startTime.optionId === null)
  const source = optionTimes.length > 0 ? optionTimes : sharedTimes
  return source.map((startTime) => startTime.startTimeLocal)
}

function pickBookingContact(
  participants: Array<typeof bookingParticipants.$inferSelect>,
) {
  const preferred =
    participants.find((participant) => participant.participantType === "booker") ??
    participants.find((participant) => participant.participantType === "contact") ??
    participants.find((participant) => participant.isPrimary) ??
    participants[0]

  if (!preferred) return null

  return {
    participantId: preferred.id,
    firstName: preferred.firstName,
    lastName: preferred.lastName,
    email: preferred.email,
    phone: preferred.phone,
    language: preferred.preferredLanguage,
  }
}

function pickPayloadString(
  payload: Record<string, unknown> | null | undefined,
  keys: string[],
) {
  if (!payload) return null

  for (const key of keys) {
    const value = payload[key]
    if (typeof value === "string" && value.length > 0) {
      return value
    }
  }

  return null
}

export function mapBookingArtifact(fulfillment: typeof bookingFulfillments.$inferSelect) {
  const payload = fulfillment.payload ?? null
  const artifactUrl = fulfillment.artifactUrl
  const downloadUrl =
    pickPayloadString(payload, ["downloadUrl", "download_url", "url"]) ?? artifactUrl ?? null
  const pdfUrl =
    pickPayloadString(payload, ["pdfUrl", "pdf_url"]) ??
    (fulfillment.fulfillmentType === "pdf" ? artifactUrl : null)
  const qrCode =
    pickPayloadString(payload, ["qrCode", "qr_code"]) ??
    (fulfillment.fulfillmentType === "qr_code"
      ? pickPayloadString(payload, ["code", "voucherCode", "voucher_code"])
      : null)
  const barcode =
    pickPayloadString(payload, ["barcode", "barcodeValue", "barcode_value"]) ??
    (fulfillment.fulfillmentType === "barcode"
      ? pickPayloadString(payload, ["code", "voucherCode", "voucher_code"])
      : null)
  const voucherCode = pickPayloadString(payload, ["voucherCode", "voucher_code", "code"])

  return {
    fulfillmentId: fulfillment.id,
    bookingItemId: fulfillment.bookingItemId,
    participantId: fulfillment.participantId,
    type: fulfillment.fulfillmentType,
    deliveryChannel: fulfillment.deliveryChannel,
    status: fulfillment.status,
    artifactUrl,
    downloadUrl,
    pdfUrl,
    qrCode,
    barcode,
    voucherCode,
    issuedAt: toIsoString(fulfillment.issuedAt),
    revokedAt: toIsoString(fulfillment.revokedAt),
  }
}

export const octoService = {
  async getProjectedProductById(
    db: PostgresJsDatabase,
    id: string,
  ): Promise<OctoProjectedProduct | null> {
    const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1)
    if (!product) return null

    const [options, startTimes, capabilities, deliveryFormats, features, faqs, locations] =
      await Promise.all([
        db
          .select()
          .from(productOptions)
          .where(eq(productOptions.productId, product.id))
          .orderBy(asc(productOptions.sortOrder), asc(productOptions.createdAt)),
        db
          .select()
          .from(availabilityStartTimes)
          .where(eq(availabilityStartTimes.productId, product.id))
          .orderBy(asc(availabilityStartTimes.sortOrder), asc(availabilityStartTimes.createdAt)),
        db
          .select()
          .from(productCapabilities)
          .where(eq(productCapabilities.productId, product.id))
          .orderBy(asc(productCapabilities.createdAt)),
        db
          .select()
          .from(productDeliveryFormats)
          .where(eq(productDeliveryFormats.productId, product.id))
          .orderBy(asc(productDeliveryFormats.createdAt)),
        db
          .select()
          .from(productFeatures)
          .where(eq(productFeatures.productId, product.id))
          .orderBy(asc(productFeatures.sortOrder), asc(productFeatures.createdAt)),
        db
          .select()
          .from(productFaqs)
          .where(eq(productFaqs.productId, product.id))
          .orderBy(asc(productFaqs.sortOrder), asc(productFaqs.createdAt)),
        db
          .select()
          .from(productLocations)
          .where(eq(productLocations.productId, product.id))
          .orderBy(asc(productLocations.sortOrder), asc(productLocations.createdAt)),
      ])

    const optionIds = options.map((option) => option.id)
    const units =
      optionIds.length > 0
        ? await db
            .select()
            .from(optionUnits)
            .where(inArray(optionUnits.optionId, optionIds))
            .orderBy(asc(optionUnits.sortOrder), asc(optionUnits.createdAt))
        : []

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      timeZone: product.timezone,
      availabilityType: inferOctoAvailabilityType(product.bookingMode),
      allowFreesale: product.capacityMode === "free_sale",
      instantConfirmation: capabilities.some(
        (capability) => capability.capability === "instant_confirmation" && capability.enabled,
      ),
      options: options.map((option) => ({
        id: option.id,
        name: option.name,
        code: option.code,
        default: option.isDefault,
        availabilityLocalStartTimes: pickOptionStartTimes(option, startTimes),
        units: units.filter((unit) => unit.optionId === option.id).map(mapUnit),
      })),
      content: buildProductContent({ features, faqs, locations }),
      extensions: {
        status: product.status,
        visibility: product.visibility,
        activated: product.activated,
        facilityId: product.facilityId ?? null,
        bookingMode: product.bookingMode,
        capabilityCodes: capabilities
          .filter((capability) => capability.enabled)
          .map((capability) => capability.capability),
        deliveryFormats: deliveryFormats.map((format) => format.format),
      },
    }
  },

  async getProjectedAvailabilityById(
    db: PostgresJsDatabase,
    id: string,
  ): Promise<OctoProjectedAvailability | null> {
    const [row] = await db.select().from(availabilitySlots).where(eq(availabilitySlots.id, id)).limit(1)
    if (!row) return null

    const [product] = await db
      .select({ capacityMode: products.capacityMode, timezone: products.timezone })
      .from(products)
      .where(eq(products.id, row.productId))
      .limit(1)

    return buildProjectedAvailability(row, product)
  },

  async listProjectedAvailability(db: PostgresJsDatabase, query: OctoAvailabilityListQuery) {
    const conditions = []
    if (query.productId) conditions.push(eq(availabilitySlots.productId, query.productId))
    if (query.optionId) conditions.push(eq(availabilitySlots.optionId, query.optionId))
    if (query.localDateStart) conditions.push(gte(availabilitySlots.dateLocal, query.localDateStart))
    if (query.localDateEnd) conditions.push(lte(availabilitySlots.dateLocal, query.localDateEnd))

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const [rows, countResult] = await Promise.all([
      db
        .select()
        .from(availabilitySlots)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(asc(availabilitySlots.startsAt)),
      db.select({ count: sql<number>`count(*)::int` }).from(availabilitySlots).where(where),
    ])

    const productIds = [...new Set(rows.map((row) => row.productId))]
    const productRows =
      productIds.length > 0
        ? await db
            .select({
              id: products.id,
              capacityMode: products.capacityMode,
              timezone: products.timezone,
            })
            .from(products)
            .where(inArray(products.id, productIds))
        : []

    const productsById = new Map(productRows.map((product) => [product.id, product]))

    return {
      data: rows.map((row) => buildProjectedAvailability(row, productsById.get(row.productId))),
      total: countResult[0]?.count ?? 0,
      limit: query.limit,
      offset: query.offset,
    }
  },

  async getProjectedAvailabilityCalendar(
    db: PostgresJsDatabase,
    productId: string,
    query: OctoAvailabilityCalendarQuery,
  ) {
    const result = await this.listProjectedAvailability(db, {
      productId,
      optionId: query.optionId,
      localDateStart: query.localDateStart,
      localDateEnd: query.localDateEnd,
      limit: 200,
      offset: 0,
    })

    const days = new Map<
      string,
      {
        localDate: string
        status: OctoAvailabilityStatus
        vacancies: number | null
        capacity: number | null
        availabilityIds: string[]
      }
    >()

    const rank: Record<OctoAvailabilityStatus, number> = {
      FREESALE: 5,
      AVAILABLE: 4,
      LIMITED: 3,
      SOLD_OUT: 2,
      CLOSED: 1,
    }

    for (const availability of result.data) {
      const localDate = availability.localDateTimeStart.slice(0, 10)
      const existing = days.get(localDate)
      const nextStatus =
        !existing || rank[availability.status] > rank[existing.status]
          ? availability.status
          : existing.status

      days.set(localDate, {
        localDate,
        status: nextStatus,
        vacancies:
          existing?.vacancies === null || availability.vacancies === null
            ? null
            : Math.max(existing?.vacancies ?? 0, availability.vacancies),
        capacity:
          existing?.capacity === null || availability.capacity === null
            ? null
            : Math.max(existing?.capacity ?? 0, availability.capacity),
        availabilityIds: [...(existing?.availabilityIds ?? []), availability.id],
      })
    }

    return {
      data: [...days.values()].sort((left, right) => left.localDate.localeCompare(right.localDate)),
      total: days.size,
    }
  },

  async listProjectedProducts(db: PostgresJsDatabase, query: OctoProductListQuery) {
    const result = await productsService.listProducts(db, query)
    const data = await Promise.all(
      result.data.map(async (product) => this.getProjectedProductById(db, product.id)),
    )

    return {
      data: data.filter((row): row is OctoProjectedProduct => Boolean(row)),
      total: result.total,
      limit: result.limit,
      offset: result.offset,
    }
  },

  async getProjectedBookingById(
    db: PostgresJsDatabase,
    id: string,
  ): Promise<OctoProjectedBooking | null> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1)
    if (!booking) return null

    const [participants, items, allocations, fulfillments, redemptions, supplierStatuses, transactionLink] =
      await Promise.all([
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
          .select()
          .from(bookingAllocations)
          .where(eq(bookingAllocations.bookingId, booking.id))
          .orderBy(asc(bookingAllocations.createdAt)),
        db
          .select()
          .from(bookingFulfillments)
          .where(eq(bookingFulfillments.bookingId, booking.id))
          .orderBy(asc(bookingFulfillments.createdAt)),
        db
          .select()
          .from(bookingRedemptionEvents)
          .where(eq(bookingRedemptionEvents.bookingId, booking.id))
          .orderBy(asc(bookingRedemptionEvents.redeemedAt), asc(bookingRedemptionEvents.createdAt)),
        db
          .select()
          .from(bookingSupplierStatuses)
          .where(eq(bookingSupplierStatuses.bookingId, booking.id))
          .orderBy(asc(bookingSupplierStatuses.createdAt)),
        db
          .select()
          .from(bookingTransactionDetailsRef)
          .where(eq(bookingTransactionDetailsRef.bookingId, booking.id))
          .limit(1)
          .then((rows) => rows[0] ?? null),
      ])

    const itemParticipants =
      items.length > 0
        ? await db
            .select()
            .from(bookingItemParticipants)
            .where(inArray(bookingItemParticipants.bookingItemId, items.map((item) => item.id)))
            .orderBy(asc(bookingItemParticipants.createdAt))
        : []

    const activeAllocation =
      allocations.find((allocation) => allocation.status === "confirmed") ??
      allocations.find((allocation) => allocation.status === "held") ??
      allocations[0]

    const [offer, order] = await Promise.all([
      transactionLink?.offerId
        ? db
            .select({ id: offers.id, offerNumber: offers.offerNumber })
            .from(offers)
            .where(eq(offers.id, transactionLink.offerId))
            .limit(1)
            .then((rows) => rows[0] ?? null)
        : Promise.resolve(null),
      transactionLink?.orderId
        ? db
            .select({ id: orders.id, orderNumber: orders.orderNumber })
            .from(orders)
            .where(eq(orders.id, transactionLink.orderId))
            .limit(1)
            .then((rows) => rows[0] ?? null)
        : Promise.resolve(null),
    ])

    return {
      id: booking.id,
      bookingNumber: booking.bookingNumber,
      status: mapBookingStatus(booking.status),
      availabilityId: activeAllocation?.availabilitySlotId ?? null,
      contact: pickBookingContact(participants),
      unitItems: items.map((item) => {
        const itemAllocation =
          allocations.find((allocation) => allocation.bookingItemId === item.id) ?? null
        return {
          bookingItemId: item.id,
          title: item.title,
          itemType: item.itemType,
          status: item.status,
          quantity: item.quantity,
          productId: item.productId,
          optionId: item.optionId,
          unitId: item.optionUnitId,
          pricingCategoryId: item.pricingCategoryId,
          availabilityId: itemAllocation?.availabilitySlotId ?? null,
          participantIds: itemParticipants
            .filter((link) => link.bookingItemId === item.id)
            .map((link) => link.participantId),
        }
      }),
      fulfillments: fulfillments.map((fulfillment) => ({
        id: fulfillment.id,
        bookingItemId: fulfillment.bookingItemId,
        participantId: fulfillment.participantId,
        type: fulfillment.fulfillmentType,
        deliveryChannel: fulfillment.deliveryChannel,
        status: fulfillment.status,
        artifactUrl: fulfillment.artifactUrl,
        payload: fulfillment.payload ?? null,
        issuedAt: toIsoString(fulfillment.issuedAt),
        revokedAt: toIsoString(fulfillment.revokedAt),
      })),
      artifacts: fulfillments.map(mapBookingArtifact),
      redemptions: redemptions.map((event) => ({
        id: event.id,
        bookingItemId: event.bookingItemId,
        participantId: event.participantId,
        redeemedAt: event.redeemedAt.toISOString(),
        redeemedBy: event.redeemedBy,
        location: event.location,
        method: event.method,
        metadata: event.metadata ?? null,
      })),
      references: {
        resellerReference: booking.externalBookingRef,
        offerId: offer?.id ?? transactionLink?.offerId ?? null,
        offerNumber: offer?.offerNumber ?? null,
        orderId: order?.id ?? transactionLink?.orderId ?? null,
        orderNumber: order?.orderNumber ?? null,
        supplierReferences: supplierStatuses.map((status) => ({
          id: status.id,
          supplierServiceId: status.supplierServiceId,
          serviceName: status.serviceName,
          status: status.status,
          supplierReference: status.supplierReference,
          confirmedAt: toIsoString(status.confirmedAt),
        })),
      },
      holdExpiresAt: toIsoString(booking.holdExpiresAt),
      confirmedAt: toIsoString(booking.confirmedAt),
      cancelledAt: toIsoString(booking.cancelledAt),
      expiredAt: toIsoString(booking.expiredAt),
      utcRedeemedAt: toIsoString(booking.redeemedAt),
      extensions: {
        sourceType: booking.sourceType,
        externalBookingRef: booking.externalBookingRef,
        communicationLanguage: booking.communicationLanguage,
        personId: booking.personId,
        organizationId: booking.organizationId,
        sellCurrency: booking.sellCurrency,
        baseCurrency: booking.baseCurrency,
      },
    }
  },

  async listProjectedBookings(db: PostgresJsDatabase, query: OctoBookingListQuery) {
    const result = await bookingsService.listBookings(db, query)
    const data = await Promise.all(
      result.data.map(async (booking) => this.getProjectedBookingById(db, booking.id)),
    )

    return {
      data: data.filter((row): row is OctoProjectedBooking => Boolean(row)),
      total: result.total,
      limit: result.limit,
      offset: result.offset,
    }
  },

  async reserveProjectedBooking(
    db: PostgresJsDatabase,
    data: Parameters<typeof bookingsService.reserveBooking>[1],
    userId?: string,
  ) {
    const result = await bookingsService.reserveBooking(db, data, userId)
    if (!("booking" in result) || !result.booking) {
      return result
    }

    const projected = await this.getProjectedBookingById(db, result.booking.id)
    return { status: "ok" as const, booking: projected }
  },

  async confirmProjectedBooking(
    db: PostgresJsDatabase,
    id: string,
    data: Parameters<typeof bookingsService.confirmBooking>[2],
    userId?: string,
  ) {
    const result = await bookingsService.confirmBooking(db, id, data, userId)
    if (!("booking" in result) || !result.booking) {
      return result
    }

    const projected = await this.getProjectedBookingById(db, result.booking.id)
    return { status: "ok" as const, booking: projected }
  },

  async extendProjectedBookingHold(
    db: PostgresJsDatabase,
    id: string,
    data: Parameters<typeof bookingsService.extendBookingHold>[2],
    userId?: string,
  ) {
    const result = await bookingsService.extendBookingHold(db, id, data, userId)
    if (!("booking" in result) || !result.booking) {
      return result
    }

    const projected = await this.getProjectedBookingById(db, result.booking.id)
    return { status: "ok" as const, booking: projected }
  },

  async expireProjectedBooking(
    db: PostgresJsDatabase,
    id: string,
    data: Parameters<typeof bookingsService.expireBooking>[2],
    userId?: string,
  ) {
    const result = await bookingsService.expireBooking(db, id, data, userId)
    if (!("booking" in result) || !result.booking) {
      return result
    }

    const projected = await this.getProjectedBookingById(db, result.booking.id)
    return { status: "ok" as const, booking: projected }
  },

  async cancelProjectedBooking(
    db: PostgresJsDatabase,
    id: string,
    data: Parameters<typeof bookingsService.cancelBooking>[2],
    userId?: string,
  ) {
    const result = await bookingsService.cancelBooking(db, id, data, userId)
    if (!("booking" in result) || !result.booking) {
      return result
    }

    const projected = await this.getProjectedBookingById(db, result.booking.id)
    return { status: "ok" as const, booking: projected }
  },

  async listProjectedRedemptions(db: PostgresJsDatabase, bookingId: string) {
    const events = await bookingsService.listRedemptionEvents(db, bookingId)
    return events.map((event) => ({
      id: event.id,
      bookingItemId: event.bookingItemId,
      participantId: event.participantId,
      redeemedAt: event.redeemedAt.toISOString(),
      redeemedBy: event.redeemedBy,
      location: event.location,
      method: event.method,
      metadata: event.metadata ?? null,
    }))
  },

  async recordProjectedRedemption(
    db: PostgresJsDatabase,
    bookingId: string,
    data: Parameters<typeof bookingsService.recordRedemption>[2],
    userId?: string,
  ) {
    const event = await bookingsService.recordRedemption(db, bookingId, data, userId)
    if (!event) {
      return null
    }

    const booking = await this.getProjectedBookingById(db, bookingId)
    return {
      event: {
        id: event.id,
        bookingItemId: event.bookingItemId,
        participantId: event.participantId,
        redeemedAt: event.redeemedAt.toISOString(),
        redeemedBy: event.redeemedBy,
        location: event.location,
        method: event.method,
        metadata: event.metadata ?? null,
      },
      booking,
    }
  },
}
