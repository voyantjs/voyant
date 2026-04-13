import {
  bookingDocuments,
  bookingFulfillments,
  bookingItemParticipants,
  bookingItems,
  bookingParticipants,
  bookings,
} from "@voyantjs/bookings/schema"
import { crmService, people } from "@voyantjs/crm"
import { authUser, userProfilesTable } from "@voyantjs/db/schema/iam"
import { identityContactPoints } from "@voyantjs/identity/schema"
import { identityService } from "@voyantjs/identity/service"
import { and, asc, desc, eq, inArray, or, sql } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"

import type {
  BootstrapCustomerPortalInput,
  BootstrapCustomerPortalResult,
  CreateCustomerPortalCompanionInput,
  CustomerPortalBookingDetail,
  CustomerPortalBookingSummary,
  CustomerPortalBootstrapCandidate,
  CustomerPortalCompanion,
  CustomerPortalContactExistsResult,
  CustomerPortalPhoneContactExistsResult,
  CustomerPortalProfile,
  UpdateCustomerPortalCompanionInput,
  UpdateCustomerPortalProfileInput,
} from "./validation-public.js"
import { customerPortalBookingDetailSchema } from "./validation-public.js"

const linkedCustomerSource = "auth.user"
const companionMetadataKind = "companion"

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

