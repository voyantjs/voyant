import { describe, expect, it } from "vitest"

import {
  composePerSuiteQuote,
  composeWholeYachtQuote,
  computeApaAmount,
} from "../../src/service-pricing.js"

const makeSuite = (
  overrides: Partial<Parameters<typeof composePerSuiteQuote>[0]["suite"]> = {},
) => ({
  id: "chst_test_suite",
  suiteName: "Owners Suite",
  priceUSD: "125000.00",
  priceEUR: "115000.00",
  priceGBP: "95000.00",
  priceAUD: "190000.00",
  portFeeUSD: null,
  portFeeEUR: null,
  portFeeGBP: null,
  portFeeAUD: null,
  ...overrides,
})

const makeVoyage = (
  overrides: Partial<Parameters<typeof composeWholeYachtQuote>[0]["voyage"]> = {},
) => ({
  id: "chrv_test_voyage",
  wholeYachtPriceUSD: "5000000.00",
  wholeYachtPriceEUR: "4500000.00",
  wholeYachtPriceGBP: "3800000.00",
  wholeYachtPriceAUD: "7600000.00",
  apaPercentOverride: null as string | null,
  ...overrides,
})

describe("composePerSuiteQuote", () => {
  it("returns the price in the requested currency", () => {
    const quote = composePerSuiteQuote({
      voyageId: "chrv_test_voyage",
      suite: makeSuite(),
      currency: "USD",
    })
    expect(quote.mode).toBe("per_suite")
    expect(quote.currency).toBe("USD")
    expect(quote.suitePrice).toBe("125000.00")
    expect(quote.total).toBe("125000.00")
    expect(quote.portFee).toBeNull()
  })

  it("adds port fee when present in the same currency", () => {
    const quote = composePerSuiteQuote({
      voyageId: "chrv_test_voyage",
      suite: makeSuite({ portFeeUSD: "1500.00" }),
      currency: "USD",
    })
    expect(quote.portFee).toBe("1500.00")
    expect(quote.total).toBe("126500.00")
  })

  it("works in GBP and EUR", () => {
    const usd = composePerSuiteQuote({
      voyageId: "chrv_test_voyage",
      suite: makeSuite(),
      currency: "USD",
    })
    const gbp = composePerSuiteQuote({
      voyageId: "chrv_test_voyage",
      suite: makeSuite(),
      currency: "GBP",
    })
    const eur = composePerSuiteQuote({
      voyageId: "chrv_test_voyage",
      suite: makeSuite(),
      currency: "EUR",
    })
    expect(usd.total).toBe("125000.00")
    expect(gbp.total).toBe("95000.00")
    expect(eur.total).toBe("115000.00")
  })

  it("throws when the requested currency is missing", () => {
    expect(() =>
      composePerSuiteQuote({
        voyageId: "chrv_test_voyage",
        suite: makeSuite({ priceUSD: null }),
        currency: "USD",
      }),
    ).toThrow(/no published price in USD.*EUR, GBP, AUD/)
  })

  it("lists 'none' when no currencies are published", () => {
    expect(() =>
      composePerSuiteQuote({
        voyageId: "chrv_test_voyage",
        suite: makeSuite({
          priceUSD: null,
          priceEUR: null,
          priceGBP: null,
          priceAUD: null,
        }),
        currency: "USD",
      }),
    ).toThrow(/available currencies: none/)
  })

  it("doesn't apply port fee when only the suite-price currency is missing", () => {
    // Asymmetry: priceUSD=null, portFeeUSD set → still throws on missing price
    expect(() =>
      composePerSuiteQuote({
        voyageId: "chrv_test_voyage",
        suite: makeSuite({ priceUSD: null, portFeeUSD: "1500.00" }),
        currency: "USD",
      }),
    ).toThrow()
  })
})

describe("composeWholeYachtQuote", () => {
  it("composes charter fee + APA + total when voyage has APA override", () => {
    const quote = composeWholeYachtQuote({
      voyage: makeVoyage({ apaPercentOverride: "30.00" }),
      productDefaultApaPercent: null,
      currency: "USD",
    })
    expect(quote.mode).toBe("whole_yacht")
    expect(quote.charterFee).toBe("5000000.00")
    expect(quote.apaPercent).toBe("30.00")
    expect(quote.apaAmount).toBe("1500000.00")
    expect(quote.total).toBe("6500000.00")
  })

  it("falls back to product default APA when voyage has no override", () => {
    const quote = composeWholeYachtQuote({
      voyage: makeVoyage(),
      productDefaultApaPercent: "27.50",
      currency: "USD",
    })
    expect(quote.apaPercent).toBe("27.50")
    expect(quote.apaAmount).toBe("1375000.00")
    expect(quote.total).toBe("6375000.00")
  })

  it("voyage override wins over product default", () => {
    const quote = composeWholeYachtQuote({
      voyage: makeVoyage({ apaPercentOverride: "20.00" }),
      productDefaultApaPercent: "30.00",
      currency: "USD",
    })
    expect(quote.apaPercent).toBe("20.00")
    expect(quote.apaAmount).toBe("1000000.00")
  })

  it("throws when no APA percent is set anywhere", () => {
    expect(() =>
      composeWholeYachtQuote({
        voyage: makeVoyage(),
        productDefaultApaPercent: null,
        currency: "USD",
      }),
    ).toThrow(/no APA percent set/)
  })

  it("throws when the requested currency is unpublished", () => {
    expect(() =>
      composeWholeYachtQuote({
        voyage: makeVoyage({ wholeYachtPriceUSD: null }),
        productDefaultApaPercent: "27.50",
        currency: "USD",
      }),
    ).toThrow(/no published whole-yacht price in USD/)
  })

  it("handles fractional APA percentages without float drift", () => {
    const quote = composeWholeYachtQuote({
      voyage: makeVoyage({ wholeYachtPriceUSD: "1234567.89" }),
      productDefaultApaPercent: "27.50",
      currency: "USD",
    })
    // 1234567.89 × 27.5% = 339,506.169... → 339506.16 with truncating BigInt math
    expect(quote.apaAmount).toBe("339506.16")
    // Total: 1234567.89 + 339506.16 = 1574074.05
    expect(quote.total).toBe("1574074.05")
  })

  it("works in non-USD currencies", () => {
    const eur = composeWholeYachtQuote({
      voyage: makeVoyage({ apaPercentOverride: "30.00" }),
      productDefaultApaPercent: null,
      currency: "EUR",
    })
    expect(eur.charterFee).toBe("4500000.00")
    expect(eur.apaAmount).toBe("1350000.00")
    expect(eur.total).toBe("5850000.00")
  })
})

describe("computeApaAmount", () => {
  it("computes APA amount from charter fee + percent", () => {
    expect(computeApaAmount("5000000.00", "27.50")).toBe("1375000.00")
  })

  it("handles small amounts correctly", () => {
    expect(computeApaAmount("100.00", "25.00")).toBe("25.00")
  })

  it("rejects malformed money strings", () => {
    expect(() => computeApaAmount("five thousand", "25.00")).toThrow(/Invalid money/)
  })

  it("rejects malformed percent strings", () => {
    expect(() => computeApaAmount("5000.00", "twenty-five percent")).toThrow(/Invalid percent/)
  })
})
