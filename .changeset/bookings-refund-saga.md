---
"@voyantjs/bookings": minor
---

Add `refundBooking` saga — atomic credit-note + hold-release + supplier-reverse + notify, built on the existing `createWorkflow` primitive.

Side-effect dependencies are injected (no compile-time pull on finance / transactions / notifications) so the package stays slim; templates wire the deps.

Step graph with reverse-order compensation:

1. `validate-state` — refundable only when `confirmed`, `in_progress`, or `on_hold`. Rejects partial amounts outside `[0, sellAmountCents]`.
2. `create-credit-note` — short-circuits when `refundAmount === 0`. Compensation: void.
3. `release-inventory` — releases held + confirmed allocations, restores slot capacity. Compensation: re-decrement (loud failure if re-sold, intentional).
4. `reverse-supplier-offer` — best-effort.
5. `transition-booking` → `cancelled` via `transitionBooking()` (state-machine guard).
6. `notify-customer` — fire-and-forget.

Exports `refundBooking(input, deps)` and `buildRefundBookingWorkflow(deps)` for callers that want to inspect the workflow definition or run it via a JobRunner.
