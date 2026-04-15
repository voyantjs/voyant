import { type KmsEnvelope, kmsEnvelopeSchema } from "@voyantjs/db/schema/iam"
import { boolean, index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { z } from "zod"

import { bookingParticipants } from "../schema.js"

export const bookingParticipantIdentitySchema = z.object({
  nationality: z.string().optional().nullable(),
  passportNumber: z.string().optional().nullable(),
  passportExpiry: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
})

export const bookingParticipantDietarySchema = z.object({
  dietaryRequirements: z.string().optional().nullable(),
})

export const decryptedBookingParticipantTravelDetailSchema = z.object({
  participantId: z.string(),
  nationality: z.string().nullable(),
  passportNumber: z.string().nullable(),
  passportExpiry: z.string().nullable(),
  dateOfBirth: z.string().nullable(),
  dietaryRequirements: z.string().nullable(),
  isLeadTraveler: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const bookingParticipantTravelDetails = pgTable(
  "booking_participant_travel_details",
  {
    participantId: text("participant_id")
      .primaryKey()
      .references(() => bookingParticipants.id, { onDelete: "cascade" }),
    identityEncrypted: jsonb("identity_encrypted").$type<KmsEnvelope>(),
    dietaryEncrypted: jsonb("dietary_encrypted").$type<KmsEnvelope>(),
    isLeadTraveler: boolean("is_lead_traveler").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("idx_bptd_lead_traveler").on(t.isLeadTraveler)],
)

const bookingParticipantTravelDetailCoreSchema = z.object({
  participantId: z.string().min(1),
  identityEncrypted: kmsEnvelopeSchema.optional().nullable(),
  dietaryEncrypted: kmsEnvelopeSchema.optional().nullable(),
  isLeadTraveler: z.boolean().default(false),
})

export const bookingParticipantTravelDetailInsertSchema = bookingParticipantTravelDetailCoreSchema
export const bookingParticipantTravelDetailUpdateSchema = bookingParticipantTravelDetailCoreSchema
  .partial()
  .omit({ participantId: true })
export const bookingParticipantTravelDetailSelectSchema =
  bookingParticipantTravelDetailCoreSchema.extend({
    createdAt: z.date(),
    updatedAt: z.date(),
  })

export type BookingParticipantIdentity = z.infer<typeof bookingParticipantIdentitySchema>
export type BookingParticipantDietary = z.infer<typeof bookingParticipantDietarySchema>
export type BookingParticipantTravelDetail = typeof bookingParticipantTravelDetails.$inferSelect
export type NewBookingParticipantTravelDetail = typeof bookingParticipantTravelDetails.$inferInsert
export type DecryptedBookingParticipantTravelDetail = z.infer<
  typeof decryptedBookingParticipantTravelDetailSchema
>
