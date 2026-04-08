import { identityAddresses, identityContactPoints } from "@voyantjs/identity/schema"
import { identityService } from "@voyantjs/identity/service"
import type {
  insertAddressSchema,
  insertContactPointSchema,
  updateAddressSchema,
  updateContactPointSchema,
} from "@voyantjs/identity/validation"
import { and, desc, eq, gte, ilike, inArray, lte, or, sql } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import type { z } from "zod"

import {
  communicationLog,
  organizationNotes,
  organizations,
  people,
  personNotes,
  segments,
} from "../schema.js"
import type {
  communicationListQuerySchema,
  insertCommunicationLogSchema,
  insertOrganizationNoteSchema,
  insertOrganizationSchema,
  insertPersonNoteSchema,
  insertPersonSchema,
  insertSegmentSchema,
  organizationListQuerySchema,
  personListQuerySchema,
  updateOrganizationSchema,
  updatePersonSchema,
} from "../validation.js"
import {
  formatAddress,
  isManagedBySource,
  normalizeContactValue,
  paginate,
  toNullableTrimmed,
} from "./helpers.js"

type OrganizationListQuery = z.infer<typeof organizationListQuerySchema>
type CreateOrganizationInput = z.infer<typeof insertOrganizationSchema>
type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>
type PersonListQuery = z.infer<typeof personListQuerySchema>
type CreatePersonInput = z.infer<typeof insertPersonSchema>
type UpdatePersonInput = z.infer<typeof updatePersonSchema>
type CreateContactPointInput = z.infer<typeof insertContactPointSchema>
type UpdateContactPointInput = z.infer<typeof updateContactPointSchema>
type CreateAddressInput = z.infer<typeof insertAddressSchema>
type UpdateAddressInput = z.infer<typeof updateAddressSchema>
type CreatePersonNoteInput = z.infer<typeof insertPersonNoteSchema>
type CreateOrganizationNoteInput = z.infer<typeof insertOrganizationNoteSchema>
type CreateCommunicationLogInput = z.infer<typeof insertCommunicationLogSchema>
type CommunicationListQuery = z.infer<typeof communicationListQuerySchema>
type CreateSegmentInput = z.infer<typeof insertSegmentSchema>

const organizationEntityType = "organization"
const personEntityType = "person"
const personBaseIdentitySource = "crm.person.base"

type PersonIdentityInput = Pick<
  CreatePersonInput,
  "email" | "phone" | "website" | "address" | "city" | "country"
>

type PersonHydratedFields = {
  email: string | null
  phone: string | null
  website: string | null
  address: string | null
  city: string | null
  country: string | null
}

function personBaseFields(data: CreatePersonInput | UpdatePersonInput) {
  return {
    organizationId: data.organizationId,
    firstName: data.firstName,
    lastName: data.lastName,
    jobTitle: data.jobTitle,
    relation: data.relation,
    preferredLanguage: data.preferredLanguage,
    preferredCurrency: data.preferredCurrency,
    ownerId: data.ownerId,
    status: data.status,
    source: data.source,
    sourceRef: data.sourceRef,
    tags: data.tags,
    birthday: data.birthday,
    notes: data.notes,
  }
}

