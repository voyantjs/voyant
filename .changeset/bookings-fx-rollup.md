---
"@voyantjs/bookings": minor
---

FX rollup for `base_*_amount_cents` on item mutations. `bookingsService.recomputeBookingTotal` now re-derives `baseSellAmountCents` / `baseCostAmountCents` from per-item totals when the booking declares a `baseCurrency` and `fxRateSetId`.

Schema: `bookings.fx_rate_set_id` (text, nullable) — plain text per the cross-domain FK rule (reference into the markets package).

FX behaviour:

- **Single-currency** (`baseCurrency` null OR every item's `sellCurrency === baseCurrency`): conversion is a no-op, `base*Cents` track `sell*Cents` 1:1. `fxStatus: "ok"`.
- **Multi-currency with valid FX**: each item converted via `exchange_rates` (direct rate or `inverse_rate_decimal` if direct row missing), summed. `fxStatus: "ok"`.
- **Missing rate**: short-circuits with `fxStatus: "missing_rate"`; `base*Cents` left unchanged on the parent. Caller decides.
- **No `fxRateSetId` configured**: skipped, `fxStatus: "skipped"`, `base*Cents` stay null.
