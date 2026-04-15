import { describe, expect, it } from "vitest"

import { bootstrapCheckoutCollection, resolvePaymentSessionTarget } from "../../src/service.js"

describe("resolvePaymentSessionTarget", () => {
  it("always uses invoice collection for bank transfer", () => {
    expect(resolvePaymentSessionTarget("bank_transfer", "initial", undefined, {})).toBe("invoice")
    expect(resolvePaymentSessionTarget("bank_transfer", "reminder", "schedule", {})).toBe("invoice")
  })

  it("uses stage-aware defaults for card collection", () => {
    expect(resolvePaymentSessionTarget("card", "initial", undefined, {})).toBe("schedule")
    expect(
      resolvePaymentSessionTarget("card", "reminder", undefined, {
        defaultReminderCardCollectionTarget: "invoice",
      }),
    ).toBe("invoice")
  })

  it("honors explicit overrides", () => {
    expect(resolvePaymentSessionTarget("card", "initial", "invoice", {})).toBe("invoice")
    expect(resolvePaymentSessionTarget("card", "reminder", "schedule", {})).toBe("schedule")
  })
})

describe("bootstrapCheckoutCollection", () => {
  it("rejects mismatched booking and session ids", async () => {
    await expect(
      bootstrapCheckoutCollection(
        {} as never,
        {
          bookingId: "book_123",
          sessionId: "book_456",
          method: "card",
          stage: "manual",
        },
        {},
      ),
    ).rejects.toThrow("bookingId and sessionId must refer to the same booking session")
  })
})