async function syncPersonIdentity(
  db: PostgresJsDatabase,
  personId: string,
  data: PersonIdentityInput,
) {
  const existingContactPoints = await identityService.listContactPointsForEntity(
    db,
    personEntityType,
    personId,
  )
  const existingAddresses = await identityService.listAddressesForEntity(
    db,
    personEntityType,
    personId,
  )

  const managedContactPoints = existingContactPoints.filter((point) =>
    isManagedBySource(point.metadata as Record<string, unknown> | null, personBaseIdentitySource),
  )
  const managedAddress = existingAddresses.find((address) =>
    isManagedBySource(address.metadata as Record<string, unknown> | null, personBaseIdentitySource),
  )

  for (const [kind, rawValue] of Object.entries({
    email: data.email,
    phone: data.phone,
    website: data.website,
  }) as Array<["email" | "phone" | "website", string | null | undefined]>) {
    const value = toNullableTrimmed(rawValue)
    const existing =
      managedContactPoints.find((point) => point.kind === kind) ??
      existingContactPoints.find((point) => point.kind === kind && point.isPrimary)

    if (!value) {
      if (existing) {
        await identityService.deleteContactPoint(db, existing.id)
      }
      continue
    }

    const payload = {
      entityType: personEntityType,
      entityId: personId,
      kind,
      label: kind === "website" ? "website" : "primary",
      value,
      normalizedValue: normalizeContactValue(kind, value),
      isPrimary: true,
      metadata: { managedBy: personBaseIdentitySource },
    }

    if (existing) {
      await identityService.updateContactPoint(db, existing.id, payload)
    } else {
      await identityService.createContactPoint(db, payload)
    }
  }

  const addressLine = toNullableTrimmed(data.address)
  const city = toNullableTrimmed(data.city)
  const country = toNullableTrimmed(data.country)
  const hasAddress = Boolean(addressLine || city || country)

  if (!hasAddress) {
    if (managedAddress) {
      await identityService.deleteAddress(db, managedAddress.id)
    }
    return
  }

  const addressPayload = {
    entityType: personEntityType,
    entityId: personId,
    label: "primary" as const,
    fullText: addressLine,
    line1: addressLine,
    city,
    country,
    isPrimary: true,
    metadata: { managedBy: personBaseIdentitySource },
  }

  if (managedAddress) {
    await identityService.updateAddress(db, managedAddress.id, addressPayload)
  } else {
    await identityService.createAddress(db, addressPayload)
  }
}

async function deletePersonIdentity(db: PostgresJsDatabase, personId: string) {
  const [contactPoints, addresses] = await Promise.all([
    identityService.listContactPointsForEntity(db, personEntityType, personId),
    identityService.listAddressesForEntity(db, personEntityType, personId),
  ])

  await Promise.all([
    ...contactPoints.map((point) => identityService.deleteContactPoint(db, point.id)),
    ...addresses.map((address) => identityService.deleteAddress(db, address.id)),
  ])
}

async function hydratePeople<T extends { id: string }>(
  db: PostgresJsDatabase,
  rows: T[],
): Promise<Array<T & PersonHydratedFields>> {
  if (rows.length === 0) {
    return rows.map((row) => ({
      ...row,
      email: null,
      phone: null,
      website: null,
      address: null,
      city: null,
      country: null,
    }))
  }

  const ids = rows.map((row) => row.id)
  const [contactPoints, addresses] = await Promise.all([
    db
      .select()
      .from(identityContactPoints)
      .where(
        and(
          eq(identityContactPoints.entityType, personEntityType),
          inArray(identityContactPoints.entityId, ids),
        ),
      ),
    db
      .select()
      .from(identityAddresses)
      .where(
        and(
          eq(identityAddresses.entityType, personEntityType),
          inArray(identityAddresses.entityId, ids),
        ),
      ),
  ])

  const contactPointMap = new Map<string, typeof contactPoints>()
  const addressMap = new Map<string, typeof addresses>()

  for (const point of contactPoints) {
    const bucket = contactPointMap.get(point.entityId) ?? []
    bucket.push(point)
    contactPointMap.set(point.entityId, bucket)
  }

  for (const address of addresses) {
    const bucket = addressMap.get(address.entityId) ?? []
    bucket.push(address)
    addressMap.set(address.entityId, bucket)
  }

  return rows.map((row) => {
    const entityContactPoints = contactPointMap.get(row.id) ?? []
    const entityAddresses = addressMap.get(row.id) ?? []

    const findPrimaryContactPoint = (kind: "email" | "phone" | "website") =>
      entityContactPoints.find((point) => point.kind === kind && point.isPrimary) ??
      entityContactPoints.find((point) => point.kind === kind) ??
      null

    const primaryAddress =
      entityAddresses.find((address) => address.isPrimary) ?? entityAddresses[0] ?? null

    return {
      ...row,
      email: findPrimaryContactPoint("email")?.value ?? null,
      phone: findPrimaryContactPoint("phone")?.value ?? null,
      website: findPrimaryContactPoint("website")?.value ?? null,
      address: primaryAddress ? formatAddress(primaryAddress) : null,
      city: primaryAddress?.city ?? null,
      country: primaryAddress?.country ?? null,
    }
  })
}

