import { describe, expect, it } from "vitest"

import type { CancellationRule } from "../../src/policies/service.js"
import { evaluateSegmentedCancellation } from "../../src/policies/service.js"

/**
 * Closes #310 — per-segment cancellation policy fan-out.
 *
 * Validates aggregate refund computation when a single booking has
 * multiple line items, each governed by a different cancellation
 * policy.
 */

function flexible(): CancellationRule[] {
  return [
    {
      daysBeforeDeparture: 30,
      refundPercent: 10000,
      refundType: "cash",
      flatAmountCents: null,
      label: "30+",
    },
    {
      daysBeforeDeparture: 7,
      refundPercent: 5000,
      refundType: "cash",
      flatAmountCents: null,
      label: "7-29",
    },
    {
      daysBeforeDeparture: 0,
      refundPercent: 0,
      refundType: "none",
      flatAmountCents: null,
      label: "<7",
    },
  ]
}

function nonRefundable(): CancellationRule[] {
  return [
    {
      daysBeforeDeparture: 0,
      refundPercent: 0,
      refundType: "none",
      flatAmountCents: null,
      label: "Always 0",
    },
  ]
}

function creditOnly(): CancellationRule[] {
  return [
    {
      daysBeforeDeparture: 14,
      refundPercent: 8000,
      refundType: "credit",
      flatAmountCents: null,
      label: "14+",
    },
    {
      daysBeforeDeparture: 0,
      refundPercent: 0,
      refundType: "none",
      flatAmountCents: null,
      label: "<14",
    },
  ]
}

describe("evaluateSegmentedCancellation", () => {
  it("returns zero refund when there are no segments", () => {
    const result = evaluateSegmentedCancellation({
      daysBeforeDeparture: 30,
      segments: [],
    })
    expect(result).toEqual({
      totalCents: 0,
      refundCents: 0,
      refundPercent: 0,
      refundType: "none",
      segments: [],
    })
  })

  it("aggregates a single fully-refundable segment cleanly", async () => {
    const result = evaluateSegmentedCancellation({
      daysBeforeDeparture: 60,
      segments: [{ id: "bkit_1", rules: flexible(), totalCents: 50000 }],
    })
    expect(result.totalCents).toBe(50000)
    expect(result.refundCents).toBe(50000)
    expect(result.refundPercent).toBe(10000)
    expect(result.refundType).toBe("cash")
    expect(result.segments).toHaveLength(1)
    expect(result.segments[0]?.result.refundCents).toBe(50000)
  })

  it("mixed flexible + non-refundable: full refund on the flexible portion only", async () => {
    const result = evaluateSegmentedCancellation({
      daysBeforeDeparture: 60,
      segments: [
        { id: "bkit_deluxe", label: "Deluxe", rules: flexible(), totalCents: 60000 },
        { id: "bkit_suite", label: "Suite", rules: nonRefundable(), totalCents: 100000 },
      ],
    })
    // Σ totals = 160000. Flexible refunds 60000 (100%), non-refundable 0.
    expect(result.totalCents).toBe(160000)
    expect(result.refundCents).toBe(60000)
    // Aggregate basis-points: 60000/160000 = 37.5% → 3750 bp
    expect(result.refundPercent).toBe(3750)
    // Only the flexible segment refunded (cash); non-refundable contributed 0.
    expect(result.refundType).toBe("cash")
    expect(result.segments[0]?.result.refundCents).toBe(60000)
    expect(result.segments[1]?.result.refundCents).toBe(0)
  })

  it("multi-type non-zero refunds resolve to refundType: 'mixed'", async () => {
    const result = evaluateSegmentedCancellation({
      daysBeforeDeparture: 60,
      segments: [
        { id: "a", rules: flexible(), totalCents: 50000 },
        { id: "b", rules: creditOnly(), totalCents: 30000 },
      ],
    })
    // Both segments produce a non-zero refund — one cash, one credit.
    expect(result.refundCents).toBe(50000 + Math.floor((30000 * 8000) / 10000))
    expect(result.refundType).toBe("mixed")
  })

  it("all segments at zero refund: refundType is 'none'", async () => {
    const result = evaluateSegmentedCancellation({
      daysBeforeDeparture: 60,
      segments: [
        { id: "a", rules: nonRefundable(), totalCents: 50000 },
        { id: "b", rules: nonRefundable(), totalCents: 30000 },
      ],
    })
    expect(result.refundCents).toBe(0)
    expect(result.refundPercent).toBe(0)
    expect(result.refundType).toBe("none")
  })

  it("close-to-departure: flexible rule kicks in at the lower tier", async () => {
    const result = evaluateSegmentedCancellation({
      daysBeforeDeparture: 10,
      segments: [{ id: "a", rules: flexible(), totalCents: 100000 }],
    })
    // 10 days out → matches the 7-29 day tier at 50%
    expect(result.refundCents).toBe(50000)
    expect(result.refundPercent).toBe(5000)
  })

  it("preserves per-segment id and label so callers can render breakdowns", async () => {
    const result = evaluateSegmentedCancellation({
      daysBeforeDeparture: 60,
      segments: [
        { id: "bkit_1", label: "Deluxe room", rules: flexible(), totalCents: 50000 },
        { id: "bkit_2", label: "Suite", rules: nonRefundable(), totalCents: 30000 },
      ],
    })
    expect(result.segments[0]?.id).toBe("bkit_1")
    expect(result.segments[0]?.label).toBe("Deluxe room")
    expect(result.segments[1]?.id).toBe("bkit_2")
    expect(result.segments[1]?.label).toBe("Suite")
  })

  it("refundPercent is 0 when totalCents is 0 (defensive against zero-amount segments)", async () => {
    const result = evaluateSegmentedCancellation({
      daysBeforeDeparture: 30,
      segments: [{ id: "a", rules: flexible(), totalCents: 0 }],
    })
    expect(result.totalCents).toBe(0)
    expect(result.refundPercent).toBe(0)
  })
})
