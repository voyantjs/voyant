---
"@voyantjs/checkout": patch
---

Formalize checkout as a first-class Voyant module and add admin reminder
tracking.

`@voyantjs/checkout` now exposes a `createCheckoutHonoModule()` helper,
typed response schemas for collection plans and initiated collections, and an
admin `GET /v1/admin/checkout/bookings/:bookingId/reminder-runs` route backed by
notification reminder runs. The operator, dmc, and dev templates now mount
checkout through the module system and explicitly keep `/v1/checkout/*`
available as a public path.
