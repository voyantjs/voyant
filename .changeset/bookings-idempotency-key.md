---
"@voyantjs/bookings": minor
"@voyantjs/hono": minor
"@voyantjs/db": minor
---

Add `Idempotency-Key` header protocol for non-idempotent booking-creation endpoints.

Same key + same body replays the original response; same key + different body returns `409 Conflict`. Records expire after 24h. Wired (with `required: false` default) into:

- `POST /v1/admin/bookings/`
- `POST /v1/admin/bookings/reserve`
- `POST /v1/admin/bookings/from-product`
- `POST /v1/admin/bookings/from-offer/:offerId/reserve`
- `POST /v1/admin/bookings/from-order/:orderId/reserve`
- `POST /v1/public/bookings/sessions`
- `POST /v1/public/bookings/sessions/:sessionId/confirm`

Ships:

- `idempotency_keys` table in `@voyantjs/db/schema/infra` keyed by `(scope, key)`, with body-hash, captured response, and TTL.
- `idempotencyKey({ scope, required? })` middleware in `@voyantjs/hono` that reads the header, replays/conflicts/expires, and captures `2xx` JSON responses. Echoes `Idempotency-Key` + `Idempotency-Replayed: true` on replay.
- `purgeExpiredIdempotencyKeys()` helper for daily-cron cleanup.

Backwards-compatible: clients without the header continue to work. Templates can flip a route to `required: true` per endpoint once their client has rolled out.
