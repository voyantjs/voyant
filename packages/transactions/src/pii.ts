import type { KeyRef, KmsProvider } from "@voyantjs/utils"
import { decryptOptionalJsonEnvelope, encryptOptionalJsonEnvelope } from "@voyantjs/utils"
import { eq } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import {
  type DecryptedTransactionParticipantIdentity,
  decryptedTransactionParticipantIdentitySchema,
  transactionParticipantIdentitySchema,
} from "./schema/participant-identity.js"
import {
  type OfferParticipant,
  type OrderParticipant,
  offerParticipants,
  orderParticipants,
} from "./schema.js"

export interface UpsertTransactionParticipantIdentityInput {
  dateOfBirth?: string | null
  nationality?: string | null
}

export interface TransactionPiiAuditEvent {
  action: "read" | "update" | "delete"
  participantId: string
  participantKind: "offer" | "order"
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

function buildIdentityPayload(input: UpsertTransactionParticipantIdentityInput) {
  const payload = transactionParticipantIdentitySchema.parse({
    dateOfBirth: input.dateOfBirth ?? null,
    nationality: input.nationality ?? null,
  })

  if (!payload.dateOfBirth && !payload.nationality) {
    return null
  }

  return payload
}

function mergeIdentityInput(
  existing: DecryptedTransactionParticipantIdentity | null,
  input: UpsertTransactionParticipantIdentityInput,
): UpsertTransactionParticipantIdentityInput {
  return {
    dateOfBirth:
      input.dateOfBirth === undefined ? (existing?.dateOfBirth ?? null) : input.dateOfBirth,
    nationality:
      input.nationality === undefined ? (existing?.nationality ?? null) : input.nationality,
  }
}

async function getOfferParticipant(db: PostgresJsDatabase, participantId: string) {
  const [row] = await db
    .select()
    .from(offerParticipants)
    .where(eq(offerParticipants.id, participantId))
    .limit(1)

  return row ? { ...row, kind: "offer" as const } : null
}

async function getOrderParticipant(db: PostgresJsDatabase, participantId: string) {
  const [row] = await db
    .select()
    .from(orderParticipants)
    .where(eq(orderParticipants.id, participantId))
    .limit(1)

  return row ? { ...row, kind: "order" as const } : null
}

async function findParticipant(
  db: PostgresJsDatabase,
  participantKind: "offer" | "order",
  participantId: string,
): Promise<ParticipantRow | null> {
  return participantKind === "offer"
    ? getOfferParticipant(db, participantId)
    : getOrderParticipant(db, participantId)
}

export function createTransactionPiiService(options: TransactionPiiServiceOptions) {
  const keyRef = options.keyRef ?? { keyType: "people" as const }

  return {
    async getParticipantIdentity(
      db: PostgresJsDatabase,
      participantKind: "offer" | "order",
      participantId: string,
      actorId?: string | null,
    ): Promise<DecryptedTransactionParticipantIdentity | null> {
      const participant = await findParticipant(db, participantKind, participantId)
      if (!participant) {
        return null
      }

      const identity = await decryptOptionalJsonEnvelope(
        options.kms,
        keyRef,
        participant.identityEncrypted,
        transactionParticipantIdentitySchema,
      )

      const row = decryptedTransactionParticipantIdentitySchema.parse({
        participantId: participant.id,
        participantKind,
        dateOfBirth: identity?.dateOfBirth ?? null,
        nationality: identity?.nationality ?? null,
        createdAt: participant.createdAt,
        updatedAt: participant.updatedAt,
      })

      await options.onAudit?.({ action: "read", participantId, participantKind, actorId })
      return row
    },

    async upsertParticipantIdentity(
      db: PostgresJsDatabase,
      participantKind: "offer" | "order",
      participantId: string,
      input: UpsertTransactionParticipantIdentityInput,
      actorId?: string | null,
    ): Promise<DecryptedTransactionParticipantIdentity | null> {
      const participant = await findParticipant(db, participantKind, participantId)
      if (!participant) {
        return null
      }

      const existing = await this.getParticipantIdentity(db, participantKind, participantId)
      const merged = mergeIdentityInput(existing, input)
      const identityEncrypted = await encryptOptionalJsonEnvelope(
        options.kms,
        keyRef,
        buildIdentityPayload(merged),
      )

      if (participantKind === "offer") {
        await db
          .update(offerParticipants)
          .set({ identityEncrypted, updatedAt: new Date() })
          .where(eq(offerParticipants.id, participantId))
      } else {
        await db
          .update(orderParticipants)
          .set({ identityEncrypted, updatedAt: new Date() })
          .where(eq(orderParticipants.id, participantId))
      }

      await options.onAudit?.({ action: "update", participantId, participantKind, actorId })
      return this.getParticipantIdentity(db, participantKind, participantId, actorId)
    },

    async deleteParticipantIdentity(
      db: PostgresJsDatabase,
      participantKind: "offer" | "order",
      participantId: string,
      actorId?: string | null,
    ) {
      const participant = await findParticipant(db, participantKind, participantId)
      if (!participant) {
        return null
      }

      if (participantKind === "offer") {
        await db
          .update(offerParticipants)
          .set({ identityEncrypted: null, updatedAt: new Date() })
          .where(eq(offerParticipants.id, participantId))
      } else {
        await db
          .update(orderParticipants)
          .set({ identityEncrypted: null, updatedAt: new Date() })
          .where(eq(orderParticipants.id, participantId))
      }

      await options.onAudit?.({ action: "delete", participantId, participantKind, actorId })
      return { participantId, participantKind }
    },
  }
}
