import type { KeyRef, KmsProvider } from "@voyantjs/utils"
import { decryptOptionalJsonEnvelope, encryptOptionalJsonEnvelope } from "@voyantjs/utils"
import { eq } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import {
  bookingParticipantDietarySchema,
  bookingParticipantIdentitySchema,
  bookingParticipantTravelDetails,
  type DecryptedBookingParticipantTravelDetail,
} from "./schema/travel-details.js"
import { bookingParticipants } from "./schema.js"

export interface UpsertBookingParticipantTravelDetailInput {
  nationality?: string | null
  passportNumber?: string | null
  passportExpiry?: string | null
  dateOfBirth?: string | null
  dietaryRequirements?: string | null
  isLeadTraveler?: boolean | null
}

export interface BookingPiiAuditEvent {
  action: "encrypt" | "decrypt" | "delete"
  participantId: string
  actorId?: string | null
}

export interface BookingPiiServiceOptions {
  kms: KmsProvider
  keyRef?: KeyRef
  onAudit?: (event: BookingPiiAuditEvent) => void | Promise<void>
}

function buildIdentityPayload(input: UpsertBookingParticipantTravelDetailInput) {
  const payload = bookingParticipantIdentitySchema.parse({
    nationality: input.nationality ?? null,
    passportNumber: input.passportNumber ?? null,
    passportExpiry: input.passportExpiry ?? null,
    dateOfBirth: input.dateOfBirth ?? null,
  })

  if (
    !payload.nationality &&
    !payload.passportNumber &&
    !payload.passportExpiry &&
    !payload.dateOfBirth
  ) {
    return null
  }

  return payload
}

function buildDietaryPayload(input: UpsertBookingParticipantTravelDetailInput) {
  const payload = bookingParticipantDietarySchema.parse({
    dietaryRequirements: input.dietaryRequirements ?? null,
  })

  if (!payload.dietaryRequirements) {
    return null
  }

  return payload
}

async function loadExistingTravelDetails(
  db: PostgresJsDatabase,
  participantId: string,
  options: BookingPiiServiceOptions,
  keyRef: KeyRef,
) {
  const [row] = await db
    .select()
    .from(bookingParticipantTravelDetails)
    .where(eq(bookingParticipantTravelDetails.participantId, participantId))
    .limit(1)

  if (!row) {
    return null
  }

  const identity = await decryptOptionalJsonEnvelope(
    options.kms,
    keyRef,
    row.identityEncrypted,
    bookingParticipantIdentitySchema,
  )
  const dietary = await decryptOptionalJsonEnvelope(
    options.kms,
    keyRef,
    row.dietaryEncrypted,
    bookingParticipantDietarySchema,
  )

  return {
    nationality: identity?.nationality ?? null,
    passportNumber: identity?.passportNumber ?? null,
    passportExpiry: identity?.passportExpiry ?? null,
    dateOfBirth: identity?.dateOfBirth ?? null,
    dietaryRequirements: dietary?.dietaryRequirements ?? null,
    isLeadTraveler: row.isLeadTraveler,
  }
}

function mergeTravelDetailInput(
  existing: Awaited<ReturnType<typeof loadExistingTravelDetails>>,
  input: UpsertBookingParticipantTravelDetailInput,
): UpsertBookingParticipantTravelDetailInput {
  return {
    nationality:
      input.nationality === undefined ? (existing?.nationality ?? null) : input.nationality,
    passportNumber:
      input.passportNumber === undefined
        ? (existing?.passportNumber ?? null)
        : input.passportNumber,
    passportExpiry:
      input.passportExpiry === undefined
        ? (existing?.passportExpiry ?? null)
        : input.passportExpiry,
    dateOfBirth:
      input.dateOfBirth === undefined ? (existing?.dateOfBirth ?? null) : input.dateOfBirth,
    dietaryRequirements:
      input.dietaryRequirements === undefined
        ? (existing?.dietaryRequirements ?? null)
        : input.dietaryRequirements,
    isLeadTraveler:
      input.isLeadTraveler === undefined
        ? (existing?.isLeadTraveler ?? false)
        : input.isLeadTraveler,
  }
}

export function createBookingPiiService(options: BookingPiiServiceOptions) {
  const keyRef = options.keyRef ?? { keyType: "people" as const }

  return {
    async getParticipantTravelDetails(
      db: PostgresJsDatabase,
      participantId: string,
      actorId?: string | null,
    ): Promise<DecryptedBookingParticipantTravelDetail | null> {
      const [row] = await db
        .select()
        .from(bookingParticipantTravelDetails)
        .where(eq(bookingParticipantTravelDetails.participantId, participantId))
        .limit(1)

      if (!row) {
        return null
      }

      const identity = await decryptOptionalJsonEnvelope(
        options.kms,
        keyRef,
        row.identityEncrypted,
        bookingParticipantIdentitySchema,
      )
      const dietary = await decryptOptionalJsonEnvelope(
        options.kms,
        keyRef,
        row.dietaryEncrypted,
        bookingParticipantDietarySchema,
      )

      await options.onAudit?.({ action: "decrypt", participantId, actorId })

      return {
        participantId: row.participantId,
        nationality: identity?.nationality ?? null,
        passportNumber: identity?.passportNumber ?? null,
        passportExpiry: identity?.passportExpiry ?? null,
        dateOfBirth: identity?.dateOfBirth ?? null,
        dietaryRequirements: dietary?.dietaryRequirements ?? null,
        isLeadTraveler: row.isLeadTraveler,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }
    },

    async upsertParticipantTravelDetails(
      db: PostgresJsDatabase,
      participantId: string,
      input: UpsertBookingParticipantTravelDetailInput,
      actorId?: string | null,
    ): Promise<DecryptedBookingParticipantTravelDetail | null> {
      const [participant] = await db
        .select({ id: bookingParticipants.id })
        .from(bookingParticipants)
        .where(eq(bookingParticipants.id, participantId))
        .limit(1)

      if (!participant) {
        return null
      }

      const existing = await loadExistingTravelDetails(db, participantId, options, keyRef)
      const mergedInput = mergeTravelDetailInput(existing, input)

      const identityEncrypted = await encryptOptionalJsonEnvelope(
        options.kms,
        keyRef,
        buildIdentityPayload(mergedInput),
      )
      const dietaryEncrypted = await encryptOptionalJsonEnvelope(
        options.kms,
        keyRef,
        buildDietaryPayload(mergedInput),
      )
      const now = new Date()

      await db
        .insert(bookingParticipantTravelDetails)
        .values({
          participantId,
          identityEncrypted,
          dietaryEncrypted,
          isLeadTraveler: mergedInput.isLeadTraveler ?? false,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: bookingParticipantTravelDetails.participantId,
          set: {
            identityEncrypted,
            dietaryEncrypted,
            isLeadTraveler: mergedInput.isLeadTraveler ?? false,
            updatedAt: now,
          },
        })

      await options.onAudit?.({ action: "encrypt", participantId, actorId })

      return this.getParticipantTravelDetails(db, participantId, actorId)
    },

    async deleteParticipantTravelDetails(
      db: PostgresJsDatabase,
      participantId: string,
      actorId?: string | null,
    ) {
      const [row] = await db
        .delete(bookingParticipantTravelDetails)
        .where(eq(bookingParticipantTravelDetails.participantId, participantId))
        .returning({ participantId: bookingParticipantTravelDetails.participantId })

      if (row) {
        await options.onAudit?.({ action: "delete", participantId, actorId })
      }

      return row ?? null
    },
  }
}
