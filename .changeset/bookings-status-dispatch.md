---
"@voyantjs/bookings": minor
---

Export `dispatchBookingStatusChange` from `@voyantjs/bookings/status-dispatch` (also re-exported from the package barrel).

Framework-agnostic helper that maps `(currentStatus, targetStatus)` → the right verb endpoint (`/confirm`, `/expire`, `/start`, `/complete`, `/cancel`, or `/override-status` for non-adjacent jumps) and the body the server expects. Lets non-React consumers — operator tooling using a generic `api.patch`, server-to-server scripts, third-party storefront builds — reuse the dispatch table that previously lived only inside `bookings-react`'s `useBookingStatusMutation`.

`useBookingStatusMutation` and `useBookingStatusByIdMutation` now delegate to this helper; behaviour is unchanged.

```ts
import { dispatchBookingStatusChange } from "@voyantjs/bookings/status-dispatch"

const target = dispatchBookingStatusChange(bookingId, "on_hold", "confirmed", "ok by ops")
await fetch(`${apiBase}${target.path}`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(target.body),
})
```
