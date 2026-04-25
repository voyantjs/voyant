---
"@voyantjs/bookings": minor
---

Auto-rollup booking total from `booking_items`. `bookingsService.recomputeBookingTotal(db, bookingId)` is now wired into `createItem` / `updateItem` / `deleteItem`, each wrapped in `db.transaction` so partial failures can never leave the parent total stale.

Also exposed publicly for ad-hoc invocation (saga compensation, fix-up scripts).

Base-currency totals (`baseSellAmountCents` / `baseCostAmountCents`) are NOT recomputed by this rollup — those are FX-derived and handled by the FX rollup added in the same release.
