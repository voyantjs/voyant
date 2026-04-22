import { describe, expect, it } from "vitest"

import {
  buildRecentMonths,
  fillMonthlyCounts,
  groupCurrencyBreakdown,
  groupCurrencyTimeSeries,
  normalizeBookingStatusCounts,
} from "./dashboard-summary"

describe("dashboard summary helpers", () => {
  it("builds a stable recent month range ending in the current month", () => {
    expect(buildRecentMonths(new Date("2026-04-19T10:30:00Z"), 6)).toEqual([
      "2025-11",
      "2025-12",
      "2026-01",
      "2026-02",
      "2026-03",
      "2026-04",
    ])
  })

  it("fills missing booking statuses with zero counts", () => {
    expect(
      normalizeBookingStatusCounts([
        { status: "confirmed", count: 8 },
        { status: "cancelled", count: 2 },
      ]),
    ).toEqual([
      { status: "draft", count: 0 },
      { status: "on_hold", count: 0 },
      { status: "confirmed", count: 8 },
      { status: "in_progress", count: 0 },
      { status: "completed", count: 0 },
      { status: "expired", count: 0 },
      { status: "cancelled", count: 2 },
    ])
  })

  it("fills monthly counts across the requested month range", () => {
    expect(
      fillMonthlyCounts(
        ["2026-01", "2026-02", "2026-03"],
        [
          { month: "2026-01", count: 3 },
          { month: "2026-03", count: 9 },
        ],
      ),
    ).toEqual([
      { month: "2026-01", count: 3 },
      { month: "2026-02", count: 0 },
      { month: "2026-03", count: 9 },
    ])
  })

  it("sorts currency breakdowns by amount descending", () => {
    expect(
      groupCurrencyBreakdown([
        { currency: "EUR", totalCents: 25000, count: 2 },
        { currency: "USD", totalCents: 50000, count: 3 },
      ]),
    ).toEqual([
      { currency: "USD", totalCents: 50000, count: 3 },
      { currency: "EUR", totalCents: 25000, count: 2 },
    ])
  })

  it("groups time-series revenue per currency and fills missing months", () => {
    expect(
      groupCurrencyTimeSeries(
        ["2026-02", "2026-03", "2026-04"],
        [
          { currency: "EUR", month: "2026-02", totalCents: 15000, count: 1 },
          { currency: "EUR", month: "2026-04", totalCents: 30000, count: 2 },
          { currency: "USD", month: "2026-03", totalCents: 10000, count: 1 },
        ],
      ),
    ).toEqual([
      {
        currency: "EUR",
        totalCents: 45000,
        invoiceCount: 3,
        points: [
          { month: "2026-02", totalCents: 15000, count: 1 },
          { month: "2026-03", totalCents: 0, count: 0 },
          { month: "2026-04", totalCents: 30000, count: 2 },
        ],
      },
      {
        currency: "USD",
        totalCents: 10000,
        invoiceCount: 1,
        points: [
          { month: "2026-02", totalCents: 0, count: 0 },
          { month: "2026-03", totalCents: 10000, count: 1 },
          { month: "2026-04", totalCents: 0, count: 0 },
        ],
      },
    ])
  })
})
