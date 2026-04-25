---
"@voyantjs/bookings": minor
---

Add route-layer PII redaction + mandatory audit on the bookings admin read surface.

`GET /v1/admin/bookings`, `GET /v1/admin/bookings/:id`, and `GET /v1/admin/bookings/:id/travelers` now:

- Check `shouldRevealBookingPii(ctx)` against actor / scopes / caller type
- Call `logBookingPiiAccess` with reason (`list_redacted` / `detail_reveal` / `insufficient_scope`) and metadata including row count
- Mask contact PII (name, email, phone, address) in the response unless the caller has the `bookings-pii:read` (or `bookings-pii:*` / `*` superuser) scope, or the request is internal

Exported helpers: `shouldRevealBookingPii`, `redactBookingContact`, `redactTravelerIdentity`, `redactEmail`, `redactPhone`, `redactString`. Surface area + posture documented in `docs/architecture/booking-pii.md`.
