import {
  identityAddresses,
  identityContactPoints,
  identityNamedContacts,
} from "@voyantjs/identity/schema"
import { identityService } from "@voyantjs/identity/service"
import type {
  InsertAddressForEntity,
  InsertContactPointForEntity,
  InsertNamedContactForEntity,
  UpdateAddress as UpdateIdentityAddress,
  UpdateContactPoint as UpdateIdentityContactPoint,
  UpdateNamedContact as UpdateIdentityNamedContact,
} from "@voyantjs/identity/validation"
import { and, asc, desc, eq, gte, inArray, lte, sql } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import type { z } from "zod"
import type { Supplier } from "./schema.js"
import {
  supplierAvailability,
  supplierContracts,
  supplierNotes,
  supplierRates,
  supplierServices,
  suppliers,
} from "./schema.js"
import type {
  availabilityQuerySchema,
  insertAvailabilitySchema,
  insertContractSchema,
  insertRateSchema,
  insertServiceSchema,
  insertSupplierNoteSchema,
  insertSupplierSchema,
  supplierListQuerySchema,
  updateContractSchema,
  updateRateSchema,
  updateServiceSchema,
  updateSupplierSchema,
} from "./validation.js"

type SupplierListQuery = z.infer<typeof supplierListQuerySchema>
type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>
type CreateSupplierInput = z.infer<typeof insertSupplierSchema>
type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>
type CreateServiceInput = z.infer<typeof insertServiceSchema>
type UpdateServiceInput = z.infer<typeof updateServiceSchema>
type CreateRateInput = z.infer<typeof insertRateSchema>
type UpdateRateInput = z.infer<typeof updateRateSchema>
type CreateSupplierNoteInput = z.infer<typeof insertSupplierNoteSchema>
type CreateAvailabilityInput = z.infer<typeof insertAvailabilitySchema>
type CreateContractInput = z.infer<typeof insertContractSchema>
type UpdateContractInput = z.infer<typeof updateContractSchema>

const supplierEntityType = "supplier"
const supplierBaseIdentitySource = "suppliers.base"

type SupplierIdentityInput = Pick<
  CreateSupplierInput,
  | "email"
  | "phone"
  | "website"
  | "address"
  | "city"
  | "country"
  | "contactName"
  | "contactEmail"
  | "contactPhone"
>

const supplierPrimaryNamedContactSource = "suppliers.primary_contact"

type SupplierHydratedFields = {
  email: string | null
  phone: string | null
  website: string | null
  address: string | null
  city: string | null
  country: string | null
  contactName: string | null
  contactEmail: string | null
  contactPhone: string | null
}

type HydratedSupplier = Supplier & SupplierHydratedFields

function normalizeContactValue(kind: "email" | "phone" | "website", value: string) {
  if (kind === "email") {
    return value.trim().toLowerCase()
  }

  if (kind === "website") {
    return value.trim().toLowerCase()
  }

  return value.trim()
}

function isManagedBySource(metadata: Record<string, unknown> | null | undefined, source: string) {
  return metadata?.managedBy === source
}

