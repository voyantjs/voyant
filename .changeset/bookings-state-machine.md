---
"@voyantjs/bookings": minor
---

**BREAKING:** introduce explicit booking state machine with `transitionBooking()` guards.

Bookings now move through a typed state graph (`draft` → `on_hold` → `confirmed` → `in_progress` → `completed`, with `cancelled` / `expired` as terminal exits). Direct status writes are no longer permitted from service code — use `transitionBooking(bookingId, nextStatus, ctx)`, which enforces `BOOKING_TRANSITIONS` and emits an activity log row per transition.

**Migration:**

- Replace any `db.update(bookings).set({ status: ... })` in caller code with `transitionBooking()`.
- The `redeemed` status is removed (it was a vouchers-domain concept that didn't apply here). Anything that read it should now look at `completed`.
- The new `in_progress` status models "booking has started but the trip is mid-delivery" — set by the operator or by a scheduled transition once `startDate` is reached.