export const accountsService = {
  async listOrganizations(db: PostgresJsDatabase, query: OrganizationListQuery) {
    const conditions = []

    if (query.ownerId) conditions.push(eq(organizations.ownerId, query.ownerId))
    if (query.relation) conditions.push(eq(organizations.relation, query.relation))
    if (query.status) conditions.push(eq(organizations.status, query.status))
    if (query.search) {
      const term = `%${query.search}%`
      conditions.push(
        or(
          ilike(organizations.name, term),
          ilike(organizations.legalName, term),
          ilike(organizations.website, term),
        ),
      )
    }

    const where = conditions.length ? and(...conditions) : undefined
    return paginate(
      db
        .select()
        .from(organizations)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(desc(organizations.updatedAt)),
      db.select({ count: sql<number>`count(*)::int` }).from(organizations).where(where),
      query.limit,
      query.offset,
    )
  },

  async getOrganizationById(db: PostgresJsDatabase, id: string) {
    const [row] = await db.select().from(organizations).where(eq(organizations.id, id)).limit(1)
    return row ?? null
  },

  async createOrganization(db: PostgresJsDatabase, data: CreateOrganizationInput) {
    const [row] = await db.insert(organizations).values(data).returning()
    return row
  },

  async updateOrganization(db: PostgresJsDatabase, id: string, data: UpdateOrganizationInput) {
    const [row] = await db
      .update(organizations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(organizations.id, id))
      .returning()
    return row ?? null
  },

  async deleteOrganization(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(organizations)
      .where(eq(organizations.id, id))
      .returning({ id: organizations.id })
    return row ?? null
  },

  async listPeople(db: PostgresJsDatabase, query: PersonListQuery) {
    const conditions = []

    if (query.organizationId) conditions.push(eq(people.organizationId, query.organizationId))
    if (query.ownerId) conditions.push(eq(people.ownerId, query.ownerId))
    if (query.relation) conditions.push(eq(people.relation, query.relation))
    if (query.status) conditions.push(eq(people.status, query.status))
    if (query.search) {
      const term = `%${query.search}%`
      conditions.push(
        or(
          ilike(people.firstName, term),
          ilike(people.lastName, term),
          ilike(people.jobTitle, term),
        ),
      )
    }

    const where = conditions.length ? and(...conditions) : undefined
    const result = await paginate(
      db
        .select()
        .from(people)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(desc(people.updatedAt)),
      db.select({ count: sql<number>`count(*)::int` }).from(people).where(where),
      query.limit,
      query.offset,
    )

    return {
      ...result,
      data: await hydratePeople(db, result.data),
    }
  },

  async getPersonById(db: PostgresJsDatabase, id: string) {
    const [row] = await db.select().from(people).where(eq(people.id, id)).limit(1)
    if (!row) return null
    const [hydrated] = await hydratePeople(db, [row])
    return hydrated ?? null
  },

  async createPerson(db: PostgresJsDatabase, data: CreatePersonInput) {
    const [row] = await db
      .insert(people)
      .values({
        ...personBaseFields(data),
        firstName: data.firstName,
        lastName: data.lastName,
      })
      .returning()
    if (!row) {
      throw new Error("Failed to create person")
    }
    await syncPersonIdentity(db, row.id, data)
    return this.getPersonById(db, row.id)
  },

  async updatePerson(db: PostgresJsDatabase, id: string, data: UpdatePersonInput) {
    const existing = await this.getPersonById(db, id)
    if (!existing) return null

    await db
      .update(people)
      .set({ ...personBaseFields(data), updatedAt: new Date() })
      .where(eq(people.id, id))

    await syncPersonIdentity(db, id, {
      email: data.email === undefined ? existing.email : data.email,
      phone: data.phone === undefined ? existing.phone : data.phone,
      website: data.website === undefined ? existing.website : data.website,
      address: data.address === undefined ? existing.address : data.address,
      city: data.city === undefined ? existing.city : data.city,
      country: data.country === undefined ? existing.country : data.country,
    })

    return this.getPersonById(db, id)
  },

  async deletePerson(db: PostgresJsDatabase, id: string) {
    await deletePersonIdentity(db, id)
    const [row] = await db.delete(people).where(eq(people.id, id)).returning({ id: people.id })
    return row ?? null
  },

  // --- Contact methods & addresses (explicit CRUD via identity) ---

  listContactMethods(
    db: PostgresJsDatabase,
    entityType: "organization" | "person",
    entityId: string,
  ) {
    return identityService.listContactPointsForEntity(
      db,
      entityType === "organization" ? organizationEntityType : personEntityType,
      entityId,
    )
  },

  async createContactMethod(
    db: PostgresJsDatabase,
    entityType: "organization" | "person",
    entityId: string,
    data: CreateContactPointInput,
  ) {
    return identityService.createContactPoint(db, {
      ...data,
      entityType: entityType === "organization" ? organizationEntityType : personEntityType,
      entityId,
    })
  },

  async updateContactMethod(db: PostgresJsDatabase, id: string, data: UpdateContactPointInput) {
    return identityService.updateContactPoint(db, id, data)
  },

  async deleteContactMethod(db: PostgresJsDatabase, id: string) {
    return identityService.deleteContactPoint(db, id)
  },

  listAddresses(db: PostgresJsDatabase, entityType: "organization" | "person", entityId: string) {
    return identityService.listAddressesForEntity(
      db,
      entityType === "organization" ? organizationEntityType : personEntityType,
      entityId,
    )
  },

  async createAddress(
    db: PostgresJsDatabase,
    entityType: "organization" | "person",
    entityId: string,
    data: CreateAddressInput,
  ) {
    return identityService.createAddress(db, {
      ...data,
      entityType: entityType === "organization" ? organizationEntityType : personEntityType,
      entityId,
    })
  },

  async updateAddress(db: PostgresJsDatabase, id: string, data: UpdateAddressInput) {
    return identityService.updateAddress(db, id, data)
  },

  async deleteAddress(db: PostgresJsDatabase, id: string) {
    return identityService.deleteAddress(db, id)
  },

  // --- Person notes ---

  listPersonNotes(db: PostgresJsDatabase, personId: string) {
    return db
      .select()
      .from(personNotes)
      .where(eq(personNotes.personId, personId))
      .orderBy(personNotes.createdAt)
  },

  async createPersonNote(
    db: PostgresJsDatabase,
    personId: string,
    userId: string,
    data: CreatePersonNoteInput,
  ) {
    const [existing] = await db
      .select({ id: people.id })
      .from(people)
      .where(eq(people.id, personId))
      .limit(1)
    if (!existing) return null

    const [row] = await db
      .insert(personNotes)
      .values({ personId, authorId: userId, content: data.content })
      .returning()
    return row
  },

  // --- Organization notes ---

  listOrganizationNotes(db: PostgresJsDatabase, organizationId: string) {
    return db
      .select()
      .from(organizationNotes)
      .where(eq(organizationNotes.organizationId, organizationId))
      .orderBy(organizationNotes.createdAt)
  },

  async createOrganizationNote(
    db: PostgresJsDatabase,
    organizationId: string,
    userId: string,
    data: CreateOrganizationNoteInput,
  ) {
    const [existing] = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1)
    if (!existing) return null

    const [row] = await db
      .insert(organizationNotes)
      .values({ organizationId, authorId: userId, content: data.content })
      .returning()
    return row
  },

  async updatePersonNote(db: PostgresJsDatabase, id: string, content: string) {
    const [row] = await db
      .update(personNotes)
      .set({ content })
      .where(eq(personNotes.id, id))
      .returning()
    return row ?? null
  },

  async deletePersonNote(db: PostgresJsDatabase, id: string) {
    const [row] = await db.delete(personNotes).where(eq(personNotes.id, id)).returning()
    return row ?? null
  },

  async updateOrganizationNote(db: PostgresJsDatabase, id: string, content: string) {
    const [row] = await db
      .update(organizationNotes)
      .set({ content })
      .where(eq(organizationNotes.id, id))
      .returning()
    return row ?? null
  },

  async deleteOrganizationNote(db: PostgresJsDatabase, id: string) {
    const [row] = await db.delete(organizationNotes).where(eq(organizationNotes.id, id)).returning()
    return row ?? null
  },

  // --- Communication log ---

  async listCommunications(
    db: PostgresJsDatabase,
    personId: string,
    query: CommunicationListQuery,
  ) {
    const conditions = [eq(communicationLog.personId, personId)]

    if (query.channel) conditions.push(eq(communicationLog.channel, query.channel))
    if (query.direction) conditions.push(eq(communicationLog.direction, query.direction))
    if (query.dateFrom) conditions.push(gte(communicationLog.createdAt, new Date(query.dateFrom)))
    if (query.dateTo) conditions.push(lte(communicationLog.createdAt, new Date(query.dateTo)))

    return db
      .select()
      .from(communicationLog)
      .where(and(...conditions))
      .limit(query.limit)
      .offset(query.offset)
      .orderBy(desc(communicationLog.createdAt))
  },

  async createCommunication(
    db: PostgresJsDatabase,
    personId: string,
    data: CreateCommunicationLogInput,
  ) {
    const [existing] = await db
      .select({ id: people.id })
      .from(people)
      .where(eq(people.id, personId))
      .limit(1)
    if (!existing) return null

    const [row] = await db
      .insert(communicationLog)
      .values({
        personId,
        organizationId: data.organizationId ?? null,
        channel: data.channel,
        direction: data.direction,
        subject: data.subject ?? null,
        content: data.content ?? null,
        sentAt: data.sentAt ? new Date(data.sentAt) : null,
      })
      .returning()
    return row
  },

  // --- Segments ---

  listSegments(db: PostgresJsDatabase) {
    return db.select().from(segments).orderBy(segments.createdAt)
  },

  async createSegment(db: PostgresJsDatabase, data: CreateSegmentInput) {
    const [row] = await db.insert(segments).values(data).returning()
    return row
  },

  async deleteSegment(db: PostgresJsDatabase, segmentId: string) {
    const [row] = await db
      .delete(segments)
      .where(eq(segments.id, segmentId))
      .returning({ id: segments.id })
    return row ?? null
  },

  // --- CSV export/import ---

  async exportPeopleCsv(db: PostgresJsDatabase) {
    const rows = await hydratePeople(db, await db.select().from(people).orderBy(people.createdAt))

    const headers = [
      "id",
      "firstName",
      "lastName",
      "jobTitle",
      "relation",
      "preferredLanguage",
      "preferredCurrency",
      "email",
      "phone",
      "website",
      "address",
      "city",
      "country",
      "organizationId",
    ]

    const csvLines = [headers.join(",")]
    for (const row of rows) {
      const values = headers.map((header) => {
        const value = row[header as keyof typeof row]
        if (value === null || value === undefined) return ""
        const stringValue = String(value)
        return stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")
          ? `"${stringValue.replace(/"/g, '""')}"`
          : stringValue
      })
      csvLines.push(values.join(","))
    }

    return csvLines.join("\n")
  },

  async importPeopleCsv(db: PostgresJsDatabase, csvText: string) {
    const lines = csvText.split("\n").filter((line) => line.trim())
    if (lines.length < 2) {
      return { error: "CSV must have a header row and at least one data row" as const }
    }

    const headers = lines[0]!.split(",").map((header) => header.trim())
    const rows: Record<string, string>[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i]!.split(",").map((value) => value.trim())
      const row: Record<string, string> = {}
      for (let j = 0; j < headers.length; j++) {
        const header = headers[j]
        const value = values[j]
        if (header && value) {
          row[header] = value
        }
      }
      rows.push(row)
    }

    const imported: unknown[] = []
    const errors: { row: number; error: string }[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!
      const result = (await import("../validation.js")).insertPersonSchema.safeParse({
        firstName: row.firstName || "",
        lastName: row.lastName || "",
        jobTitle: row.jobTitle || null,
        relation: row.relation || null,
        preferredLanguage: row.preferredLanguage || null,
        preferredCurrency: row.preferredCurrency || null,
        email: row.email || null,
        phone: row.phone || null,
        website: row.website || null,
        address: row.address || null,
        city: row.city || null,
        country: row.country || null,
        organizationId: row.organizationId || null,
        tags: [],
      })

      if (!result.success) {
        errors.push({ row: i + 2, error: result.error.message })
        continue
      }

      imported.push(await this.createPerson(db, result.data))
    }

    return { imported: imported.length, errors }
  },
}