function normalizeNullableString(value: string | null | undefined) {
  if (value === undefined) {
    return undefined
  }

  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

function normalizePhone(value: string) {
  return value.trim()
}

function toCustomerCompanion(
  row: Awaited<ReturnType<typeof identityService.listNamedContactsForEntity>>[number],
): CustomerPortalCompanion {
  return {
    id: row.id,
    role: row.role,
    name: row.name,
    title: row.title ?? null,
    email: row.email ?? null,
    phone: row.phone ?? null,
    isPrimary: row.isPrimary,
    notes: row.notes ?? null,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
  }
}

async function getAuthProfileRow(db: PostgresJsDatabase, userId: string) {
  const [row] = await db
    .select({
      id: authUser.id,
      email: authUser.email,
      emailVerified: authUser.emailVerified,
      name: authUser.name,
      image: authUser.image,
      firstName: userProfilesTable.firstName,
      lastName: userProfilesTable.lastName,
      avatarUrl: userProfilesTable.avatarUrl,
      locale: userProfilesTable.locale,
      timezone: userProfilesTable.timezone,
      seatingPreference: userProfilesTable.seatingPreference,
      marketingConsent: userProfilesTable.marketingConsent,
      marketingConsentAt: userProfilesTable.marketingConsentAt,
      notificationDefaults: userProfilesTable.notificationDefaults,
      uiPrefs: userProfilesTable.uiPrefs,
    })
    .from(authUser)
    .leftJoin(userProfilesTable, eq(userProfilesTable.id, authUser.id))
    .where(eq(authUser.id, userId))
    .limit(1)

  return row ?? null
}

async function resolveLinkedCustomerRecordId(
  db: PostgresJsDatabase,
  userId: string,
): Promise<string | null> {
  const [row] = await db
    .select({ id: people.id })
    .from(people)
    .where(and(eq(people.source, linkedCustomerSource), eq(people.sourceRef, userId)))
    .limit(1)

  return row?.id ?? null
}

async function listCustomerRecordCandidatesByEmail(
  db: PostgresJsDatabase,
  email: string,
): Promise<CustomerPortalBootstrapCandidate[]> {
  const normalizedEmail = normalizeEmail(email)
  const rows = await db
    .select({
      id: people.id,
      firstName: people.firstName,
      lastName: people.lastName,
      preferredLanguage: people.preferredLanguage,
      preferredCurrency: people.preferredCurrency,
      birthday: people.birthday,
      relation: people.relation,
      status: people.status,
      source: people.source,
      sourceRef: people.sourceRef,
    })
    .from(people)
    .innerJoin(
      identityContactPoints,
      and(
        eq(identityContactPoints.entityType, "person"),
        eq(identityContactPoints.entityId, people.id),
        eq(identityContactPoints.kind, "email"),
        eq(identityContactPoints.normalizedValue, normalizedEmail),
      ),
    )
    .orderBy(desc(people.updatedAt))

  const uniqueRows = new Map<string, (typeof rows)[number]>()
  for (const row of rows) {
    if (!uniqueRows.has(row.id)) {
      uniqueRows.set(row.id, row)
    }
  }

  const candidates = Array.from(uniqueRows.values()).map((row) => ({
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    preferredLanguage: row.preferredLanguage ?? null,
    preferredCurrency: row.preferredCurrency ?? null,
    birthday: row.birthday ?? null,
    email: normalizedEmail,
    phone: null,
    address: null,
    city: null,
    country: null,
    relation: row.relation ?? null,
    status: row.status,
    claimedByAnotherUser: row.source === linkedCustomerSource && Boolean(row.sourceRef),
    linkable: row.source === linkedCustomerSource ? row.sourceRef == null : row.sourceRef == null,
  }))

  return candidates
}

async function listCustomerRecordCandidatesByPhone(
  db: PostgresJsDatabase,
  phone: string,
): Promise<CustomerPortalBootstrapCandidate[]> {
  const normalizedPhone = normalizePhone(phone)
  const rows = await db
    .select({
      id: people.id,
      firstName: people.firstName,
      lastName: people.lastName,
      preferredLanguage: people.preferredLanguage,
      preferredCurrency: people.preferredCurrency,
      birthday: people.birthday,
      relation: people.relation,
      status: people.status,
      source: people.source,
      sourceRef: people.sourceRef,
    })
    .from(people)
    .innerJoin(
      identityContactPoints,
      and(
        eq(identityContactPoints.entityType, "person"),
        eq(identityContactPoints.entityId, people.id),
        inArray(identityContactPoints.kind, ["phone", "mobile", "whatsapp", "sms"]),
        or(
          eq(identityContactPoints.normalizedValue, normalizedPhone),
          eq(identityContactPoints.value, normalizedPhone),
        ),
      ),
    )
    .orderBy(desc(people.updatedAt))

  const uniqueRows = new Map<string, (typeof rows)[number]>()
  for (const row of rows) {
    if (!uniqueRows.has(row.id)) {
      uniqueRows.set(row.id, row)
    }
  }

  return Array.from(uniqueRows.values()).map((row) => ({
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    preferredLanguage: row.preferredLanguage ?? null,
    preferredCurrency: row.preferredCurrency ?? null,
    birthday: row.birthday ?? null,
    email: null,
    phone: normalizedPhone,
    address: null,
    city: null,
    country: null,
    relation: row.relation ?? null,
    status: row.status,
    claimedByAnotherUser: row.source === linkedCustomerSource && Boolean(row.sourceRef),
    linkable: row.source === linkedCustomerSource ? row.sourceRef == null : row.sourceRef == null,
  }))
}

async function getCustomerRecord(db: PostgresJsDatabase, userId: string) {
  const personId = await resolveLinkedCustomerRecordId(db, userId)
  if (!personId) {
    return null
  }

  const person = await crmService.getPersonById(db, personId)
  if (!person) {
    return null
  }

  return {
    id: person.id,
    firstName: person.firstName,
    lastName: person.lastName,
    preferredLanguage: person.preferredLanguage ?? null,
    preferredCurrency: person.preferredCurrency ?? null,
    birthday: person.birthday ?? null,
    email: person.email ?? null,
    phone: person.phone ?? null,
    address: person.address ?? null,
    city: person.city ?? null,
    country: person.country ?? null,
    relation: person.relation ?? null,
    status: person.status,
  }
}

async function getAccessibleBookingIds(
  db: PostgresJsDatabase,
  params: { userId: string; email: string },
) {
  const linkedPersonId = await resolveLinkedCustomerRecordId(db, params.userId)
  const email = params.email.trim().toLowerCase()

  const [directBookingRows, participantPersonRows, participantEmailRows] = await Promise.all([
    linkedPersonId
      ? db
          .select({ bookingId: bookings.id })
          .from(bookings)
          .where(eq(bookings.personId, linkedPersonId))
      : Promise.resolve([]),
    linkedPersonId
      ? db
          .select({ bookingId: bookingParticipants.bookingId })
          .from(bookingParticipants)
          .where(eq(bookingParticipants.personId, linkedPersonId))
      : Promise.resolve([]),
    db
      .select({ bookingId: bookingParticipants.bookingId })
      .from(bookingParticipants)
      .where(sql`lower(${bookingParticipants.email}) = ${email}`),
  ])

  return Array.from(
    new Set(
      [...directBookingRows, ...participantPersonRows, ...participantEmailRows].map(
        (row) => row.bookingId,
      ),
    ),
  )
}

async function buildBookingDetail(
  db: PostgresJsDatabase,
  bookingId: string,
): Promise<CustomerPortalBookingDetail | null> {
  const [booking] = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1)
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

  return customerPortalBookingDetailSchema.parse({
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
      notes: item.notes ?? null,
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
  })
}

