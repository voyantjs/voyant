import { eq, sql } from "drizzle-orm"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"

import { bookingParticipants, bookings } from "../../src/schema.js"
import { createBookingPiiService } from "../../src/pii.js"
import { bookingParticipantTravelDetails } from "../../src/schema/travel-details.js"

const DB_AVAILABLE = !!process.env.TEST_DATABASE_URL

let seq = 0
function nextBookingNumber() {
  seq++
  return `BK-PII-${String(seq).padStart(6, "0")}`
}

describe.skipIf(!DB_AVAILABLE)("Booking PII service", () => {
  // biome-ignore lint/suspicious/noExplicitAny: test db typing
  let db: any

  beforeAll(async () => {
    const { createTestDb, cleanupTestDb } = await import("@voyantjs/db/test-utils")
    db = createTestDb()
    await cleanupTestDb(db)

    await db.execute(sql`DROP TABLE IF EXISTS booking_participant_travel_details CASCADE`)
    await db.execute(sql`
      CREATE TABLE booking_participant_travel_details (
        participant_id text PRIMARY KEY NOT NULL REFERENCES booking_participants(id) ON DELETE cascade,
        identity_encrypted jsonb,
        dietary_encrypted jsonb,
        is_lead_traveler boolean DEFAULT false NOT NULL,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      )
    `)
    await db.execute(
      sql`CREATE INDEX idx_bptd_lead_traveler ON booking_participant_travel_details (is_lead_traveler)`,
    )
  })

  beforeEach(async () => {
    seq = 0
    const { cleanupTestDb } = await import("@voyantjs/db/test-utils")
    await cleanupTestDb(db)
  })

  afterAll(async () => {
    const { closeTestDb } = await import("@voyantjs/db/test-utils")
    await closeTestDb()
  })

  async function seedParticipant() {
    const [booking] = await db
      .insert(bookings)
      .values({
        bookingNumber: nextBookingNumber(),
        sellCurrency: "EUR",
      })
      .returning()

    const [participant] = await db
      .insert(bookingParticipants)
      .values({
        bookingId: booking.id,
        participantType: "traveler",
        firstName: "Ana",
        lastName: "Traveler",
      })
      .returning()

    return { booking, participant }
  }

  it("encrypts participant travel details at rest and decrypts them on read", async () => {
    const { generateEnvKmsKey, EnvKmsProvider } = await import("@voyantjs/utils")
    const { participant } = await seedParticipant()

    const pii = createBookingPiiService({
      kms: new EnvKmsProvider({ key: generateEnvKmsKey() }),
    })

    const result = await pii.upsertParticipantTravelDetails(db, participant.id, {
      nationality: "RO",
      passportNumber: "123456789",
      passportExpiry: "2030-01-01",
      dateOfBirth: "1990-02-03",
      dietaryRequirements: "vegetarian",
      isLeadTraveler: true,
    })

    expect(result?.passportNumber).toBe("123456789")
    expect(result?.dateOfBirth).toBe("1990-02-03")
    expect(result?.dietaryRequirements).toBe("vegetarian")
    expect(result?.isLeadTraveler).toBe(true)

    const [stored] = await db
      .select()
      .from(bookingParticipantTravelDetails)
      .where(eq(bookingParticipantTravelDetails.participantId, participant.id))

    expect(stored?.identityEncrypted?.enc).toMatch(/^env:v1:/)
    expect(stored?.identityEncrypted?.enc).not.toContain("123456789")
    expect(stored?.dietaryEncrypted?.enc).toMatch(/^env:v1:/)
    expect(stored?.dietaryEncrypted?.enc).not.toContain("vegetarian")

    const readBack = await pii.getParticipantTravelDetails(db, participant.id)
    expect(readBack).toEqual(result)
  }, 20000)

  it("deletes participant travel details", async () => {
    const { generateEnvKmsKey, EnvKmsProvider } = await import("@voyantjs/utils")
    const { participant } = await seedParticipant()

    const pii = createBookingPiiService({
      kms: new EnvKmsProvider({ key: generateEnvKmsKey() }),
    })

    await pii.upsertParticipantTravelDetails(db, participant.id, {
      passportNumber: "ABC123",
    })

    const deleted = await pii.deleteParticipantTravelDetails(db, participant.id)
    expect(deleted?.participantId).toBe(participant.id)

    const row = await pii.getParticipantTravelDetails(db, participant.id)
    expect(row).toBeNull()
  }, 20000)
})
