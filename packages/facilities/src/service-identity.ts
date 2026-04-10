import { identityService } from "@voyantjs/identity/service"
import type {
  InsertAddressForEntity,
  InsertContactPointForEntity,
  UpdateAddress as UpdateIdentityAddress,
  UpdateContactPoint as UpdateIdentityContactPoint,
} from "@voyantjs/identity/validation"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"

import type {
  CreateFacilityContactInput,
  FacilityContactListQuery,
  UpdateFacilityContactInput,
} from "./service-shared.js"
import {
  ensureFacilityExists,
  facilityContactIdentitySource,
  facilityEntityType,
} from "./service-shared.js"

export function listContactPoints(db: PostgresJsDatabase, facilityId: string) {
  return identityService.listContactPointsForEntity(db, facilityEntityType, facilityId)
}

export async function createContactPoint(
  db: PostgresJsDatabase,
  facilityId: string,
  data: InsertContactPointForEntity,
) {
  const facility = await ensureFacilityExists(db, facilityId)
  if (!facility) return null

  return identityService.createContactPoint(db, {
    ...data,
    entityType: facilityEntityType,
    entityId: facilityId,
  })
}

export function updateContactPoint(
  db: PostgresJsDatabase,
  id: string,
  data: UpdateIdentityContactPoint,
) {
  return identityService.updateContactPoint(db, id, data)
}

export function deleteContactPoint(db: PostgresJsDatabase, id: string) {
  return identityService.deleteContactPoint(db, id)
}

export function listAddresses(db: PostgresJsDatabase, facilityId: string) {
  return identityService.listAddressesForEntity(db, facilityEntityType, facilityId)
}

export async function createAddress(
  db: PostgresJsDatabase,
  facilityId: string,
  data: InsertAddressForEntity,
) {
  const facility = await ensureFacilityExists(db, facilityId)
  if (!facility) return null

  return identityService.createAddress(db, {
    ...data,
    entityType: facilityEntityType,
    entityId: facilityId,
  })
}

export function updateAddress(db: PostgresJsDatabase, id: string, data: UpdateIdentityAddress) {
  return identityService.updateAddress(db, id, data)
}

export function deleteAddress(db: PostgresJsDatabase, id: string) {
  return identityService.deleteAddress(db, id)
}

export async function listFacilityContacts(
  db: PostgresJsDatabase,
  query: FacilityContactListQuery,
) {
  return identityService.listNamedContacts(db, {
    entityType: facilityEntityType,
    entityId: query.facilityId,
    role: query.role,
    limit: query.limit,
    offset: query.offset,
  })
}

export async function createFacilityContact(
  db: PostgresJsDatabase,
  facilityId: string,
  data: CreateFacilityContactInput,
) {
  const facility = await ensureFacilityExists(db, facilityId)
  if (!facility) return null

  return identityService.createNamedContact(db, {
    ...data,
    entityType: facilityEntityType,
    entityId: facilityId,
    metadata: {
      managedBy: facilityContactIdentitySource,
    },
  })
}

export async function updateFacilityContact(
  db: PostgresJsDatabase,
  id: string,
  data: UpdateFacilityContactInput,
) {
  return identityService.updateNamedContact(db, id, data)
}

export async function deleteFacilityContact(db: PostgresJsDatabase, id: string) {
  return identityService.deleteNamedContact(db, id)
}
