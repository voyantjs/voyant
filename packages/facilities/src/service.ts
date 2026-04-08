import { identityAddresses } from "@voyantjs/identity/schema"
import { identityService } from "@voyantjs/identity/service"
import type {
  InsertAddressForEntity,
  InsertContactPointForEntity,
  UpdateAddress as UpdateIdentityAddress,
  UpdateContactPoint as UpdateIdentityContactPoint,
} from "@voyantjs/identity/validation"
import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import type { z } from "zod"

import {
  facilities,
  facilityFeatures,
  facilityOperationSchedules,
  properties,
  propertyGroupMembers,
  propertyGroups,
} from "./schema.js"
import type {
  facilityContactListQuerySchema,
  facilityFeatureListQuerySchema,
  facilityListQuerySchema,
  facilityOperationScheduleListQuerySchema,
  insertFacilityContactSchema,
  insertFacilityFeatureSchema,
  insertFacilityOperationScheduleSchema,
  insertFacilitySchema,
  insertPropertyGroupMemberSchema,
  insertPropertyGroupSchema,
  insertPropertySchema,
  propertyGroupListQuerySchema,
  propertyGroupMemberListQuerySchema,
  propertyListQuerySchema,
  updateFacilityContactSchema,
  updateFacilityFeatureSchema,
  updateFacilityOperationScheduleSchema,
  updateFacilitySchema,
  updatePropertyGroupMemberSchema,
  updatePropertyGroupSchema,
  updatePropertySchema,
} from "./validation.js"

type FacilityListQuery = z.infer<typeof facilityListQuerySchema>
type CreateFacilityInput = z.infer<typeof insertFacilitySchema>
type UpdateFacilityInput = z.infer<typeof updateFacilitySchema>
type FacilityContactListQuery = z.infer<typeof facilityContactListQuerySchema>
type CreateFacilityContactInput = z.infer<typeof insertFacilityContactSchema>
type UpdateFacilityContactInput = z.infer<typeof updateFacilityContactSchema>
type FacilityFeatureListQuery = z.infer<typeof facilityFeatureListQuerySchema>
type CreateFacilityFeatureInput = z.infer<typeof insertFacilityFeatureSchema>
type UpdateFacilityFeatureInput = z.infer<typeof updateFacilityFeatureSchema>
type FacilityOperationScheduleListQuery = z.infer<typeof facilityOperationScheduleListQuerySchema>
type CreateFacilityOperationScheduleInput = z.infer<typeof insertFacilityOperationScheduleSchema>
type UpdateFacilityOperationScheduleInput = z.infer<typeof updateFacilityOperationScheduleSchema>
type PropertyListQuery = z.infer<typeof propertyListQuerySchema>
type CreatePropertyInput = z.infer<typeof insertPropertySchema>
type UpdatePropertyInput = z.infer<typeof updatePropertySchema>
type PropertyGroupListQuery = z.infer<typeof propertyGroupListQuerySchema>
type CreatePropertyGroupInput = z.infer<typeof insertPropertyGroupSchema>
type UpdatePropertyGroupInput = z.infer<typeof updatePropertyGroupSchema>
type PropertyGroupMemberListQuery = z.infer<typeof propertyGroupMemberListQuerySchema>
type CreatePropertyGroupMemberInput = z.infer<typeof insertPropertyGroupMemberSchema>
type UpdatePropertyGroupMemberInput = z.infer<typeof updatePropertyGroupMemberSchema>

const facilityEntityType = "facility"
const facilityBaseIdentitySource = "facilities.base"
const facilityContactIdentitySource = "facilities.contacts"

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

type FacilityAddressInput = Pick<
  CreateFacilityInput,
  | "addressLine1"
  | "addressLine2"
  | "city"
  | "region"
  | "postalCode"
  | "country"
  | "latitude"
  | "longitude"
>

