import { describe, expect, it } from "vitest"

import {
  convertProductSchema,
  createBookingSchema,
  insertBookingSchema,
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
    for (const status of [
      "draft",
      "on_hold",
      "confirmed",
      "in_progress",
      "completed",
      "expired",
      "cancelled",
    ]) {
      expect(insertBookingSchema.parse({ ...valid, status }).status).toBe(status)
    }
  })

  it("rejects invalid status", () => {
    expect(() => insertBookingSchema.parse({ ...valid, status: "pending" })).toThrow()
  })

  it("accepts valid sourceType overrides", () => {
    for (const sourceType of [
      "direct",
      "manual",
      "affiliate",
      "ota",
      "reseller",
      "api_partner",
      "internal",
    ]) {
      expect(insertBookingSchema.parse({ ...valid, sourceType }).sourceType).toBe(sourceType)
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
