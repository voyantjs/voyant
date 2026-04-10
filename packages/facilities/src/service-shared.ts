import { identityAddresses } from "@voyantjs/identity/schema"
import { identityService } from "@voyantjs/identity/service"
import { and, eq, inArray } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import type { z } from "zod"

import { facilities } from "./schema.js"
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

export type FacilityListQuery = z.infer<typeof facilityListQuerySchema>
export type CreateFacilityInput = z.infer<typeof insertFacilitySchema>
export type UpdateFacilityInput = z.infer<typeof updateFacilitySchema>
export type FacilityContactListQuery = z.infer<typeof facilityContactListQuerySchema>
export type CreateFacilityContactInput = z.infer<typeof insertFacilityContactSchema>
export type UpdateFacilityContactInput = z.infer<typeof updateFacilityContactSchema>
export type FacilityFeatureListQuery = z.infer<typeof facilityFeatureListQuerySchema>
export type CreateFacilityFeatureInput = z.infer<typeof insertFacilityFeatureSchema>
export type UpdateFacilityFeatureInput = z.infer<typeof updateFacilityFeatureSchema>
export type FacilityOperationScheduleListQuery = z.infer<
  typeof facilityOperationScheduleListQuerySchema
>
export type CreateFacilityOperationScheduleInput = z.infer<
  typeof insertFacilityOperationScheduleSchema
>
export type UpdateFacilityOperationScheduleInput = z.infer<
  typeof updateFacilityOperationScheduleSchema
>
export type PropertyListQuery = z.infer<typeof propertyListQuerySchema>
export type CreatePropertyInput = z.infer<typeof insertPropertySchema>
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>
export type PropertyGroupListQuery = z.infer<typeof propertyGroupListQuerySchema>
export type CreatePropertyGroupInput = z.infer<typeof insertPropertyGroupSchema>
export type UpdatePropertyGroupInput = z.infer<typeof updatePropertyGroupSchema>
export type PropertyGroupMemberListQuery = z.infer<typeof propertyGroupMemberListQuerySchema>
export type CreatePropertyGroupMemberInput = z.infer<typeof insertPropertyGroupMemberSchema>
export type UpdatePropertyGroupMemberInput = z.infer<typeof updatePropertyGroupMemberSchema>

export const facilityEntityType = "facility"
export const facilityBaseIdentitySource = "facilities.base"
export const facilityContactIdentitySource = "facilities.contacts"

export async function paginate<T extends object>(
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

export function formatAddress(address: {
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

export type FacilityAddressInput = Pick<
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

export async function ensureFacilityExists(db: PostgresJsDatabase, facilityId: string) {
  const [facility] = await db
    .select({ id: facilities.id })
    .from(facilities)
    .where(eq(facilities.id, facilityId))
    .limit(1)
  return facility ?? null
}

export async function syncFacilityAddress(
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

export async function hydrateFacilities<T extends { id: string }>(
  db: PostgresJsDatabase,
  rows: T[],
) {
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
