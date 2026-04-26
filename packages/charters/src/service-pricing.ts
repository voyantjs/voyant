import { and, asc, eq, sql } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"

import { type CharterVoyage, charterProducts, charterVoyages } from "./schema-core.js"
import { type CharterSuite, charterSuites } from "./schema-pricing.js"
import { FIRST_CLASS_CURRENCIES, type FirstClassCurrency } from "./validation-shared.js"

// ---------- money helpers ----------
// All math is performed in integer cents to avoid float drift.
// Same approach the cruises module uses.

const CENTS_PER_UNIT = 100n

function decimalStringToCents(s: string): bigint {
  const trimmed = s.trim()
  if (!/^-?\d+(\.\d{1,2})?$/.test(trimmed)) {
    throw new Error(`Invalid money string: ${s}`)
  }
  const negative = trimmed.startsWith("-")
  const abs = negative ? trimmed.slice(1) : trimmed
  const parts = abs.split(".")
  const whole = parts[0] ?? "0"
  const frac = parts[1] ?? ""
  const fracPadded = `${frac}00`.slice(0, 2)
  const cents = BigInt(whole) * CENTS_PER_UNIT + BigInt(fracPadded)
  return negative ? -cents : cents
}

function centsToDecimalString(c: bigint): string {
  const negative = c < 0n
  const abs = negative ? -c : c
  const whole = abs / CENTS_PER_UNIT
  const frac = abs % CENTS_PER_UNIT
  const fracStr = frac.toString().padStart(2, "0")
  return `${negative ? "-" : ""}${whole.toString()}.${fracStr}`
}

function percentOf(cents: bigint, percentString: string): bigint {
  const trimmed = percentString.trim()
  if (!/^-?\d+(\.\d{1,2})?$/.test(trimmed)) {
    throw new Error(`Invalid percent string: ${percentString}`)
  }
  const parts = trimmed.split(".")
  const whole = parts[0] ?? "0"
  const frac = parts[1] ?? ""
  const fracPadded = `${frac}00`.slice(0, 2)
  // percent * 100 → integer basis points; multiply cents, divide by 10000
  const basisPoints = BigInt(whole) * 100n + BigInt(fracPadded)
  return (cents * basisPoints) / 10_000n
}

// ---------- currency resolution (pure) ----------

type WithSuitePriceFields = {
  priceUSD: string | null
  priceEUR: string | null
  priceGBP: string | null
  priceAUD: string | null
}
type WithSuitePortFeeFields = {
  portFeeUSD: string | null
  portFeeEUR: string | null
  portFeeGBP: string | null
  portFeeAUD: string | null
}
type WithVoyageWholePriceFields = {
  wholeYachtPriceUSD: string | null
  wholeYachtPriceEUR: string | null
  wholeYachtPriceGBP: string | null
  wholeYachtPriceAUD: string | null
}

function suitePriceForCurrency(
  row: WithSuitePriceFields,
  currency: FirstClassCurrency,
): string | null {
  switch (currency) {
    case "USD":
      return row.priceUSD ?? null
    case "EUR":
      return row.priceEUR ?? null
    case "GBP":
      return row.priceGBP ?? null
    case "AUD":
      return row.priceAUD ?? null
  }
}
function suitePortFeeForCurrency(
  row: WithSuitePortFeeFields,
  currency: FirstClassCurrency,
): string | null {
  switch (currency) {
    case "USD":
      return row.portFeeUSD ?? null
    case "EUR":
      return row.portFeeEUR ?? null
    case "GBP":
      return row.portFeeGBP ?? null
    case "AUD":
      return row.portFeeAUD ?? null
  }
}
function voyageWholePriceForCurrency(
  row: WithVoyageWholePriceFields,
  currency: FirstClassCurrency,
): string | null {
  switch (currency) {
    case "USD":
      return row.wholeYachtPriceUSD ?? null
    case "EUR":
      return row.wholeYachtPriceEUR ?? null
    case "GBP":
      return row.wholeYachtPriceGBP ?? null
    case "AUD":
      return row.wholeYachtPriceAUD ?? null
  }
}

function listSuitePriceCurrencies(row: WithSuitePriceFields): FirstClassCurrency[] {
  return FIRST_CLASS_CURRENCIES.filter((c) => suitePriceForCurrency(row, c) !== null)
}
function listVoyageWholePriceCurrencies(row: WithVoyageWholePriceFields): FirstClassCurrency[] {
  return FIRST_CLASS_CURRENCIES.filter((c) => voyageWholePriceForCurrency(row, c) !== null)
}

// ---------- per-suite quote (pure function) ----------

export type PerSuiteQuote = {
  mode: "per_suite"
  voyageId: string
  suiteId: string
  suiteName: string
  currency: FirstClassCurrency
  suitePrice: string
  portFee: string | null
  total: string
}

export type ComposePerSuiteQuoteInput = {
  voyageId: string
  suite: Pick<
    CharterSuite,
    | "id"
    | "suiteName"
    | "priceUSD"
    | "priceEUR"
    | "priceGBP"
    | "priceAUD"
    | "portFeeUSD"
    | "portFeeEUR"
    | "portFeeGBP"
    | "portFeeAUD"
  >
  currency: FirstClassCurrency
}