function toNullableTrimmed(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function formatAddress(address: {
  fullText: string | null
  line1: string | null
  line2: string | null
  city: string | null
  region: string | null
  postalCode: string | null
  country: string | null
}) {
  if (address.fullText) {
    return address.fullText
  }

  const parts = [
    address.line1,
    address.line2,
    address.city,
    address.region,
    address.postalCode,
    address.country,
  ].filter(Boolean)

  return parts.length > 0 ? parts.join(", ") : null
}

async function syncSupplierIdentity(
  db: PostgresJsDatabase,
  supplierId: string,
  data: SupplierIdentityInput,
) {
  const existingContactPoints = await identityService.listContactPointsForEntity(
    db,
    supplierEntityType,
    supplierId,
  )
  const existingAddresses = await identityService.listAddressesForEntity(
    db,
    supplierEntityType,
    supplierId,
  )
  const existingNamedContacts = await identityService.listNamedContactsForEntity(
    db,
    supplierEntityType,
    supplierId,
  )

  const managedContactPoints = existingContactPoints.filter((point) =>
    isManagedBySource(point.metadata as Record<string, unknown> | null, supplierBaseIdentitySource),
  )
  const managedAddress = existingAddresses.find((address) =>
    isManagedBySource(
      address.metadata as Record<string, unknown> | null,
      supplierBaseIdentitySource,
    ),
  )
  const managedPrimaryContact = existingNamedContacts.find((contact) =>
    isManagedBySource(
      contact.metadata as Record<string, unknown> | null,
      supplierPrimaryNamedContactSource,
    ),
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
      entityType: supplierEntityType,
      entityId: supplierId,
      kind,
      label: kind === "website" ? "website" : "primary",
      value,
      normalizedValue: normalizeContactValue(kind, value),
      isPrimary: true,
      metadata: {
        managedBy: supplierBaseIdentitySource,
      },
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
  } else {
    const addressPayload = {
      entityType: supplierEntityType,
      entityId: supplierId,
      label: "primary" as const,
      fullText: addressLine,
      line1: addressLine,
      city,
      country,
      isPrimary: true,
      metadata: {
        managedBy: supplierBaseIdentitySource,
      },
    }

    if (managedAddress) {
      await identityService.updateAddress(db, managedAddress.id, addressPayload)
    } else {
      await identityService.createAddress(db, addressPayload)
    }
  }

  const contactName = toNullableTrimmed(data.contactName)
  const contactEmail = toNullableTrimmed(data.contactEmail)
  const contactPhone = toNullableTrimmed(data.contactPhone)
  const hasPrimaryContact = Boolean(contactName || contactEmail || contactPhone)

  if (!hasPrimaryContact) {
    if (managedPrimaryContact) {
      await identityService.deleteNamedContact(db, managedPrimaryContact.id)
    }

    return
  }

  const namedContactPayload = {
    entityType: supplierEntityType,
    entityId: supplierId,
    role: "primary" as const,
    name: contactName ?? contactEmail ?? contactPhone ?? "Primary contact",
    email: contactEmail,
    phone: contactPhone,
    isPrimary: true,
    metadata: {
      managedBy: supplierPrimaryNamedContactSource,
    },
  }

  if (managedPrimaryContact) {
    await identityService.updateNamedContact(db, managedPrimaryContact.id, namedContactPayload)
  } else {
    await identityService.createNamedContact(db, namedContactPayload)
  }
}

async function hydrateSuppliers<
  T extends {
    id: string
    contactName?: string | null
    contactEmail?: string | null
    contactPhone?: string | null
  },
>(db: PostgresJsDatabase, rows: T[]): Promise<Array<T & SupplierHydratedFields>> {
  if (rows.length === 0) {
    return rows.map((row) => ({
      ...row,
      email: null,
      phone: null,
      website: null,
      address: null,
      city: null,
      country: null,
      contactName: null,
      contactEmail: null,
      contactPhone: null,
    }))
  }

  const ids = rows.map((row) => row.id)
  const [contactPoints, addresses, namedContacts] = await Promise.all([
    db
      .select()
      .from(identityContactPoints)
      .where(
        and(
          eq(identityContactPoints.entityType, supplierEntityType),
          inArray(identityContactPoints.entityId, ids),
        ),
      ),
    db
      .select()
      .from(identityAddresses)
      .where(
        and(
          eq(identityAddresses.entityType, supplierEntityType),
          inArray(identityAddresses.entityId, ids),
        ),
      ),
    db
      .select()
      .from(identityNamedContacts)
      .where(
        and(
          eq(identityNamedContacts.entityType, supplierEntityType),
          inArray(identityNamedContacts.entityId, ids),
        ),
      ),
  ])

  const contactPointMap = new Map<string, typeof contactPoints>()
  const addressMap = new Map<string, typeof addresses>()
  const namedContactMap = new Map<string, typeof namedContacts>()

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

  for (const contact of namedContacts) {
    const bucket = namedContactMap.get(contact.entityId) ?? []
    bucket.push(contact)
    namedContactMap.set(contact.entityId, bucket)
  }

  return rows.map((row) => {
    const entityContactPoints = contactPointMap.get(row.id) ?? []
    const entityAddresses = addressMap.get(row.id) ?? []
    const entityNamedContacts = namedContactMap.get(row.id) ?? []

    const pickContactValue = (kind: "email" | "phone" | "website") =>
      entityContactPoints.find((point) => point.kind === kind && point.isPrimary)?.value ??
      entityContactPoints.find((point) => point.kind === kind)?.value ??
      null

    const primaryAddress =
      entityAddresses.find((address) => address.isPrimary) ?? entityAddresses[0] ?? null
    const primaryContact =
      entityNamedContacts.find((contact) => contact.isPrimary) ?? entityNamedContacts[0] ?? null

    return {
      ...row,
      email: pickContactValue("email"),
      phone: pickContactValue("phone"),
      website: pickContactValue("website"),
      address: primaryAddress ? formatAddress(primaryAddress) : null,
      city: primaryAddress?.city ?? null,
      country: primaryAddress?.country ?? null,
      contactName: primaryContact?.name ?? null,
      contactEmail: primaryContact?.email ?? null,
      contactPhone: primaryContact?.phone ?? null,
    }
  })
}

export const suppliersService = {
  async listSuppliers(db: PostgresJsDatabase, query: SupplierListQuery) {
    const conditions = []

    if (query.type) {
      conditions.push(eq(suppliers.type, query.type))
    }

    if (query.status) {
      conditions.push(eq(suppliers.status, query.status))
    }

    if (query.primaryFacilityId) {
      conditions.push(eq(suppliers.primaryFacilityId, query.primaryFacilityId))
    }

    if (query.search) {
      const term = `%${query.search}%`
      conditions.push(
        sql`(
          ${suppliers.name} ilike ${term}
          or
          exists (
            select 1
            from ${identityContactPoints}
            where ${identityContactPoints.entityType} = ${supplierEntityType}
              and ${identityContactPoints.entityId} = ${suppliers.id}
              and (
                ${identityContactPoints.value} ilike ${term}
                or ${identityContactPoints.normalizedValue} ilike ${term}
              )
          )
          or exists (
            select 1
            from ${identityNamedContacts}
            where ${identityNamedContacts.entityType} = ${supplierEntityType}
              and ${identityNamedContacts.entityId} = ${suppliers.id}
              and (
                ${identityNamedContacts.name} ilike ${term}
                or ${identityNamedContacts.email} ilike ${term}
                or ${identityNamedContacts.phone} ilike ${term}
              )
          )
          or exists (
            select 1
            from ${identityAddresses}
            where ${identityAddresses.entityType} = ${supplierEntityType}
              and ${identityAddresses.entityId} = ${suppliers.id}
              and (
                ${identityAddresses.fullText} ilike ${term}
                or ${identityAddresses.city} ilike ${term}
                or ${identityAddresses.country} ilike ${term}
              )
          )
        )`,
      )
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const [rows, countResult] = await Promise.all([
      db
        .select()
        .from(suppliers)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(suppliers.createdAt),
      db.select({ count: sql<number>`count(*)::int` }).from(suppliers).where(where),
    ])

    return {
      data: await hydrateSuppliers(db, rows),
      total: countResult[0]?.count ?? 0,
      limit: query.limit,
      offset: query.offset,
    }
  },

  async getSupplierById(db: PostgresJsDatabase, id: string) {
    const [row] = await db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1)
    if (!row) {
      return null
    }

    const [hydrated] = await hydrateSuppliers(db, [row])
    return (hydrated as HydratedSupplier | undefined) ?? null
  },

  async createSupplier(db: PostgresJsDatabase, data: CreateSupplierInput) {
    const {
      email,
      phone,
      website,
      address,
      city,
      country,
      contactName,
      contactEmail,
      contactPhone,
      ...supplierValues
    } = data

    const [row] = await db.insert(suppliers).values(supplierValues).returning()
    if (!row) {
      throw new Error("Failed to create supplier")
    }

    await syncSupplierIdentity(db, row.id, {
      email,
      phone,
      website,
      address,
      city,
      country,
      contactName,
      contactEmail,
      contactPhone,
    })
    return {
      ...row,
      email: email ?? null,
      phone: phone ?? null,
      website: website ?? null,
      address: address ?? null,
      city: city ?? null,
      country: country ?? null,
      contactName: contactName ?? null,
      contactEmail: contactEmail ?? null,
      contactPhone: contactPhone ?? null,
    }
  },

  async updateSupplier(db: PostgresJsDatabase, id: string, data: UpdateSupplierInput) {
    const existing = await this.getSupplierById(db, id)
    if (!existing) {
      return null
    }

    const {
      email,
      phone,
      website,
      address,
      city,
      country,
      contactName,
      contactEmail,
      contactPhone,
      ...supplierValues
    } = data

    const [row] = await db
      .update(suppliers)
      .set({ ...supplierValues, updatedAt: new Date() })
      .where(eq(suppliers.id, id))
      .returning()

    if (!row) {
      return null
    }

    await syncSupplierIdentity(db, id, {
      email: email ?? existing.email,
      phone: phone ?? existing.phone,
      website: website ?? existing.website,
      address: address ?? existing.address,
      city: city ?? existing.city,
      country: country ?? existing.country,
      contactName: contactName ?? existing.contactName,
      contactEmail: contactEmail ?? existing.contactEmail,
      contactPhone: contactPhone ?? existing.contactPhone,
    })

    return {
      ...row,
      email: email ?? existing.email,
      phone: phone ?? existing.phone,
      website: website ?? existing.website,
      address: address ?? existing.address,
      city: city ?? existing.city,
      country: country ?? existing.country,
      contactName: contactName ?? existing.contactName,
      contactEmail: contactEmail ?? existing.contactEmail,
      contactPhone: contactPhone ?? existing.contactPhone,
    }
  },

  async deleteSupplier(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(suppliers)
      .where(eq(suppliers.id, id))
      .returning({ id: suppliers.id })

    return row ?? null
  },

  listContactPoints(db: PostgresJsDatabase, supplierId: string) {
    return identityService.listContactPointsForEntity(db, supplierEntityType, supplierId)
  },

  listNamedContacts(db: PostgresJsDatabase, supplierId: string) {
    return identityService.listNamedContactsForEntity(db, supplierEntityType, supplierId)
  },

  async createNamedContact(
    db: PostgresJsDatabase,
    supplierId: string,
    data: InsertNamedContactForEntity,
  ) {
    const [supplier] = await db
      .select({ id: suppliers.id })
      .from(suppliers)
      .where(eq(suppliers.id, supplierId))
      .limit(1)

    if (!supplier) {
      return null
    }

    return identityService.createNamedContact(db, {
      ...data,
      entityType: supplierEntityType,
      entityId: supplierId,
    })
  },

  updateNamedContact(db: PostgresJsDatabase, contactId: string, data: UpdateIdentityNamedContact) {
    return identityService.updateNamedContact(db, contactId, data)
  },

  deleteNamedContact(db: PostgresJsDatabase, contactId: string) {
    return identityService.deleteNamedContact(db, contactId)
  },

  async createContactPoint(
    db: PostgresJsDatabase,
    supplierId: string,
    data: InsertContactPointForEntity,
  ) {
    const [supplier] = await db
      .select({ id: suppliers.id })
      .from(suppliers)
      .where(eq(suppliers.id, supplierId))
      .limit(1)

    if (!supplier) {
      return null
    }

    return identityService.createContactPoint(db, {
      ...data,
      entityType: supplierEntityType,
      entityId: supplierId,
    })
  },

  updateContactPoint(
    db: PostgresJsDatabase,
    contactPointId: string,
    data: UpdateIdentityContactPoint,
  ) {
    return identityService.updateContactPoint(db, contactPointId, data)
  },

  deleteContactPoint(db: PostgresJsDatabase, contactPointId: string) {
    return identityService.deleteContactPoint(db, contactPointId)
  },

  listAddresses(db: PostgresJsDatabase, supplierId: string) {
    return identityService.listAddressesForEntity(db, supplierEntityType, supplierId)
  },

  async createAddress(db: PostgresJsDatabase, supplierId: string, data: InsertAddressForEntity) {
    const [supplier] = await db
      .select({ id: suppliers.id })
      .from(suppliers)
      .where(eq(suppliers.id, supplierId))
      .limit(1)

    if (!supplier) {
      return null
    }

    return identityService.createAddress(db, {
      ...data,
      entityType: supplierEntityType,
      entityId: supplierId,
    })
  },

  updateAddress(db: PostgresJsDatabase, addressId: string, data: UpdateIdentityAddress) {
    return identityService.updateAddress(db, addressId, data)
  },

  deleteAddress(db: PostgresJsDatabase, addressId: string) {
    return identityService.deleteAddress(db, addressId)
  },

  listServices(db: PostgresJsDatabase, supplierId: string) {
    return db
      .select()
      .from(supplierServices)
      .where(eq(supplierServices.supplierId, supplierId))
      .orderBy(supplierServices.createdAt)
  },

  async createService(db: PostgresJsDatabase, supplierId: string, data: CreateServiceInput) {
    const [supplier] = await db
      .select({ id: suppliers.id })
      .from(suppliers)
      .where(eq(suppliers.id, supplierId))
      .limit(1)

    if (!supplier) {
      return null
    }

    const [row] = await db
      .insert(supplierServices)
      .values({ ...data, supplierId })
      .returning()

    return row ?? null
  },

  async updateService(db: PostgresJsDatabase, serviceId: string, data: UpdateServiceInput) {
    const [row] = await db
      .update(supplierServices)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(supplierServices.id, serviceId))
      .returning()

    return row ?? null
  },

  async deleteService(db: PostgresJsDatabase, serviceId: string) {
    const [row] = await db
      .delete(supplierServices)
      .where(eq(supplierServices.id, serviceId))
      .returning({ id: supplierServices.id })

    return row ?? null
  },

  listRates(db: PostgresJsDatabase, serviceId: string) {
    return db
      .select()
      .from(supplierRates)
      .where(eq(supplierRates.serviceId, serviceId))
      .orderBy(supplierRates.createdAt)
  },

  async createRate(db: PostgresJsDatabase, serviceId: string, data: CreateRateInput) {
    const [service] = await db
      .select({ id: supplierServices.id })
      .from(supplierServices)
      .where(eq(supplierServices.id, serviceId))
      .limit(1)

    if (!service) {
      return null
    }

    const [row] = await db
      .insert(supplierRates)
      .values({ ...data, serviceId })
      .returning()

    return row
  },

  async updateRate(db: PostgresJsDatabase, rateId: string, data: UpdateRateInput) {
    const [row] = await db
      .update(supplierRates)
      .set(data)
      .where(eq(supplierRates.id, rateId))
      .returning()

    return row ?? null
  },

  async deleteRate(db: PostgresJsDatabase, rateId: string) {
    const [row] = await db
      .delete(supplierRates)
      .where(eq(supplierRates.id, rateId))
      .returning({ id: supplierRates.id })

    return row ?? null
  },

  listNotes(db: PostgresJsDatabase, supplierId: string) {
    return db
      .select()
      .from(supplierNotes)
      .where(eq(supplierNotes.supplierId, supplierId))
      .orderBy(supplierNotes.createdAt)
  },

  async createNote(
    db: PostgresJsDatabase,
    supplierId: string,
    userId: string,
    data: CreateSupplierNoteInput,
  ) {
    const [supplier] = await db
      .select({ id: suppliers.id })
      .from(suppliers)
      .where(eq(suppliers.id, supplierId))
      .limit(1)

    if (!supplier) {
      return null
    }

    const [row] = await db
      .insert(supplierNotes)
      .values({
        supplierId,
        authorId: userId,
        content: data.content,
      })
      .returning()

    return row
  },

  async listAvailability(db: PostgresJsDatabase, supplierId: string, query: AvailabilityQuery) {
    const conditions = [eq(supplierAvailability.supplierId, supplierId)]

    if (query.from) {
      conditions.push(gte(supplierAvailability.date, query.from))
    }

    if (query.to) {
      conditions.push(lte(supplierAvailability.date, query.to))
    }

    return db
      .select()
      .from(supplierAvailability)
      .where(and(...conditions))
      .orderBy(asc(supplierAvailability.date))
  },

  async createAvailability(
    db: PostgresJsDatabase,
    supplierId: string,
    entries: CreateAvailabilityInput[],
  ) {
    const [supplier] = await db
      .select({ id: suppliers.id })
      .from(suppliers)
      .where(eq(suppliers.id, supplierId))
      .limit(1)

    if (!supplier) {
      return null
    }

    return db
      .insert(supplierAvailability)
      .values(
        entries.map((entry) => ({
          supplierId,
          date: entry.date,
          available: entry.available,
          notes: entry.notes ?? null,
        })),
      )
      .returning()
  },

  listContracts(db: PostgresJsDatabase, supplierId: string) {
    return db
      .select()
      .from(supplierContracts)
      .where(eq(supplierContracts.supplierId, supplierId))
      .orderBy(desc(supplierContracts.createdAt))
  },

  async createContract(db: PostgresJsDatabase, supplierId: string, data: CreateContractInput) {
    const [supplier] = await db
      .select({ id: suppliers.id })
      .from(suppliers)
      .where(eq(suppliers.id, supplierId))
      .limit(1)

    if (!supplier) {
      return null
    }

    const [row] = await db
      .insert(supplierContracts)
      .values({ ...data, supplierId })
      .returning()

    return row
  },

  async updateContract(db: PostgresJsDatabase, contractId: string, data: UpdateContractInput) {
    const [row] = await db
      .update(supplierContracts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(supplierContracts.id, contractId))
      .returning()

    return row ?? null
  },

  async deleteContract(db: PostgresJsDatabase, contractId: string) {
    const [row] = await db
      .delete(supplierContracts)
      .where(eq(supplierContracts.id, contractId))
      .returning({ id: supplierContracts.id })

    return row ?? null
  },
}