async function syncFacilityAddress(
  db: PostgresJsDatabase,
  facilityId: string,
  data: FacilityAddressInput,
) {
  const existingAddresses = await identityService.listAddressesForEntity(
    db,
    facilityEntityType,
    facilityId,
  )
  const managedAddress = existingAddresses.find((address) =>
    isManagedBySource(
      address.metadata as Record<string, unknown> | null,
      facilityBaseIdentitySource,
    ),
  )

  const line1 = toNullableTrimmed(data.addressLine1)
  const line2 = toNullableTrimmed(data.addressLine2)
  const city = toNullableTrimmed(data.city)
  const region = toNullableTrimmed(data.region)
  const postalCode = toNullableTrimmed(data.postalCode)
  const country = toNullableTrimmed(data.country)
  const hasAddress = Boolean(
    line1 ||
      line2 ||
      city ||
      region ||
      postalCode ||
      country ||
      data.latitude !== null ||
      data.longitude !== null,
  )

  if (!hasAddress) {
    if (managedAddress) {
      await identityService.deleteAddress(db, managedAddress.id)
    }

    return
  }

  const payload = {
    entityType: facilityEntityType,
    entityId: facilityId,
    label: "primary" as const,
    fullText: null,
    line1,
    line2,
    city,
    region,
    postalCode,
    country,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    isPrimary: true,
    metadata: {
      managedBy: facilityBaseIdentitySource,
    },
  }

  if (managedAddress) {
    await identityService.updateAddress(db, managedAddress.id, payload)
  } else {
    await identityService.createAddress(db, payload)
  }
}

async function hydrateFacilities<T extends { id: string }>(db: PostgresJsDatabase, rows: T[]) {
  if (rows.length === 0) {
    return rows.map((row) => ({
      ...row,
      addressLine1: null,
      addressLine2: null,
      city: null,
      region: null,
      country: null,
      postalCode: null,
      latitude: null,
      longitude: null,
      address: null,
    }))
  }

  const ids = rows.map((row) => row.id)
  const addresses = await db
    .select()
    .from(identityAddresses)
    .where(
      and(
        eq(identityAddresses.entityType, facilityEntityType),
        inArray(identityAddresses.entityId, ids),
      ),
    )

  const addressMap = new Map<string, typeof addresses>()

  for (const address of addresses) {
    const bucket = addressMap.get(address.entityId) ?? []
    bucket.push(address)
    addressMap.set(address.entityId, bucket)
  }

  return rows.map((row) => {
    const entityAddresses = addressMap.get(row.id) ?? []
    const primaryAddress =
      entityAddresses.find((address) => address.isPrimary) ?? entityAddresses[0] ?? null

    return {
      ...row,
      addressLine1: primaryAddress?.line1 ?? null,
      addressLine2: primaryAddress?.line2 ?? null,
      city: primaryAddress?.city ?? null,
      region: primaryAddress?.region ?? null,
      country: primaryAddress?.country ?? null,
      postalCode: primaryAddress?.postalCode ?? null,
      latitude: primaryAddress?.latitude ?? null,
      longitude: primaryAddress?.longitude ?? null,
      address: primaryAddress ? formatAddress(primaryAddress) : null,
    }
  })
}

