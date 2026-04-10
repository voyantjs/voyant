import { identityService } from "@voyantjs/identity/service"
import type {
  InsertAddressForEntity,
  InsertContactPointForEntity,
  InsertNamedContactForEntity,
  UpdateAddress as UpdateIdentityAddress,
  UpdateContactPoint as UpdateIdentityContactPoint,
  UpdateNamedContact as UpdateIdentityNamedContact,
} from "@voyantjs/identity/validation"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"

import { ensureSupplierExists, supplierEntityType } from "./service-shared.js"

export function listContactPoints(db: PostgresJsDatabase, supplierId: string) {
  return identityService.listContactPointsForEntity(db, supplierEntityType, supplierId)
}

export function listNamedContacts(db: PostgresJsDatabase, supplierId: string) {
  return identityService.listNamedContactsForEntity(db, supplierEntityType, supplierId)
}

export async function createNamedContact(
  db: PostgresJsDatabase,
  supplierId: string,
  data: InsertNamedContactForEntity,
) {
  const supplier = await ensureSupplierExists(db, supplierId)
  if (!supplier) {
    return null
  }

  return identityService.createNamedContact(db, {
    ...data,
    entityType: supplierEntityType,
    entityId: supplierId,
  })
}

export function updateNamedContact(
  db: PostgresJsDatabase,
  contactId: string,
  data: UpdateIdentityNamedContact,
) {
  return identityService.updateNamedContact(db, contactId, data)
}

export function deleteNamedContact(db: PostgresJsDatabase, contactId: string) {
  return identityService.deleteNamedContact(db, contactId)
}

export async function createContactPoint(
  db: PostgresJsDatabase,
  supplierId: string,
  data: InsertContactPointForEntity,
) {
  const supplier = await ensureSupplierExists(db, supplierId)
  if (!supplier) {
    return null
  }

  return identityService.createContactPoint(db, {
    ...data,
    entityType: supplierEntityType,
    entityId: supplierId,
  })
}

export function updateContactPoint(
  db: PostgresJsDatabase,
  contactPointId: string,
  data: UpdateIdentityContactPoint,
) {
  return identityService.updateContactPoint(db, contactPointId, data)
}

export function deleteContactPoint(db: PostgresJsDatabase, contactPointId: string) {
  return identityService.deleteContactPoint(db, contactPointId)
}

export function listAddresses(db: PostgresJsDatabase, supplierId: string) {
  return identityService.listAddressesForEntity(db, supplierEntityType, supplierId)
}

export async function createAddress(
  db: PostgresJsDatabase,
  supplierId: string,
  data: InsertAddressForEntity,
) {
  const supplier = await ensureSupplierExists(db, supplierId)
  if (!supplier) {
    return null
  }

  return identityService.createAddress(db, {
    ...data,
    entityType: supplierEntityType,
    entityId: supplierId,
  })
}

export function updateAddress(
  db: PostgresJsDatabase,
  addressId: string,
  data: UpdateIdentityAddress,
) {
  return identityService.updateAddress(db, addressId, data)
}

export function deleteAddress(db: PostgresJsDatabase, addressId: string) {
  return identityService.deleteAddress(db, addressId)
}
