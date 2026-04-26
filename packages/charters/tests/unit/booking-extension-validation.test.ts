import { describe, expect, it } from "vitest"

import { charterDetailUpsertSchema } from "../../src/booking-extension.js"

const validPerSuite = {
  bookingMode: "per_suite" as const,
  source: "local" as const,
  voyageId: "chrv_abc",
  suiteId: "chst_def",
  yachtId: "chry_xyz",
  guestCount: 2,
  quotedCurrency: "USD",
  quotedSuitePrice: "100000.00",
  quotedTotal: "100000.00",
}

const validWholeYacht = {
  bookingMode: "whole_yacht" as const,
  source: "local" as const,
  voyageId: "chrv_abc",
  yachtId: "chry_xyz",
  guestCount: 8,
  quotedCurrency: "EUR",
  quotedCharterFee: "5000000.00",
  apaPercent: "30.00",
  apaAmount: "1500000.00",
  quotedTotal: "6500000.00",
  mybaTemplateIdSnapshot: "ctpl_default",
}

describe("charterDetailUpsertSchema — local provenance rules", () => {
  it("accepts a complete per_suite payload", () => {
    expect(() => charterDetailUpsertSchema.parse(validPerSuite)).not.toThrow()
  })

  it("rejects local per_suite without voyageId", () => {
    expect(() => charterDetailUpsertSchema.parse({ ...validPerSuite, voyageId: null })).toThrow(
      /voyageId/,
    )
  })

  it("rejects local per_suite without suiteId", () => {
    expect(() => charterDetailUpsertSchema.parse({ ...validPerSuite, suiteId: null })).toThrow(
      /suiteId/,
    )
  })

  it("rejects per_suite without quotedSuitePrice", () => {
    expect(() =>
      charterDetailUpsertSchema.parse({ ...validPerSuite, quotedSuitePrice: null }),
    ).toThrow(/quotedSuitePrice/)
  })

  it("accepts a complete whole_yacht payload", () => {
    expect(() => charterDetailUpsertSchema.parse(validWholeYacht)).not.toThrow()
  })

  it("rejects whole_yacht without charter fee", () => {
    expect(() =>
      charterDetailUpsertSchema.parse({ ...validWholeYacht, quotedCharterFee: null }),
    ).toThrow(/quotedCharterFee/)
  })

  it("rejects whole_yacht without APA percent + amount", () => {
    expect(() => charterDetailUpsertSchema.parse({ ...validWholeYacht, apaPercent: null })).toThrow(
      /apaPercent/,
    )
    expect(() => charterDetailUpsertSchema.parse({ ...validWholeYacht, apaAmount: null })).toThrow(
      /apaPercent/,
    )
  })
})

describe("charterDetailUpsertSchema — external provenance rules", () => {
  it("accepts external per_suite with provider + sourceRef", () => {
    const external = {
      bookingMode: "per_suite" as const,
      source: "external" as const,
      sourceProvider: "voyant-connect",
      sourceRef: { externalId: "ext-suite-1" },
      yachtId: null,
      voyageId: null,
      suiteId: null,
      guestCount: 4,
      quotedCurrency: "GBP",
      quotedSuitePrice: "75000.00",
      quotedTotal: "75000.00",
    }
    expect(() => charterDetailUpsertSchema.parse(external)).not.toThrow()
  })

  it("rejects external without sourceProvider", () => {
    expect(() =>
      charterDetailUpsertSchema.parse({
        bookingMode: "per_suite",
        source: "external",
        sourceRef: { externalId: "x" },
        guestCount: 1,
        quotedCurrency: "USD",
        quotedSuitePrice: "100.00",
        quotedTotal: "100.00",
      }),
    ).toThrow(/sourceProvider/)
  })

  it("rejects external without sourceRef", () => {
    expect(() =>
      charterDetailUpsertSchema.parse({
        bookingMode: "per_suite",
        source: "external",
        sourceProvider: "voyant-connect",
        guestCount: 1,
        quotedCurrency: "USD",
        quotedSuitePrice: "100.00",
        quotedTotal: "100.00",
      }),
    ).toThrow(/sourceRef/)
  })
})

describe("charterDetailUpsertSchema — money string format", () => {
  it("rejects non-decimal money strings", () => {
    expect(() =>
      charterDetailUpsertSchema.parse({ ...validPerSuite, quotedTotal: "one hundred" }),
    ).toThrow()
  })
})
