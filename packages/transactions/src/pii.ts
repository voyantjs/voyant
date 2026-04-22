import type { KeyRef, KmsProvider } from "@voyantjs/utils"
import { decryptOptionalJsonEnvelope, encryptOptionalJsonEnvelope } from "@voyantjs/utils"
import { eq } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import {
  type DecryptedTransactionTravelerIdentity,
  decryptedTransactionTravelerIdentitySchema,
  transactionTravelerIdentitySchema,
} from "./schema/participant-identity.js"
import {
  type OfferParticipant,
  type OrderParticipant,
  offerParticipants,
  orderParticipants,
} from "./schema.js"

export interface UpsertTransactionTravelerIdentityInput {
  dateOfBirth?: string | null
  nationality?: string | null
}

export type UpsertTransactionParticipantIdentityInput = UpsertTransactionTravelerIdentityInput

export interface TransactionPiiAuditEvent {
  action: "read" | "update" | "delete"
  travelerId: string
  travelerKind: "offer" | "order"
  actorId?: string | null
}

export interface TransactionPiiServiceOptions {
  kms: KmsProvider
  keyRef?: KeyRef
  onAudit?: (event: TransactionPiiAuditEvent) => void | Promise<void>
}

type ParticipantRow =
  | (OfferParticipant & { kind: "offer" })
  | (OrderParticipant & { kind: "order" })

function buildIdentityPayload(input: UpsertTransactionTravelerIdentityInput) {
  const payload = transactionTravelerIdentitySchema.parse({
    dateOfBirth: input.dateOfBirth ?? null,
    nationality: input.nationality ?? null,
  })

  if (!payload.dateOfBirth && !payload.nationality) {
    return null
  }

  return payload
}

function mergeIdentityInput(
  existing: DecryptedTransactionTravelerIdentity | null,
  input: UpsertTransactionTravelerIdentityInput,
): UpsertTransactionTravelerIdentityInput {
  return {
    dateOfBirth:
      input.dateOfBirth === undefined ? (existing?.dateOfBirth ?? null) : input.dateOfBirth,
    nationality:
      input.nationality === undefined ? (existing?.nationality ?? null) : input.nationality,
  }
}

async function getOfferParticipant(db: PostgresJsDatabase, travelerId: string) {
  const [row] = await db
    .select()
    .from(offerParticipants)
    .where(eq(offerParticipants.id, travelerId))
    .limit(1)

  return row ? { ...row, kind: "offer" as const } : null
}

async function getOrderParticipant(db: PostgresJsDatabase, travelerId: string) {
  const [row] = await db
    .select()
    .from(orderParticipants)
    .where(eq(orderParticipants.id, travelerId))
    .limit(1)

  return row ? { ...row, kind: "order" as const } : null
}

async function findParticipant(
  db: PostgresJsDatabase,
  travelerKind: "offer" | "order",
  travelerId: string,
): Promise<ParticipantRow | null> {
  return travelerKind === "offer"
    ? getOfferParticipant(db, travelerId)
    : getOrderParticipant(db, travelerId)
}

export function createTransactionPiiService(options: TransactionPiiServiceOptions) {
  const keyRef = options.keyRef ?? { keyType: "people" as const }

  async function getTravelerIdentity(
    db: PostgresJsDatabase,
    travelerKind: "offer" | "order",
    travelerId: string,
    actorId?: string | null,
  ): Promise<DecryptedTransactionTravelerIdentity | null> {
    const participant = await findParticipant(db, travelerKind, travelerId)
    if (!participant) {
      return null
    }

    const identity = await decryptOptionalJsonEnvelope(
      options.kms,
      keyRef,
      participant.identityEncrypted,
      transactionTravelerIdentitySchema,
    )

    const row = decryptedTransactionTravelerIdentitySchema.parse({
      travelerId: participant.id,
      travelerKind,
      dateOfBirth: identity?.dateOfBirth ?? null,
      nationality: identity?.nationality ?? null,
      createdAt: participant.createdAt,
      updatedAt: participant.updatedAt,
    })

    await options.onAudit?.({ action: "read", travelerId, travelerKind, actorId })
    return row
  }

  async function upsertTravelerIdentity(
    db: PostgresJsDatabase,
    travelerKind: "offer" | "order",
    travelerId: string,
    input: UpsertTransactionTravelerIdentityInput,
    actorId?: string | null,
  ): Promise<DecryptedTransactionTravelerIdentity | null> {
    const participant = await findParticipant(db, travelerKind, travelerId)
    if (!participant) {
      return null
    }

    const existing = await getTravelerIdentity(db, travelerKind, travelerId)
    const merged = mergeIdentityInput(existing, input)
    const identityEncrypted = await encryptOptionalJsonEnvelope(
      options.kms,
      keyRef,
      buildIdentityPayload(merged),
    )

    if (travelerKind === "offer") {
      await db
        .update(offerParticipants)
        .set({ identityEncrypted, updatedAt: new Date() })
        .where(eq(offerParticipants.id, travelerId))
    } else {
      await db
        .update(orderParticipants)
        .set({ identityEncrypted, updatedAt: new Date() })
        .where(eq(orderParticipants.id, travelerId))
    }

    await options.onAudit?.({ action: "update", travelerId, travelerKind, actorId })
    return getTravelerIdentity(db, travelerKind, travelerId, actorId)
  }

  async function deleteTravelerIdentity(
    db: PostgresJsDatabase,
    travelerKind: "offer" | "order",
    travelerId: string,
    actorId?: string | null,
  ) {
    const participant = await findParticipant(db, travelerKind, travelerId)
    if (!participant) {
      return null
    }

    if (travelerKind === "offer") {
      await db
        .update(offerParticipants)
        .set({ identityEncrypted: null, updatedAt: new Date() })
        .where(eq(offerParticipants.id, travelerId))
    } else {
      await db
        .update(orderParticipants)
        .set({ identityEncrypted: null, updatedAt: new Date() })
        .where(eq(orderParticipants.id, travelerId))
    }

    await options.onAudit?.({ action: "delete", travelerId, travelerKind, actorId })
    return { travelerId, travelerKind }
  }

  return {
    getTravelerIdentity,
    upsertTravelerIdentity,
    deleteTravelerIdentity,
    getParticipantIdentity: getTravelerIdentity,
    upsertParticipantIdentity: upsertTravelerIdentity,
    deleteParticipantIdentity: deleteTravelerIdentity,
  }
}
