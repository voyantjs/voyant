import { describe, expect, it, vi } from "vitest"

import { publicFinanceService } from "../../src/service-public.js"

describe("publicFinanceService.validateVoucher — new vouchers table path", () => {
  function makeDb(options: {
    voucherRow?: Record<string, unknown> | null
    paymentInstrumentRow?: Record<string, unknown> | null
  }) {
    // Minimal drizzle chain stub: each builder call returns an object with
    // the next-step method, resolving to an array the service destructures.
    let selectCall = 0
    return {
      select: vi.fn(() => ({
        from: vi.fn(() => {
          const row = selectCall++ === 0 ? options.voucherRow : options.paymentInstrumentRow
          return {
            where: vi.fn(() => ({
              limit: vi.fn(async () => (row ? [row] : [])),
              orderBy: vi.fn(() => ({
                limit: vi.fn(async () => (row ? [row] : [])),
              })),
            })),
          }
        }),
      })),
    }
  }

  it("returns valid when a matching row exists in the new vouchers table", async () => {
    const db = makeDb({
      voucherRow: {
        id: "vch_abc",
        code: "GIFT-123",
        status: "active",
        currency: "EUR",
        initialAmountCents: 5000,
        remainingAmountCents: 3000,
        expiresAt: null,
        sourceBookingId: null,
      },
    })

    const result = await publicFinanceService.validateVoucher(db as never, {
      code: "GIFT-123",
    })

    expect(result.valid).toBe(true)
    expect(result.voucher).toMatchObject({
      id: "vch_abc",
      code: "GIFT-123",
      currency: "EUR",
      amountCents: 5000,
      remainingAmountCents: 3000,
    })
  })

  it("matches case-insensitively so operators can paste the code as-typed", async () => {
    const db = makeDb({
      voucherRow: {
        id: "vch_abc",
        code: "gift-abc",
        status: "active",
        currency: "EUR",
        initialAmountCents: 1000,
        remainingAmountCents: 1000,
        expiresAt: null,
        sourceBookingId: null,
      },
    })

    const result = await publicFinanceService.validateVoucher(db as never, {
      code: "  GIFT-ABC  ",
    })

    expect(result.valid).toBe(true)
    expect(result.voucher?.id).toBe("vch_abc")
  })

  it("returns inactive when status is not active", async () => {
    const db = makeDb({
      voucherRow: {
        id: "vch_abc",
        code: "GIFT-123",
        status: "redeemed",
        currency: "EUR",
        initialAmountCents: 5000,
        remainingAmountCents: 0,
        expiresAt: null,
        sourceBookingId: null,
      },
    })

    const result = await publicFinanceService.validateVoucher(db as never, {
      code: "GIFT-123",
    })

    expect(result.valid).toBe(false)
    expect(result.reason).toBe("inactive")
  })

  it("returns expired when the expiresAt is in the past", async () => {
    const db = makeDb({
      voucherRow: {
        id: "vch_abc",
        code: "GIFT-123",
        status: "active",
        currency: "EUR",
        initialAmountCents: 5000,
        remainingAmountCents: 3000,
        expiresAt: new Date("2020-01-01"),
        sourceBookingId: null,
      },
    })

    const result = await publicFinanceService.validateVoucher(db as never, {
      code: "GIFT-123",
    })

    expect(result.valid).toBe(false)
    expect(result.reason).toBe("expired")
  })

  it("returns insufficient_balance when the requested amount exceeds remaining", async () => {
    const db = makeDb({
      voucherRow: {
        id: "vch_abc",
        code: "GIFT-123",
        status: "active",
        currency: "EUR",
        initialAmountCents: 5000,
        remainingAmountCents: 3000,
        expiresAt: null,
        sourceBookingId: null,
      },
    })

    const result = await publicFinanceService.validateVoucher(db as never, {
      code: "GIFT-123",
      amountCents: 5000,
    })

    expect(result.valid).toBe(false)
    expect(result.reason).toBe("insufficient_balance")
  })

  it("returns booking_mismatch when a sourceBookingId pins the voucher to a different booking", async () => {
    const db = makeDb({
      voucherRow: {
        id: "vch_abc",
        code: "GIFT-123",
        status: "active",
        currency: "EUR",
        initialAmountCents: 5000,
        remainingAmountCents: 5000,
        expiresAt: null,
        sourceBookingId: "book_other",
      },
    })

    const result = await publicFinanceService.validateVoucher(db as never, {
      code: "GIFT-123",
      bookingId: "book_abc",
    })

    expect(result.valid).toBe(false)
    expect(result.reason).toBe("booking_mismatch")
  })

  it("falls back to the legacy payment_instruments path when no new-table row exists", async () => {
    const db = makeDb({
      voucherRow: null,
      paymentInstrumentRow: {
        id: "pmin_legacy",
        status: "active",
        externalToken: "LEGACY-42",
        directBillReference: null,
        label: "Legacy voucher",
        provider: null,
        metadata: {
          code: "LEGACY-42",
          currency: "EUR",
          amountCents: 2000,
          remainingAmountCents: 2000,
        },
      },
    })

    const result = await publicFinanceService.validateVoucher(db as never, {
      code: "LEGACY-42",
    })

    expect(result.valid).toBe(true)
    expect(result.voucher?.id).toBe("pmin_legacy")
    expect(result.voucher?.remainingAmountCents).toBe(2000)
  })

  it("returns not_found when neither table has a match", async () => {
    const db = makeDb({ voucherRow: null, paymentInstrumentRow: null })

    const result = await publicFinanceService.validateVoucher(db as never, {
      code: "NOPE",
    })

    expect(result.valid).toBe(false)
    expect(result.reason).toBe("not_found")
    expect(result.voucher).toBeNull()
  })
})
