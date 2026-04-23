import { describe, expect, it } from "vitest"

import {
  insertVoucherSchema,
  redeemVoucherSchema,
  updateVoucherSchema,
  voucherListQuerySchema,
} from "../../src/validation-vouchers.js"

describe("insertVoucherSchema", () => {
  const valid = {
    currency: "EUR",
    amountCents: 5000,
    sourceType: "refund" as const,
  }

  it("accepts the minimum set", () => {
    const result = insertVoucherSchema.parse(valid)
    expect(result.currency).toBe("EUR")
    expect(result.amountCents).toBe(5000)
    expect(result.sourceType).toBe("refund")
  })

  it("requires currency, amountCents, sourceType", () => {
    expect(() => insertVoucherSchema.parse({})).toThrow()
    expect(() => insertVoucherSchema.parse({ ...valid, currency: "EU" })).toThrow()
    expect(() => insertVoucherSchema.parse({ ...valid, amountCents: 0 })).toThrow()
    expect(() => insertVoucherSchema.parse({ ...valid, amountCents: -1 })).toThrow()
    expect(() => insertVoucherSchema.parse({ ...valid, sourceType: "bogus" })).toThrow()
  })

  it("accepts optional fields", () => {
    const result = insertVoucherSchema.parse({
      ...valid,
      code: "GIFT-123",
      issuedToPersonId: "pers_abc",
      sourceBookingId: "book_abc",
      expiresAt: "2026-12-31T23:59:59.000Z",
      notes: "Goodwill credit",
    })
    expect(result.code).toBe("GIFT-123")
    expect(result.issuedToPersonId).toBe("pers_abc")
  })

  it("rejects non-datetime expiresAt", () => {
    expect(() => insertVoucherSchema.parse({ ...valid, expiresAt: "2026-12-31" })).toThrow()
  })
})

describe("updateVoucherSchema", () => {
  it("accepts partial updates", () => {
    expect(updateVoucherSchema.parse({}).status).toBeUndefined()
    expect(updateVoucherSchema.parse({ status: "void" }).status).toBe("void")
  })

  it("rejects unknown status", () => {
    expect(() => updateVoucherSchema.parse({ status: "active-ish" })).toThrow()
  })

  it("does not accept a balance override", () => {
    // remainingAmountCents is only mutated via `redeem` — the update schema
    // ignores unknown keys, so the field just drops out rather than mutating
    // the voucher. Guarantee that in the parsed result.
    const result = updateVoucherSchema.parse({ remainingAmountCents: 0 }) as Record<string, unknown>
    expect(result.remainingAmountCents).toBeUndefined()
  })
})

describe("redeemVoucherSchema", () => {
  it("requires bookingId + positive amountCents", () => {
    expect(() => redeemVoucherSchema.parse({})).toThrow()
    expect(() => redeemVoucherSchema.parse({ bookingId: "book_1" })).toThrow()
    expect(() => redeemVoucherSchema.parse({ bookingId: "book_1", amountCents: 0 })).toThrow()
    expect(() => redeemVoucherSchema.parse({ bookingId: "book_1", amountCents: -10 })).toThrow()
  })

  it("accepts optional paymentId", () => {
    const result = redeemVoucherSchema.parse({
      bookingId: "book_1",
      amountCents: 1500,
      paymentId: "pay_abc",
    })
    expect(result.paymentId).toBe("pay_abc")
  })
})

describe("voucherListQuerySchema", () => {
  it("applies default limit and offset", () => {
    const result = voucherListQuerySchema.parse({})
    expect(result.limit).toBe(50)
    expect(result.offset).toBe(0)
  })

  it("coerces hasBalance", () => {
    expect(voucherListQuerySchema.parse({ hasBalance: "true" }).hasBalance).toBe(true)
  })

  it("rejects unknown status", () => {
    expect(() => voucherListQuerySchema.parse({ status: "nope" })).toThrow()
  })
})
