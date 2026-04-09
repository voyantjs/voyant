import { describe, expect, it } from "vitest"

import {
  bookingListQuerySchema,
  cancelBookingSchema,
  confirmBookingSchema,
  convertProductSchema,
  createBookingSchema,
  expireBookingSchema,
  expireStaleBookingsSchema,
  extendBookingHoldSchema,
  insertBookingAllocationSchema,
  insertBookingDocumentSchema,
  insertBookingFulfillmentSchema,
  insertBookingItemParticipantSchema,
  insertBookingItemSchema,
  insertBookingNoteSchema,
  insertBookingSchema,
  insertParticipantSchema,
  insertPassengerSchema,
  recordBookingRedemptionSchema,
  reserveBookingFromTransactionSchema,
  reserveBookingSchema,
  updateBookingAllocationSchema,
  updateBookingFulfillmentSchema,
  updateBookingSchema,
  updateBookingStatusSchema,
} from "../../src/validation.js"

describe("Booking schema", () => {
  const valid = { bookingNumber: "BK-000001", sellCurrency: "USD" }

  it("accepts valid input with defaults", () => {
    const result = insertBookingSchema.parse(valid)
    expect(result.bookingNumber).toBe("BK-000001")
    expect(result.sellCurrency).toBe("USD")
    expect(result.status).toBe("draft")
    expect(result.sourceType).toBe("manual")
  })

  it("rejects missing bookingNumber", () => {
    expect(() => insertBookingSchema.parse({ sellCurrency: "USD" })).toThrow()
  })

  it("rejects empty bookingNumber", () => {
    expect(() => insertBookingSchema.parse({ ...valid, bookingNumber: "" })).toThrow()
  })

  it("rejects bookingNumber over 50 chars", () => {
    expect(() => insertBookingSchema.parse({ ...valid, bookingNumber: "x".repeat(51) })).toThrow()
  })

  it("rejects missing sellCurrency", () => {
    expect(() => insertBookingSchema.parse({ bookingNumber: "BK-1" })).toThrow()
  })

  it("rejects sellCurrency not 3 chars", () => {
    expect(() => insertBookingSchema.parse({ ...valid, sellCurrency: "US" })).toThrow()
    expect(() => insertBookingSchema.parse({ ...valid, sellCurrency: "USDX" })).toThrow()
  })

  it("accepts valid status overrides", () => {
    for (const s of [
      "draft",
      "on_hold",
      "confirmed",
      "in_progress",
      "completed",
      "expired",
      "cancelled",
    ]) {
      expect(insertBookingSchema.parse({ ...valid, status: s }).status).toBe(s)
    }
  })

  it("rejects invalid status", () => {
    expect(() => insertBookingSchema.parse({ ...valid, status: "pending" })).toThrow()
  })

  it("accepts valid sourceType overrides", () => {
    for (const s of [
      "direct",
      "manual",
      "affiliate",
      "ota",
      "reseller",
      "api_partner",
      "internal",
    ]) {
      expect(insertBookingSchema.parse({ ...valid, sourceType: s }).sourceType).toBe(s)
    }
  })

  it("accepts nullable optional FK fields", () => {
    const result = insertBookingSchema.parse({
      ...valid,
      personId: null,
      organizationId: null,
    })
    expect(result.personId).toBeNull()
    expect(result.organizationId).toBeNull()
  })

  it("rejects negative sellAmountCents", () => {
    expect(() => insertBookingSchema.parse({ ...valid, sellAmountCents: -1 })).toThrow()
  })

  it("accepts positive pax", () => {
    expect(insertBookingSchema.parse({ ...valid, pax: 5 }).pax).toBe(5)
  })

  it("rejects zero pax", () => {
    expect(() => insertBookingSchema.parse({ ...valid, pax: 0 })).toThrow()
  })
})

describe("Update booking schema", () => {
  it("accepts partial update", () => {
    const result = updateBookingSchema.parse({ status: "confirmed" })
    expect(result.status).toBe("confirmed")
    expect(result.bookingNumber).toBeUndefined()
  })

  it("accepts empty object", () => {
    expect(updateBookingSchema.parse({})).toBeDefined()
  })
})

describe("Manual create booking schema", () => {
  const valid = { bookingNumber: "BK-MANUAL-001", sellCurrency: "USD" }

  it("allows manual and internal source types", () => {
    expect(createBookingSchema.parse(valid).sourceType).toBe("manual")
    expect(createBookingSchema.parse({ ...valid, sourceType: "internal" }).sourceType).toBe(
      "internal",
    )
  })

  it("rejects external source types", () => {
    expect(() => createBookingSchema.parse({ ...valid, sourceType: "direct" })).toThrow()
    expect(() => createBookingSchema.parse({ ...valid, sourceType: "ota" })).toThrow()
  })

  it("rejects on-hold state and hold expiry fields", () => {
    expect(() => createBookingSchema.parse({ ...valid, status: "on_hold" })).toThrow()
    expect(() =>
      createBookingSchema.parse({
        ...valid,
        holdExpiresAt: "2026-06-01T10:00:00.000Z",
      }),
    ).toThrow()
  })
})

