---
"@voyantjs/bookings": patch
"@voyantjs/bookings-react": patch
"@voyantjs/db": patch
---

Add first-class public booking-session wizard state and storefront repricing.

`@voyantjs/bookings` now persists wizard session state in `booking_session_states`,
includes that state in public session reads, exposes public state read/write
routes, and adds `POST /v1/public/bookings/sessions/:sessionId/reprice` for
previewing or applying room/unit repricing back onto the booking session.

`@voyantjs/bookings-react` now exports public session/state query helpers and a
mutation helper for session state updates and repricing.
