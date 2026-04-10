import { identityAddresses, identityContactPoints } from "@voyantjs/identity/schema"
import { identityService } from "@voyantjs/identity/service"
import type {
  insertAddressSchema,
  insertContactPointSchema,
  updateAddressSchema,
  updateContactPointSchema,
} from "@voyantjs/identity/validation"
import { and, eq, inArray } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import type { z } from "zod"

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
  toNullableTrimmed,
} from "./helpers.js"

export type OrganizationListQuery = z.infer<typeof organizationListQuerySchema>
export type CreateOrganizationInput = z.infer<typeof insertOrganizationSchema>
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>
export type PersonListQuery = z.infer<typeof personListQuerySchema>
export type CreatePersonInput = z.infer<typeof insertPersonSchema>
export type UpdatePersonInput = z.infer<typeof updatePersonSchema>
export type CreateContactPointInput = z.infer<typeof insertContactPointSchema>
export type UpdateContactPointInput = z.infer<typeof updateContactPointSchema>
export type CreateAddressInput = z.infer<typeof insertAddressSchema>
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>
export type CreatePersonNoteInput = z.infer<typeof insertPersonNoteSchema>
export type CreateOrganizationNoteInput = z.infer<typeof insertOrganizationNoteSchema>
export type CreateCommunicationLogInput = z.infer<typeof insertCommunicationLogSchema>
export type CommunicationListQuery = z.infer<typeof communicationListQuerySchema>
export type CreateSegmentInput = z.infer<typeof insertSegmentSchema>

export const organizationEntityType = "organization"
export const personEntityType = "person"
export const personBaseIdentitySource = "crm.person.base"

type PersonIdentityInput = Pick<
  CreatePersonInput,
  "email" | "phone" | "website" | "address" | "city" | "country"
>

export type PersonHydratedFields = {
  email: string | null
  phone: string | null
  website: string | null
  address: string | null
  city: string | null
  country: string | null
}

export function personBaseFields(data: CreatePersonInput | UpdatePersonInput) {
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

export async function syncPersonIdentity(
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

export async function deletePersonIdentity(db: PostgresJsDatabase, personId: string) {
  const [contactPoints, addresses] = await Promise.all([
    identityService.listContactPointsForEntity(db, personEntityType, personId),
    identityService.listAddressesForEntity(db, personEntityType, personId),
  ])

  await Promise.all([
    ...contactPoints.map((point) => identityService.deleteContactPoint(db, point.id)),
    ...addresses.map((address) => identityService.deleteAddress(db, address.id)),
  ])
}

export async function hydratePeople<T extends { id: string }>(
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