describe("Update booking status schema", () => {
  it("requires status", () => {
    const result = updateBookingStatusSchema.parse({ status: "confirmed" })
    expect(result.status).toBe("confirmed")
  })

  it("rejects missing status", () => {
    expect(() => updateBookingStatusSchema.parse({})).toThrow()
  })

  it("accepts optional note", () => {
    const result = updateBookingStatusSchema.parse({ status: "cancelled", note: "Reason" })
    expect(result.note).toBe("Reason")
  })
})

describe("Convert product schema", () => {
  it("requires productId and bookingNumber", () => {
    const result = convertProductSchema.parse({
      productId: "prod_abc",
      bookingNumber: "BK-001",
    })
    expect(result.productId).toBe("prod_abc")
    expect(result.bookingNumber).toBe("BK-001")
  })

  it("rejects empty productId", () => {
    expect(() => convertProductSchema.parse({ productId: "", bookingNumber: "BK-001" })).toThrow()
  })

  it("rejects missing bookingNumber", () => {
    expect(() => convertProductSchema.parse({ productId: "prod_abc" })).toThrow()
  })
})

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
    for (const t of ["traveler", "booker", "contact", "occupant", "staff", "other"]) {
      expect(insertParticipantSchema.parse({ ...valid, participantType: t }).participantType).toBe(
        t,
      )
    }
  })

  it("accepts valid traveler categories", () => {
    for (const c of ["adult", "child", "infant", "senior", "other"]) {
      expect(
        insertParticipantSchema.parse({ ...valid, travelerCategory: c }).travelerCategory,
      ).toBe(c)
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
    for (const t of [
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
      expect(insertBookingItemSchema.parse({ ...valid, itemType: t }).itemType).toBe(t)
    }
  })

  it("accepts valid item statuses", () => {
    for (const s of ["draft", "on_hold", "confirmed", "cancelled", "expired", "fulfilled"]) {
      expect(insertBookingItemSchema.parse({ ...valid, status: s }).status).toBe(s)
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
    for (const r of [
      "traveler",
      "occupant",
      "primary_contact",
      "service_assignee",
      "beneficiary",
      "other",
    ]) {
      expect(
        insertBookingItemParticipantSchema.parse({ participantId: "bkpt_abc", role: r }).role,
      ).toBe(r)
    }
  })
})

describe("Reservation schemas", () => {
  it("parses reserve booking input with defaults", () => {
    const result = reserveBookingSchema.parse({
      bookingNumber: "BK-RES-001",
      sellCurrency: "USD",
      items: [
        {
          title: "Adult ticket",
          availabilitySlotId: "avs_123",
          sourceSnapshotId: "sels_123",
          sourceOfferId: "offr_123",
        },
      ],
    })

    expect(result.holdMinutes).toBe(30)
    expect(result.sourceType).toBe("manual")
    expect(result.items[0]?.itemType).toBe("unit")
    expect(result.items[0]?.allocationType).toBe("unit")
    expect(result.items[0]?.sourceSnapshotId).toBe("sels_123")
    expect(result.items[0]?.sourceOfferId).toBe("offr_123")
  })

  it("requires at least one reservation item", () => {
    expect(() =>
      reserveBookingSchema.parse({
        bookingNumber: "BK-RES-001",
        sellCurrency: "USD",
        items: [],
      }),
    ).toThrow()
  })

  it("requires a hold extension value", () => {
    expect(() => extendBookingHoldSchema.parse({})).toThrow()
    expect(extendBookingHoldSchema.parse({ holdMinutes: 15 }).holdMinutes).toBe(15)
  })

  it("accepts confirm, cancel, and expire payloads", () => {
    expect(confirmBookingSchema.parse({ note: "ok" }).note).toBe("ok")
    expect(cancelBookingSchema.parse({ note: "cancel" }).note).toBe("cancel")
    expect(expireBookingSchema.parse({ note: "expire" }).note).toBe("expire")
  })

  it("parses expire stale bookings payload", () => {
    const result = expireStaleBookingsSchema.parse({
      before: "2026-06-01T10:00:00.000Z",
      note: "sweep",
    })
    expect(result.before).toBe("2026-06-01T10:00:00.000Z")
    expect(result.note).toBe("sweep")
  })

  it("parses booking allocation input", () => {
    const result = insertBookingAllocationSchema.parse({
      bookingItemId: "bki_123",
      availabilitySlotId: "avs_123",
    })

    expect(result.quantity).toBe(1)
    expect(result.status).toBe("held")
  })

  it("accepts partial booking allocation updates", () => {
    const result = updateBookingAllocationSchema.parse({ status: "confirmed" })
    expect(result.status).toBe("confirmed")
  })

  it("parses reserve-from-transaction payload with defaults", () => {
    const result = reserveBookingFromTransactionSchema.parse({
      bookingNumber: "BK-TXN-001",
    })

    expect(result.bookingNumber).toBe("BK-TXN-001")
    expect(result.holdMinutes).toBe(30)
    expect(result.sourceType).toBe("internal")
    expect(result.includeParticipants).toBe(true)
  })
})

describe("Booking fulfillment schema", () => {
  it("accepts valid fulfillment input", () => {
    const result = insertBookingFulfillmentSchema.parse({
      fulfillmentType: "voucher",
      deliveryChannel: "download",
      artifactUrl: "https://example.com/voucher.pdf",
    })

    expect(result.fulfillmentType).toBe("voucher")
    expect(result.deliveryChannel).toBe("download")
    expect(result.status).toBe("issued")
  })

  it("rejects invalid artifact url", () => {
    expect(() =>
      insertBookingFulfillmentSchema.parse({
        fulfillmentType: "ticket",
        deliveryChannel: "email",
        artifactUrl: "not-a-url",
      }),
    ).toThrow()
  })

  it("accepts partial fulfillment update", () => {
    const result = updateBookingFulfillmentSchema.parse({ status: "revoked" })
    expect(result.status).toBe("revoked")
  })
})

describe("Booking redemption schema", () => {
  it("accepts valid redemption input", () => {
    const result = recordBookingRedemptionSchema.parse({
      method: "scan",
      redeemedAt: "2026-06-01T10:00:00.000Z",
      metadata: { gate: "north" },
    })

    expect(result.method).toBe("scan")
    expect(result.redeemedAt).toBe("2026-06-01T10:00:00.000Z")
  })

  it("defaults redemption method to manual", () => {
    const result = recordBookingRedemptionSchema.parse({})
    expect(result.method).toBe("manual")
  })
})

// Supplier status schemas moved to extensions/suppliers

describe("Booking note schema", () => {
  it("requires content", () => {
    const result = insertBookingNoteSchema.parse({ content: "A note" })
    expect(result.content).toBe("A note")
  })

  it("rejects empty content", () => {
    expect(() => insertBookingNoteSchema.parse({ content: "" })).toThrow()
  })

  it("rejects content over 10000 chars", () => {
    expect(() => insertBookingNoteSchema.parse({ content: "x".repeat(10001) })).toThrow()
  })
})

describe("Booking document schema", () => {
  const valid = {
    type: "visa",
    fileName: "visa.pdf",
    fileUrl: "https://example.com/visa.pdf",
  }

  it("accepts valid input", () => {
    const result = insertBookingDocumentSchema.parse(valid)
    expect(result.type).toBe("visa")
    expect(result.fileName).toBe("visa.pdf")
    expect(result.fileUrl).toBe("https://example.com/visa.pdf")
  })

  it("accepts valid document types", () => {
    for (const t of ["visa", "insurance", "health", "passport_copy", "other"]) {
      expect(insertBookingDocumentSchema.parse({ ...valid, type: t }).type).toBe(t)
    }
  })

  it("rejects invalid document type", () => {
    expect(() => insertBookingDocumentSchema.parse({ ...valid, type: "license" })).toThrow()
  })

  it("rejects invalid fileUrl", () => {
    expect(() => insertBookingDocumentSchema.parse({ ...valid, fileUrl: "not-a-url" })).toThrow()
  })

  it("rejects empty fileName", () => {
    expect(() => insertBookingDocumentSchema.parse({ ...valid, fileName: "" })).toThrow()
  })
})

describe("Booking list query schema", () => {
  it("applies default limit and offset", () => {
    const result = bookingListQuerySchema.parse({})
    expect(result.limit).toBe(50)
    expect(result.offset).toBe(0)
  })

  it("coerces string values", () => {
    const result = bookingListQuerySchema.parse({ limit: "25", offset: "10" })
    expect(result.limit).toBe(25)
    expect(result.offset).toBe(10)
  })

  it("rejects limit over 100", () => {
    expect(() => bookingListQuerySchema.parse({ limit: 101 })).toThrow()
  })

  it("rejects negative offset", () => {
    expect(() => bookingListQuerySchema.parse({ offset: -1 })).toThrow()
  })

  it("passes through optional filters", () => {
    const result = bookingListQuerySchema.parse({
      status: "confirmed",
      search: "hotel",
    })
    expect(result.status).toBe("confirmed")
    expect(result.search).toBe("hotel")
  })
})
