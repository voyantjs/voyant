import { z } from "zod"

// Base64-encoded ciphertext produced by GCP KMS
export const kmsCiphertextB64Schema = z.string().min(1)

// Standard envelope used in DB jsonb columns like `config_encrypted`
export const kmsEncryptedEnvelopeSchema = z.object({
  enc: kmsCiphertextB64Schema,
})

export type KmsEncryptedEnvelope = z.infer<typeof kmsEncryptedEnvelopeSchema>