export const publicCustomerPortalService = {
  async contactExists(
    db: PostgresJsDatabase,
    email: string,
  ): Promise<CustomerPortalContactExistsResult> {
    const normalizedEmail = normalizeEmail(email)

    const [authAccount, customerCandidates] = await Promise.all([
      db
        .select({ id: authUser.id })
        .from(authUser)
        .where(sql`lower(${authUser.email}) = ${normalizedEmail}`)
        .limit(1),
      listCustomerRecordCandidatesByEmail(db, normalizedEmail),
    ])

    return {
      email: normalizedEmail,
      authAccountExists: Boolean(authAccount[0]),
      customerRecordExists: customerCandidates.length > 0,
      linkedCustomerRecordExists: customerCandidates.some(
        (candidate) => candidate.claimedByAnotherUser,
      ),
    }
  },

  async phoneContactExists(
    db: PostgresJsDatabase,
    phone: string,
  ): Promise<CustomerPortalPhoneContactExistsResult> {
    const normalizedPhone = normalizePhone(phone)
    const customerCandidates = await listCustomerRecordCandidatesByPhone(db, normalizedPhone)

    return {
      phone: normalizedPhone,
      customerRecordExists: customerCandidates.length > 0,
      linkedCustomerRecordExists: customerCandidates.some(
        (candidate) => candidate.claimedByAnotherUser,
      ),
    }
  },

  async getProfile(db: PostgresJsDatabase, userId: string): Promise<CustomerPortalProfile | null> {
    const [authProfile, customerRecord] = await Promise.all([
      getAuthProfileRow(db, userId),
      getCustomerRecord(db, userId),
    ])

    if (!authProfile) {
      return null
    }

    return {
      userId: authProfile.id,
      email: authProfile.email,
      emailVerified: authProfile.emailVerified,
      firstName: authProfile.firstName ?? null,
      lastName: authProfile.lastName ?? null,
      avatarUrl: authProfile.avatarUrl ?? authProfile.image ?? null,
      locale: authProfile.locale ?? "en",
      timezone: authProfile.timezone ?? null,
      seatingPreference: authProfile.seatingPreference ?? null,
      marketingConsent: authProfile.marketingConsent ?? false,
      marketingConsentAt: normalizeDateTime(authProfile.marketingConsentAt),
      notificationDefaults:
        (authProfile.notificationDefaults as Record<string, unknown> | null) ?? null,
      uiPrefs: (authProfile.uiPrefs as Record<string, unknown> | null) ?? null,
      customerRecord,
    }
  },

  async updateProfile(
    db: PostgresJsDatabase,
    userId: string,
    input: UpdateCustomerPortalProfileInput,
  ): Promise<
    { profile: CustomerPortalProfile } | { error: "not_found" | "customer_record_required" }
  > {
    const authProfile = await getAuthProfileRow(db, userId)
    if (!authProfile) {
      return { error: "not_found" }
    }

    const customerRecordId = await resolveLinkedCustomerRecordId(db, userId)
    if (input.customerRecord && !customerRecordId) {
      return { error: "customer_record_required" }
    }

    const nextFirstName = input.firstName ?? authProfile.firstName ?? null
    const nextLastName = input.lastName ?? authProfile.lastName ?? null
    const nextDisplayName = [nextFirstName, nextLastName].filter(Boolean).join(" ").trim()

    await db
      .insert(userProfilesTable)
      .values({
        id: userId,
        firstName: nextFirstName,
        lastName: nextLastName,
        avatarUrl: input.avatarUrl ?? authProfile.avatarUrl ?? authProfile.image ?? null,
        locale: input.locale ?? authProfile.locale ?? "en",
        timezone: input.timezone !== undefined ? input.timezone : (authProfile.timezone ?? null),
        seatingPreference:
          input.seatingPreference !== undefined
            ? input.seatingPreference
            : (authProfile.seatingPreference ?? null),
        marketingConsent:
          input.marketingConsent !== undefined
            ? input.marketingConsent
            : (authProfile.marketingConsent ?? false),
        marketingConsentAt:
          input.marketingConsent === undefined
            ? (authProfile.marketingConsentAt ?? null)
            : input.marketingConsent
              ? authProfile.marketingConsent
                ? (authProfile.marketingConsentAt ?? new Date())
                : new Date()
              : null,
        notificationDefaults:
          input.notificationDefaults !== undefined
            ? input.notificationDefaults
            : ((authProfile.notificationDefaults as Record<string, unknown> | null) ?? {}),
        uiPrefs:
          input.uiPrefs !== undefined
            ? input.uiPrefs
            : ((authProfile.uiPrefs as Record<string, unknown> | null) ?? {}),
      })
      .onConflictDoUpdate({
        target: userProfilesTable.id,
        set: {
          firstName: nextFirstName,
          lastName: nextLastName,
          avatarUrl: input.avatarUrl ?? authProfile.avatarUrl ?? authProfile.image ?? null,
          locale: input.locale ?? authProfile.locale ?? "en",
          timezone: input.timezone !== undefined ? input.timezone : (authProfile.timezone ?? null),
          seatingPreference:
            input.seatingPreference !== undefined
              ? input.seatingPreference
              : (authProfile.seatingPreference ?? null),
          marketingConsent:
            input.marketingConsent !== undefined
              ? input.marketingConsent
              : (authProfile.marketingConsent ?? false),
          marketingConsentAt:
            input.marketingConsent === undefined
              ? (authProfile.marketingConsentAt ?? null)
              : input.marketingConsent
                ? authProfile.marketingConsent
                  ? (authProfile.marketingConsentAt ?? new Date())
                  : new Date()
                : null,
          notificationDefaults:
            input.notificationDefaults !== undefined
              ? input.notificationDefaults
              : ((authProfile.notificationDefaults as Record<string, unknown> | null) ?? {}),
          uiPrefs:
            input.uiPrefs !== undefined
              ? input.uiPrefs
              : ((authProfile.uiPrefs as Record<string, unknown> | null) ?? {}),
          updatedAt: new Date(),
        },
      })

    await db
      .update(authUser)
      .set({
        name: nextDisplayName || authProfile.name,
        image: input.avatarUrl !== undefined ? input.avatarUrl : (authProfile.image ?? null),
        updatedAt: new Date(),
      })
      .where(eq(authUser.id, userId))

    if (customerRecordId) {
      const nextCustomerRecord = input.customerRecord

      if (nextCustomerRecord || input.firstName !== undefined || input.lastName !== undefined) {
        await crmService.updatePerson(db, customerRecordId, {
          ...(input.firstName !== undefined ? { firstName: input.firstName ?? "" } : {}),
          ...(input.lastName !== undefined ? { lastName: input.lastName ?? "" } : {}),
          ...(nextCustomerRecord?.preferredLanguage !== undefined
            ? { preferredLanguage: nextCustomerRecord.preferredLanguage }
            : {}),
          ...(nextCustomerRecord?.preferredCurrency !== undefined
            ? { preferredCurrency: nextCustomerRecord.preferredCurrency }
            : {}),
          ...(nextCustomerRecord?.birthday !== undefined
            ? { birthday: nextCustomerRecord.birthday }
            : {}),
          ...(nextCustomerRecord?.phone !== undefined ? { phone: nextCustomerRecord.phone } : {}),
          ...(nextCustomerRecord?.address !== undefined
            ? { address: nextCustomerRecord.address }
            : {}),
          ...(nextCustomerRecord?.city !== undefined ? { city: nextCustomerRecord.city } : {}),
          ...(nextCustomerRecord?.country !== undefined
            ? { country: nextCustomerRecord.country }
            : {}),
        })
      }
    }

    const profile = await this.getProfile(db, userId)
    if (!profile) {
      return { error: "not_found" }
    }

    return { profile }
  },

  async bootstrap(
    db: PostgresJsDatabase,
    userId: string,
    input: BootstrapCustomerPortalInput,
  ): Promise<
    | BootstrapCustomerPortalResult
    | { error: "not_found" | "customer_record_not_found" | "customer_record_claimed" }
  > {
    const authProfile = await getAuthProfileRow(db, userId)
    if (!authProfile) {
      return { error: "not_found" }
    }

    const linkedCustomerRecordId = await resolveLinkedCustomerRecordId(db, userId)
    if (linkedCustomerRecordId) {
      const profile = await this.getProfile(db, userId)
      return {
        status: "already_linked",
        profile,
        candidates: [],
      }
    }

    const normalizedEmail = normalizeEmail(authProfile.email)
    const nextFirstName =
      input.firstName ?? authProfile.firstName ?? authProfile.name.split(" ")[0] ?? "Customer"
    const nextLastName =
      input.lastName ?? authProfile.lastName ?? authProfile.name.split(" ").slice(1).join(" ") ?? ""

    if (input.marketingConsent !== undefined) {
      await db
        .insert(userProfilesTable)
        .values({
          id: userId,
          marketingConsent: input.marketingConsent,
          marketingConsentAt: input.marketingConsent ? new Date() : null,
        })
        .onConflictDoUpdate({
          target: userProfilesTable.id,
          set: {
            marketingConsent: input.marketingConsent,
            marketingConsentAt: input.marketingConsent ? new Date() : null,
            updatedAt: new Date(),
          },
        })
    }

    if (input.customerRecordId) {
      const person = await crmService.getPersonById(db, input.customerRecordId)
      if (!person) {
        return { error: "customer_record_not_found" }
      }

      if (
        person.source === linkedCustomerSource &&
        person.sourceRef &&
        person.sourceRef !== userId
      ) {
        return { error: "customer_record_claimed" }
      }

      const updated = await crmService.updatePerson(db, input.customerRecordId, {
        source: linkedCustomerSource,
        sourceRef: userId,
        ...(input.firstName !== undefined ? { firstName: nextFirstName } : {}),
        ...(input.lastName !== undefined ? { lastName: nextLastName } : {}),
        ...(input.customerRecord?.preferredLanguage !== undefined
          ? { preferredLanguage: input.customerRecord.preferredLanguage }
          : {}),
        ...(input.customerRecord?.preferredCurrency !== undefined
          ? { preferredCurrency: input.customerRecord.preferredCurrency }
          : {}),
        ...(input.customerRecord?.birthday !== undefined
          ? { birthday: input.customerRecord.birthday }
          : {}),
        ...(input.customerRecord?.phone !== undefined ? { phone: input.customerRecord.phone } : {}),
        ...(input.customerRecord?.address !== undefined
          ? { address: input.customerRecord.address }
          : {}),
        ...(input.customerRecord?.city !== undefined ? { city: input.customerRecord.city } : {}),
        ...(input.customerRecord?.country !== undefined
          ? { country: input.customerRecord.country }
          : {}),
      })

      if (!updated) {
        return { error: "customer_record_not_found" }
      }

      const profile = await this.getProfile(db, userId)
      return {
        status: "linked_existing_customer",
        profile,
        candidates: [],
      }
    }

    const customerCandidates = await listCustomerRecordCandidatesByEmail(db, normalizedEmail)
    const selectableCandidates = customerCandidates.filter(
      (candidate) => !candidate.claimedByAnotherUser,
    )

    if (selectableCandidates.length > 0) {
      return {
        status: "customer_selection_required",
        profile: null,
        candidates: selectableCandidates,
      }
    }

    if (!input.createCustomerIfMissing) {
      return {
        status: "customer_selection_required",
        profile: null,
        candidates: [],
      }
    }

    const created = await crmService.createPerson(db, {
      firstName: nextFirstName,
      lastName: nextLastName || "Customer",
      preferredLanguage: input.customerRecord?.preferredLanguage ?? authProfile.locale ?? null,
      preferredCurrency: input.customerRecord?.preferredCurrency ?? null,
      birthday: input.customerRecord?.birthday ?? null,
      relation: "client",
      status: "active",
      source: linkedCustomerSource,
      sourceRef: userId,
      tags: [],
      email: normalizedEmail,
      phone: input.customerRecord?.phone ?? null,
      website: null,
      address: input.customerRecord?.address ?? null,
      city: input.customerRecord?.city ?? null,
      country: input.customerRecord?.country ?? null,
    })

    if (!created) {
      return { error: "not_found" }
    }

    const profile = await this.getProfile(db, userId)
    return {
      status: "created_customer",
      profile,
      candidates: [],
    }
  },

  async listCompanions(db: PostgresJsDatabase, userId: string): Promise<CustomerPortalCompanion[]> {
    const personId = await resolveLinkedCustomerRecordId(db, userId)
    if (!personId) {
      return []
    }

    const rows = await identityService.listNamedContactsForEntity(db, "person", personId)
    return rows
      .filter(
        (row) =>
          ((row.metadata as Record<string, unknown> | null)?.kind ?? null) ===
          companionMetadataKind,
      )
      .map(toCustomerCompanion)
  },

  async createCompanion(
    db: PostgresJsDatabase,
    userId: string,
    input: CreateCustomerPortalCompanionInput,
  ): Promise<CustomerPortalCompanion | null> {
    const personId = await resolveLinkedCustomerRecordId(db, userId)
    if (!personId) {
      return null
    }

    const row = await identityService.createNamedContact(db, {
      entityType: "person",
      entityId: personId,
      role: input.role,
      name: input.name,
      title: input.title ?? null,
      email: normalizeNullableString(input.email),
      phone: normalizeNullableString(input.phone),
      isPrimary: input.isPrimary,
      notes: normalizeNullableString(input.notes),
      metadata: {
        kind: companionMetadataKind,
        ...((input.metadata as Record<string, unknown> | null) ?? {}),
      },
    })

    return row ? toCustomerCompanion(row) : null
  },

  async updateCompanion(
    db: PostgresJsDatabase,
    userId: string,
    companionId: string,
    input: UpdateCustomerPortalCompanionInput,
  ): Promise<CustomerPortalCompanion | null | "forbidden"> {
    const personId = await resolveLinkedCustomerRecordId(db, userId)
    if (!personId) {
      return null
    }

    const existing = await identityService.getNamedContactById(db, companionId)
    if (
      !existing ||
      existing.entityType !== "person" ||
      existing.entityId !== personId ||
      ((existing.metadata as Record<string, unknown> | null)?.kind ?? null) !==
        companionMetadataKind
    ) {
      return "forbidden"
    }

    const row = await identityService.updateNamedContact(db, companionId, {
      ...(input.role !== undefined ? { role: input.role } : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.email !== undefined ? { email: normalizeNullableString(input.email) } : {}),
      ...(input.phone !== undefined ? { phone: normalizeNullableString(input.phone) } : {}),
      ...(input.isPrimary !== undefined ? { isPrimary: input.isPrimary } : {}),
      ...(input.notes !== undefined ? { notes: normalizeNullableString(input.notes) } : {}),
      ...(input.metadata !== undefined
        ? {
            metadata: {
              kind: companionMetadataKind,
              ...(input.metadata ?? {}),
            },
          }
        : {}),
    })

    return row ? toCustomerCompanion(row) : null
  },

  async deleteCompanion(
    db: PostgresJsDatabase,
    userId: string,
    companionId: string,
  ): Promise<"deleted" | "not_found" | "forbidden"> {
    const personId = await resolveLinkedCustomerRecordId(db, userId)
    if (!personId) {
      return "not_found"
    }

    const existing = await identityService.getNamedContactById(db, companionId)
    if (!existing) {
      return "not_found"
    }

    if (
      existing.entityType !== "person" ||
      existing.entityId !== personId ||
      ((existing.metadata as Record<string, unknown> | null)?.kind ?? null) !==
        companionMetadataKind
    ) {
      return "forbidden"
    }

    await identityService.deleteNamedContact(db, companionId)
    return "deleted"
  },

  async listBookings(
    db: PostgresJsDatabase,
    userId: string,
  ): Promise<CustomerPortalBookingSummary[] | null> {
    const authProfile = await getAuthProfileRow(db, userId)
    if (!authProfile) {
      return null
    }

    const bookingIds = await getAccessibleBookingIds(db, { userId, email: authProfile.email })
    if (bookingIds.length === 0) {
      return []
    }

    const [bookingRows, participantRows] = await Promise.all([
      db
        .select()
        .from(bookings)
        .where(inArray(bookings.id, bookingIds))
        .orderBy(desc(bookings.createdAt)),
      db
        .select()
        .from(bookingParticipants)
        .where(inArray(bookingParticipants.bookingId, bookingIds))
        .orderBy(asc(bookingParticipants.createdAt)),
    ])

    const participantsByBookingId = new Map<string, typeof participantRows>()
    for (const participant of participantRows) {
      const bucket = participantsByBookingId.get(participant.bookingId) ?? []
      bucket.push(participant)
      participantsByBookingId.set(participant.bookingId, bucket)
    }

    return bookingRows.map((booking) => {
      const participants = participantsByBookingId.get(booking.id) ?? []
      const primaryTraveler =
        participants.find((participant) => participant.isPrimary) ?? participants[0] ?? null

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
        completedAt: normalizeDateTime(booking.completedAt),
        participantCount: participants.length,
        primaryTravelerName: primaryTraveler
          ? `${primaryTraveler.firstName} ${primaryTraveler.lastName}`.trim()
          : null,
      }
    })
  },

  async getBooking(
    db: PostgresJsDatabase,
    userId: string,
    bookingId: string,
  ): Promise<CustomerPortalBookingDetail | null> {
    const authProfile = await getAuthProfileRow(db, userId)
    if (!authProfile) {
      return null
    }

    const linkedPersonId = await resolveLinkedCustomerRecordId(db, userId)
    const authEmail = authProfile.email.trim().toLowerCase()
    const ownershipConditions = [sql`lower(${bookingParticipants.email}) = ${authEmail}`]

    if (linkedPersonId) {
      ownershipConditions.push(eq(bookingParticipants.personId, linkedPersonId))
    }

    const [participantMatch, bookingMatch] = await Promise.all([
      db
        .select({ bookingId: bookingParticipants.bookingId })
        .from(bookingParticipants)
        .where(and(eq(bookingParticipants.bookingId, bookingId), or(...ownershipConditions)))
        .limit(1),
      linkedPersonId
        ? db
            .select({ bookingId: bookings.id })
            .from(bookings)
            .where(and(eq(bookings.id, bookingId), eq(bookings.personId, linkedPersonId)))
            .limit(1)
        : Promise.resolve([]),
    ])

    if (!participantMatch[0] && !bookingMatch[0]) {
      return null
    }

    return buildBookingDetail(db, bookingId)
  },

  async listBookingDocuments(db: PostgresJsDatabase, userId: string, bookingId: string) {
    const detail = await this.getBooking(db, userId, bookingId)
    return detail?.documents ?? null
  },
}
