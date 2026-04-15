import { type KmsEnvelope, kmsEnvelopeSchema } from "@voyantjs/db/schema/iam"
import { z } from "zod"

export const transactionParticipantIdentitySchema = z.object({
  dateOfBirth: z.string().optional().nullable(),
  nationality: z.string().max(2).optional().nullable(),
})

export const decryptedTransactionParticipantIdentitySchema = z.object({
  participantId: z.string(),
  participantKind: z.enum(["offer", "order"]),
  dateOfBirth: z.string().nullable(),
  nationality: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const transactionParticipantIdentityEnvelopeSchema = z.object({
  identityEncrypted: kmsEnvelopeSchema.optional().nullable(),
})

export type TransactionParticipantIdentity = z.infer<typeof transactionParticipantIdentitySchema>
export type TransactionParticipantIdentityEnvelope = {
  identityEncrypted?: KmsEnvelope | null
}
export type DecryptedTransactionParticipantIdentity = z.infer<
  typeof decryptedTransactionParticipantIdentitySchema
>