export const facilitiesService = {
  async listFacilities(db: PostgresJsDatabase, query: FacilityListQuery) {
    const conditions = []

    if (query.kind) conditions.push(eq(facilities.kind, query.kind))
    if (query.status) conditions.push(eq(facilities.status, query.status))
    if (query.ownerType) conditions.push(eq(facilities.ownerType, query.ownerType))
    if (query.ownerId) conditions.push(eq(facilities.ownerId, query.ownerId))
    if (query.parentFacilityId)
      conditions.push(eq(facilities.parentFacilityId, query.parentFacilityId))
    if (query.country) {
      conditions.push(
        sql`exists (
          select 1
          from ${identityAddresses}
          where ${identityAddresses.entityType} = ${facilityEntityType}
            and ${identityAddresses.entityId} = ${facilities.id}
            and ${identityAddresses.country} = ${query.country}
        )`,
      )
    }
    if (query.search) {
      const term = `%${query.search}%`
      conditions.push(
        sql`(
          ${facilities.name} ilike ${term}
          or ${facilities.code} ilike ${term}
          or ${facilities.description} ilike ${term}
          or exists (
            select 1
            from ${identityAddresses}
            where ${identityAddresses.entityType} = ${facilityEntityType}
              and ${identityAddresses.entityId} = ${facilities.id}
              and (
                ${identityAddresses.fullText} ilike ${term}
                or ${identityAddresses.line1} ilike ${term}
                or ${identityAddresses.city} ilike ${term}
                or ${identityAddresses.country} ilike ${term}
              )
          )
        )`,
      )
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const page = await paginate(
      db
        .select()
        .from(facilities)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(desc(facilities.updatedAt)),
      db.select({ count: sql<number>`count(*)::int` }).from(facilities).where(where),
      query.limit,
      query.offset,
    )

    return {
      ...page,
      data: await hydrateFacilities(db, page.data),
    }
  },

  async getFacilityById(db: PostgresJsDatabase, id: string) {
    const [row] = await db.select().from(facilities).where(eq(facilities.id, id)).limit(1)
    if (!row) return null

    const [hydrated] = await hydrateFacilities(db, [row])
    return hydrated ?? null
  },

  async createFacility(db: PostgresJsDatabase, data: CreateFacilityInput) {
    const {
      addressLine1,
      addressLine2,
      city,
      region,
      postalCode,
      country,
      latitude,
      longitude,
      ...facilityValues
    } = data

    const [row] = await db.insert(facilities).values(facilityValues).returning()
    if (!row) {
      throw new Error("Failed to create facility")
    }

    await syncFacilityAddress(db, row.id, {
      addressLine1,
      addressLine2,
      city,
      region,
      postalCode,
      country,
      latitude,
      longitude,
    })

    return {
      ...row,
      addressLine1: addressLine1 ?? null,
      addressLine2: addressLine2 ?? null,
      city: city ?? null,
      region: region ?? null,
      postalCode: postalCode ?? null,
      country: country ?? null,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      address: formatAddress({
        fullText: null,
        line1: addressLine1 ?? null,
        line2: addressLine2 ?? null,
        city: city ?? null,
        region: region ?? null,
        postalCode: postalCode ?? null,
        country: country ?? null,
      }),
    }
  },

  async updateFacility(db: PostgresJsDatabase, id: string, data: UpdateFacilityInput) {
    const existing = await this.getFacilityById(db, id)
    if (!existing) return null

    const {
      addressLine1,
      addressLine2,
      city,
      region,
      postalCode,
      country,
      latitude,
      longitude,
      ...facilityValues
    } = data

    const [row] = await db
      .update(facilities)
      .set({ ...facilityValues, updatedAt: new Date() })
      .where(eq(facilities.id, id))
      .returning()
    if (!row) return null

    await syncFacilityAddress(db, id, {
      addressLine1: addressLine1 ?? existing.addressLine1,
      addressLine2: addressLine2 ?? existing.addressLine2,
      city: city ?? existing.city,
      region: region ?? existing.region,
      postalCode: postalCode ?? existing.postalCode,
      country: country ?? existing.country,
      latitude: latitude ?? existing.latitude,
      longitude: longitude ?? existing.longitude,
    })

    return {
      ...row,
      addressLine1: addressLine1 ?? existing.addressLine1,
      addressLine2: addressLine2 ?? existing.addressLine2,
      city: city ?? existing.city,
      region: region ?? existing.region,
      postalCode: postalCode ?? existing.postalCode,
      country: country ?? existing.country,
      latitude: latitude ?? existing.latitude,
      longitude: longitude ?? existing.longitude,
      address: formatAddress({
        fullText: null,
        line1: addressLine1 ?? existing.addressLine1,
        line2: addressLine2 ?? existing.addressLine2,
        city: city ?? existing.city,
        region: region ?? existing.region,
        postalCode: postalCode ?? existing.postalCode,
        country: country ?? existing.country,
      }),
    }
  },

  async deleteFacility(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(facilities)
      .where(eq(facilities.id, id))
      .returning({ id: facilities.id })
    return row ?? null
  },

  listContactPoints(db: PostgresJsDatabase, facilityId: string) {
    return identityService.listContactPointsForEntity(db, facilityEntityType, facilityId)
  },

  async createContactPoint(
    db: PostgresJsDatabase,
    facilityId: string,
    data: InsertContactPointForEntity,
  ) {
    const [facility] = await db
      .select({ id: facilities.id })
      .from(facilities)
      .where(eq(facilities.id, facilityId))
      .limit(1)
    if (!facility) return null

    return identityService.createContactPoint(db, {
      ...data,
      entityType: facilityEntityType,
      entityId: facilityId,
    })
  },

  updateContactPoint(db: PostgresJsDatabase, id: string, data: UpdateIdentityContactPoint) {
    return identityService.updateContactPoint(db, id, data)
  },

  deleteContactPoint(db: PostgresJsDatabase, id: string) {
    return identityService.deleteContactPoint(db, id)
  },

  listAddresses(db: PostgresJsDatabase, facilityId: string) {
    return identityService.listAddressesForEntity(db, facilityEntityType, facilityId)
  },

  async createAddress(db: PostgresJsDatabase, facilityId: string, data: InsertAddressForEntity) {
    const [facility] = await db
      .select({ id: facilities.id })
      .from(facilities)
      .where(eq(facilities.id, facilityId))
      .limit(1)
    if (!facility) return null

    return identityService.createAddress(db, {
      ...data,
      entityType: facilityEntityType,
      entityId: facilityId,
    })
  },

  updateAddress(db: PostgresJsDatabase, id: string, data: UpdateIdentityAddress) {
    return identityService.updateAddress(db, id, data)
  },

  deleteAddress(db: PostgresJsDatabase, id: string) {
    return identityService.deleteAddress(db, id)
  },

  async listFacilityContacts(db: PostgresJsDatabase, query: FacilityContactListQuery) {
    return identityService.listNamedContacts(db, {
      entityType: facilityEntityType,
      entityId: query.facilityId,
      role: query.role,
      limit: query.limit,
      offset: query.offset,
    })
  },

  async createFacilityContact(
    db: PostgresJsDatabase,
    facilityId: string,
    data: CreateFacilityContactInput,
  ) {
    const [facility] = await db
      .select({ id: facilities.id })
      .from(facilities)
      .where(eq(facilities.id, facilityId))
      .limit(1)
    if (!facility) return null

    return identityService.createNamedContact(db, {
      ...data,
      entityType: facilityEntityType,
      entityId: facilityId,
      metadata: {
        managedBy: facilityContactIdentitySource,
      },
    })
  },

  async updateFacilityContact(
    db: PostgresJsDatabase,
    id: string,
    data: UpdateFacilityContactInput,
  ) {
    return identityService.updateNamedContact(db, id, data)
  },

  async deleteFacilityContact(db: PostgresJsDatabase, id: string) {
    return identityService.deleteNamedContact(db, id)
  },

  async listFacilityFeatures(db: PostgresJsDatabase, query: FacilityFeatureListQuery) {
    const conditions = []
    if (query.facilityId) conditions.push(eq(facilityFeatures.facilityId, query.facilityId))
    if (query.category) conditions.push(eq(facilityFeatures.category, query.category))
    const where = conditions.length > 0 ? and(...conditions) : undefined

    return paginate(
      db
        .select()
        .from(facilityFeatures)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(facilityFeatures.sortOrder, facilityFeatures.name),
      db.select({ count: sql<number>`count(*)::int` }).from(facilityFeatures).where(where),
      query.limit,
      query.offset,
    )
  },

  async createFacilityFeature(
    db: PostgresJsDatabase,
    facilityId: string,
    data: CreateFacilityFeatureInput,
  ) {
    const [facility] = await db
      .select({ id: facilities.id })
      .from(facilities)
      .where(eq(facilities.id, facilityId))
      .limit(1)
    if (!facility) return null

    const [row] = await db
      .insert(facilityFeatures)
      .values({ ...data, facilityId })
      .returning()
    return row ?? null
  },

  async updateFacilityFeature(
    db: PostgresJsDatabase,
    id: string,
    data: UpdateFacilityFeatureInput,
  ) {
    const [row] = await db
      .update(facilityFeatures)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(facilityFeatures.id, id))
      .returning()
    return row ?? null
  },

  async deleteFacilityFeature(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(facilityFeatures)
      .where(eq(facilityFeatures.id, id))
      .returning({ id: facilityFeatures.id })
    return row ?? null
  },

  async listFacilityOperationSchedules(
    db: PostgresJsDatabase,
    query: FacilityOperationScheduleListQuery,
  ) {
    const conditions = []
    if (query.facilityId)
      conditions.push(eq(facilityOperationSchedules.facilityId, query.facilityId))
    if (query.dayOfWeek) conditions.push(eq(facilityOperationSchedules.dayOfWeek, query.dayOfWeek))
    const where = conditions.length > 0 ? and(...conditions) : undefined

    return paginate(
      db
        .select()
        .from(facilityOperationSchedules)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(facilityOperationSchedules.dayOfWeek, desc(facilityOperationSchedules.validFrom)),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(facilityOperationSchedules)
        .where(where),
      query.limit,
      query.offset,
    )
  },

  async createFacilityOperationSchedule(
    db: PostgresJsDatabase,
    facilityId: string,
    data: CreateFacilityOperationScheduleInput,
  ) {
    const [facility] = await db
      .select({ id: facilities.id })
      .from(facilities)
      .where(eq(facilities.id, facilityId))
      .limit(1)
    if (!facility) return null

    const [row] = await db
      .insert(facilityOperationSchedules)
      .values({ ...data, facilityId })
      .returning()
    return row ?? null
  },

  async updateFacilityOperationSchedule(
    db: PostgresJsDatabase,
    id: string,
    data: UpdateFacilityOperationScheduleInput,
  ) {
    const [row] = await db
      .update(facilityOperationSchedules)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(facilityOperationSchedules.id, id))
      .returning()
    return row ?? null
  },

  async deleteFacilityOperationSchedule(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(facilityOperationSchedules)
      .where(eq(facilityOperationSchedules.id, id))
      .returning({ id: facilityOperationSchedules.id })
    return row ?? null
  },

  async listProperties(db: PostgresJsDatabase, query: PropertyListQuery) {
    const conditions = []
    if (query.facilityId) conditions.push(eq(properties.facilityId, query.facilityId))
    if (query.propertyType) conditions.push(eq(properties.propertyType, query.propertyType))
    if (query.groupName) conditions.push(eq(properties.groupName, query.groupName))
    if (query.search) {
      const term = `%${query.search}%`
      conditions.push(or(ilike(properties.brandName, term), ilike(properties.groupName, term)))
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined

    return paginate(
      db
        .select()
        .from(properties)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(desc(properties.updatedAt)),
      db.select({ count: sql<number>`count(*)::int` }).from(properties).where(where),
      query.limit,
      query.offset,
    )
  },

  async getPropertyById(db: PostgresJsDatabase, id: string) {
    const [row] = await db.select().from(properties).where(eq(properties.id, id)).limit(1)
    return row ?? null
  },

  async createProperty(db: PostgresJsDatabase, data: CreatePropertyInput) {
    const [facility] = await db
      .select({ id: facilities.id })
      .from(facilities)
      .where(eq(facilities.id, data.facilityId))
      .limit(1)
    if (!facility) return null

    const [row] = await db.insert(properties).values(data).returning()
    return row ?? null
  },

  async updateProperty(db: PostgresJsDatabase, id: string, data: UpdatePropertyInput) {
    const [row] = await db
      .update(properties)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(properties.id, id))
      .returning()
    return row ?? null
  },

  async deleteProperty(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(properties)
      .where(eq(properties.id, id))
      .returning({ id: properties.id })
    return row ?? null
  },

  async listPropertyGroups(db: PostgresJsDatabase, query: PropertyGroupListQuery) {
    const conditions = []
    if (query.parentGroupId) conditions.push(eq(propertyGroups.parentGroupId, query.parentGroupId))
    if (query.groupType) conditions.push(eq(propertyGroups.groupType, query.groupType))
    if (query.status) conditions.push(eq(propertyGroups.status, query.status))
    if (query.search) {
      const term = `%${query.search}%`
      conditions.push(
        or(
          ilike(propertyGroups.name, term),
          ilike(propertyGroups.code, term),
          ilike(propertyGroups.brandName, term),
          ilike(propertyGroups.legalName, term),
        ),
      )
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined

    return paginate(
      db
        .select()
        .from(propertyGroups)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(desc(propertyGroups.updatedAt)),
      db.select({ count: sql<number>`count(*)::int` }).from(propertyGroups).where(where),
      query.limit,
      query.offset,
    )
  },

  async getPropertyGroupById(db: PostgresJsDatabase, id: string) {
    const [row] = await db.select().from(propertyGroups).where(eq(propertyGroups.id, id)).limit(1)
    return row ?? null
  },

  async createPropertyGroup(db: PostgresJsDatabase, data: CreatePropertyGroupInput) {
    const [row] = await db.insert(propertyGroups).values(data).returning()
    return row ?? null
  },

  async updatePropertyGroup(db: PostgresJsDatabase, id: string, data: UpdatePropertyGroupInput) {
    const [row] = await db
      .update(propertyGroups)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(propertyGroups.id, id))
      .returning()
    return row ?? null
  },

  async deletePropertyGroup(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(propertyGroups)
      .where(eq(propertyGroups.id, id))
      .returning({ id: propertyGroups.id })
    return row ?? null
  },

  async listPropertyGroupMembers(db: PostgresJsDatabase, query: PropertyGroupMemberListQuery) {
    const conditions = []
    if (query.groupId) conditions.push(eq(propertyGroupMembers.groupId, query.groupId))
    if (query.propertyId) conditions.push(eq(propertyGroupMembers.propertyId, query.propertyId))
    if (query.membershipRole) {
      conditions.push(eq(propertyGroupMembers.membershipRole, query.membershipRole))
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined

    return paginate(
      db
        .select()
        .from(propertyGroupMembers)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(desc(propertyGroupMembers.updatedAt)),
      db.select({ count: sql<number>`count(*)::int` }).from(propertyGroupMembers).where(where),
      query.limit,
      query.offset,
    )
  },

  async getPropertyGroupMemberById(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .select()
      .from(propertyGroupMembers)
      .where(eq(propertyGroupMembers.id, id))
      .limit(1)
    return row ?? null
  },

  async createPropertyGroupMember(db: PostgresJsDatabase, data: CreatePropertyGroupMemberInput) {
    const [group, property] = await Promise.all([
      db
        .select({ id: propertyGroups.id })
        .from(propertyGroups)
        .where(eq(propertyGroups.id, data.groupId))
        .limit(1),
      db
        .select({ id: properties.id })
        .from(properties)
        .where(eq(properties.id, data.propertyId))
        .limit(1),
    ])
    if (!group[0] || !property[0]) return null

    const [row] = await db.insert(propertyGroupMembers).values(data).returning()
    return row ?? null
  },

  async updatePropertyGroupMember(
    db: PostgresJsDatabase,
    id: string,
    data: UpdatePropertyGroupMemberInput,
  ) {
    const [row] = await db
      .update(propertyGroupMembers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(propertyGroupMembers.id, id))
      .returning()
    return row ?? null
  },

  async deletePropertyGroupMember(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(propertyGroupMembers)
      .where(eq(propertyGroupMembers.id, id))
      .returning({ id: propertyGroupMembers.id })
    return row ?? null
  },
}
