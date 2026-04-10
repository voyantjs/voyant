import { describe, expect, it } from "vitest"

import {
  insertBookingItemParticipantSchema,
  insertBookingItemSchema,
  insertParticipantSchema,
  insertPassengerSchema,
} from "../../src/validation.js"

describe("Participant schema", () => {
  const valid = { firstName: "John", lastName: "Doe" }

  it("accepts valid input with defaults", () => {
    const result = insertParticipantSchema.parse(valid)
    expect(result.firstName).toBe("John")
    expect(result.lastName).toBe("Doe")
    expect(result.participantType).toBe("traveler")
    expect(result.isPrimary).toBe(false)
  })

  it("rejects empty firstName", () => {
    expect(() => insertParticipantSchema.parse({ ...valid, firstName: "" })).toThrow()
  })

  it("rejects empty lastName", () => {
    expect(() => insertParticipantSchema.parse({ ...valid, lastName: "" })).toThrow()
  })

  it("validates email format", () => {
    expect(() => insertParticipantSchema.parse({ ...valid, email: "not-an-email" })).toThrow()
    expect(insertParticipantSchema.parse({ ...valid, email: "john@example.com" }).email).toBe(
      "john@example.com",
    )
  })

  it("accepts valid participant types", () => {
    for (const participantType of ["traveler", "booker", "contact", "occupant", "staff", "other"]) {
      expect(insertParticipantSchema.parse({ ...valid, participantType }).participantType).toBe(
        participantType,
      )
    }
  })

  it("accepts valid traveler categories", () => {
    for (const travelerCategory of ["adult", "child", "infant", "senior", "other"]) {
      expect(insertParticipantSchema.parse({ ...valid, travelerCategory }).travelerCategory).toBe(
        travelerCategory,
      )
    }
  })
})

describe("Passenger schema (legacy)", () => {
  const valid = { firstName: "Jane", lastName: "Smith" }

  it("accepts valid input with defaults", () => {
    const result = insertPassengerSchema.parse(valid)
    expect(result.firstName).toBe("Jane")
  })

  it("rejects empty firstName", () => {
    expect(() => insertPassengerSchema.parse({ ...valid, firstName: "" })).toThrow()
  })
})

describe("Booking item schema", () => {
  const valid = { title: "Airport Transfer", sellCurrency: "EUR" }

  it("accepts valid input with defaults", () => {
    const result = insertBookingItemSchema.parse(valid)
    expect(result.title).toBe("Airport Transfer")
    expect(result.itemType).toBe("unit")
    expect(result.status).toBe("draft")
    expect(result.quantity).toBe(1)
  })

  it("rejects empty title", () => {
    expect(() => insertBookingItemSchema.parse({ ...valid, title: "" })).toThrow()
  })

  it("rejects title over 255 chars", () => {
    expect(() => insertBookingItemSchema.parse({ ...valid, title: "x".repeat(256) })).toThrow()
  })

  it("accepts valid item types", () => {
    for (const itemType of [
      "unit",
      "extra",
      "service",
      "fee",
      "tax",
      "discount",
      "adjustment",
      "accommodation",
      "transport",
      "other",
    ]) {
      expect(insertBookingItemSchema.parse({ ...valid, itemType }).itemType).toBe(itemType)
    }
  })

  it("accepts valid item statuses", () => {
    for (const status of ["draft", "on_hold", "confirmed", "cancelled", "expired", "fulfilled"]) {
      expect(insertBookingItemSchema.parse({ ...valid, status }).status).toBe(status)
    }
  })

  it("rejects non-positive quantity", () => {
    expect(() => insertBookingItemSchema.parse({ ...valid, quantity: 0 })).toThrow()
    expect(() => insertBookingItemSchema.parse({ ...valid, quantity: -1 })).toThrow()
  })

  it("accepts metadata", () => {
    const result = insertBookingItemSchema.parse({ ...valid, metadata: { foo: "bar" } })
    expect(result.metadata).toEqual({ foo: "bar" })
  })
})

describe("Booking item participant schema", () => {
  it("requires participantId with defaults", () => {
    const result = insertBookingItemParticipantSchema.parse({ participantId: "bkpt_abc" })
    expect(result.participantId).toBe("bkpt_abc")
    expect(result.role).toBe("traveler")
    expect(result.isPrimary).toBe(false)
  })

  it("rejects empty participantId", () => {
    expect(() => insertBookingItemParticipantSchema.parse({ participantId: "" })).toThrow()
  })

  it("accepts valid roles", () => {
    for (const role of [
      "traveler",
      "occupant",
      "primary_contact",
      "service_assignee",
      "beneficiary",
      "other",
    ]) {
      expect(
        insertBookingItemParticipantSchema.parse({ participantId: "bkpt_abc", role }).role,
      ).toBe(role)
    }
  })
})
