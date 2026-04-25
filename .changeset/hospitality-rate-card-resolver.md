---
"@voyantjs/hospitality": minor
---

Add `hospitalityService.resolveStayDailyRates(db, input)` — produces the per-night rate-card array `reserveStay`'s `dailyRates` parameter expects.

Resolution rules:

1. Base rate from `room_type_rates.baseAmountCents` for the (ratePlanId, roomTypeId) pair.
2. `rate_plan_inventory_overrides` consulted for restrictions only:
   - `stop_sell` on any night → typed `stop_sell` failure.
   - `closed_to_arrival` on the first night → `closed_to_arrival`.
   - `closed_to_departure` on the last night before checkout → `closed_to_departure`.
3. Currency from `room_type_rates.currencyCode`.

Date-scoped rate variation (weekend bumps, seasonal pricing) is layered on top in the same release via `priceScheduleId` — see the date-scoped-rate-variation changeset.
