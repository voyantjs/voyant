---
"@voyantjs/finance": patch
"@voyantjs/finance-react": patch
---

Add a public booking payment-history route and matching React helpers so
storefronts can read booking-scoped payments with invoice context from
`/v1/public/finance/bookings/:bookingId/payments`.