export function composePerSuiteQuote(input: ComposePerSuiteQuoteInput): PerSuiteQuote {
  const suitePrice = suitePriceForCurrency(input.suite, input.currency)
  if (!suitePrice) {
    throw new Error(
      `Suite ${input.suite.id} has no published price in ${input.currency}; available currencies: ${listSuitePriceCurrencies(input.suite).join(", ") || "none"}`,
    )
  }
  const portFee = suitePortFeeForCurrency(input.suite, input.currency)
  const suiteCents = decimalStringToCents(suitePrice)
  const portFeeCents = portFee ? decimalStringToCents(portFee) : 0n
  const totalCents = suiteCents + portFeeCents
  return {
    mode: "per_suite",
    voyageId: input.voyageId,
    suiteId: input.suite.id,
    suiteName: input.suite.suiteName,
    currency: input.currency,
    suitePrice: centsToDecimalString(suiteCents),
    portFee: portFee ? centsToDecimalString(portFeeCents) : null,
    total: centsToDecimalString(totalCents),
  }
}

// ---------- whole-yacht quote (pure function) ----------

export type WholeYachtQuote = {
  mode: "whole_yacht"
  voyageId: string
  currency: FirstClassCurrency
  charterFee: string
  apaPercent: string
  apaAmount: string
  total: string
  /**
   * APA is collected before the charter and reconciled after. The "total" here
   * is what the charterer commits to up front (charter fee + APA). True final
   * cost only known post-charter.
   */
}

export type ComposeWholeYachtQuoteInput = {
  voyage: Pick<
    CharterVoyage,
    | "id"
    | "wholeYachtPriceUSD"
    | "wholeYachtPriceEUR"
    | "wholeYachtPriceGBP"
    | "wholeYachtPriceAUD"
    | "apaPercentOverride"
  >
  /**
   * The product's defaultApaPercent — passed in by the caller so this stays
   * a pure function. Voyage-level override takes precedence.
   */
  productDefaultApaPercent: string | null
  currency: FirstClassCurrency
}

export function composeWholeYachtQuote(input: ComposeWholeYachtQuoteInput): WholeYachtQuote {
  const charterFee = voyageWholePriceForCurrency(input.voyage, input.currency)
  if (!charterFee) {
    throw new Error(
      `Voyage ${input.voyage.id} has no published whole-yacht price in ${input.currency}; available currencies: ${listVoyageWholePriceCurrencies(input.voyage).join(", ") || "none"}`,
    )
  }
  const apaPercent = input.voyage.apaPercentOverride ?? input.productDefaultApaPercent
  if (!apaPercent) {
    throw new Error(
      `Voyage ${input.voyage.id} has no APA percent set (neither voyage override nor product default). Whole-yacht charters require an APA.`,
    )
  }

  const charterFeeCents = decimalStringToCents(charterFee)
  const apaAmountCents = percentOf(charterFeeCents, apaPercent)
  const totalCents = charterFeeCents + apaAmountCents

  return {
    mode: "whole_yacht",
    voyageId: input.voyage.id,
    currency: input.currency,
    charterFee: centsToDecimalString(charterFeeCents),
    apaPercent,
    apaAmount: centsToDecimalString(apaAmountCents),
    total: centsToDecimalString(totalCents),
  }
}

// ---------- standalone APA helper ----------

/**
 * Compute APA amount from a charter fee and a percent. Useful for finance-side
 * recalculation without needing to re-quote the whole voyage.
 */
export function computeApaAmount(charterFee: string, apaPercent: string): string {
  const cents = percentOf(decimalStringToCents(charterFee), apaPercent)
  return centsToDecimalString(cents)
}

// ---------- DB-bound service ----------

export const pricingService = {
  async quotePerSuite(
    db: PostgresJsDatabase,
    args: { suiteId: string; currency: FirstClassCurrency },
  ): Promise<PerSuiteQuote> {
    const [suite] = await db
      .select()
      .from(charterSuites)
      .where(eq(charterSuites.id, args.suiteId))
      .limit(1)
    if (!suite) throw new Error(`Charter suite ${args.suiteId} not found`)
    return composePerSuiteQuote({
      voyageId: suite.voyageId,
      suite,
      currency: args.currency,
    })
  },

  async quoteWholeYacht(
    db: PostgresJsDatabase,
    args: { voyageId: string; currency: FirstClassCurrency },
  ): Promise<WholeYachtQuote> {
    const [voyage] = await db
      .select()
      .from(charterVoyages)
      .where(eq(charterVoyages.id, args.voyageId))
      .limit(1)
    if (!voyage) throw new Error(`Charter voyage ${args.voyageId} not found`)

    const [product] = await db
      .select({ defaultApaPercent: charterProducts.defaultApaPercent })
      .from(charterProducts)
      .where(eq(charterProducts.id, voyage.productId))
      .limit(1)

    return composeWholeYachtQuote({
      voyage,
      productDefaultApaPercent: product?.defaultApaPercent ?? null,
      currency: args.currency,
    })
  },

  async lowestSuitePriceUSD(
    db: PostgresJsDatabase,
    voyageId: string,
  ): Promise<{ suiteId: string; price: string } | null> {
    const [row] = await db
      .select({ suiteId: charterSuites.id, price: charterSuites.priceUSD })
      .from(charterSuites)
      .where(
        and(
          eq(charterSuites.voyageId, voyageId),
          sql`${charterSuites.availability} <> 'sold_out'`,
          sql`${charterSuites.priceUSD} IS NOT NULL`,
        ),
      )
      .orderBy(asc(sql`${charterSuites.priceUSD}::numeric`))
      .limit(1)
    if (!row?.price) return null
    return { suiteId: row.suiteId, price: row.price }
  },
}

// Re-export for callers
export { FIRST_CLASS_CURRENCIES, type FirstClassCurrency } from "./validation-shared.js"
