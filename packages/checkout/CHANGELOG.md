# @voyantjs/checkout

## 0.4.0

### Patch Changes

- e84fe0f: Add a fuller storefront payment bootstrap surface to checkout.

  - allow exact-amount collection overrides in checkout plans and initiation
  - return customer-safe bank transfer instructions from checkout when configured
  - support combined provider startup in checkout through injected payment
    starters
  - add a Netopia checkout starter helper in `@voyantjs/plugin-netopia`

- e84fe0f: Add invoice-targeted reminder rules and runs so unpaid invoice/proforma
  documents created for bank-transfer checkout flows can use the same first-class
  reminder engine and checkout reminder visibility as schedule-backed reminders.
- Updated dependencies [e84fe0f]
- Updated dependencies [e84fe0f]
- Updated dependencies [e84fe0f]
- Updated dependencies [e84fe0f]
- Updated dependencies [e84fe0f]
- Updated dependencies [e84fe0f]
- Updated dependencies [e84fe0f]
- Updated dependencies [e84fe0f]
- Updated dependencies [e84fe0f]
  - @voyantjs/bookings@0.4.0
  - @voyantjs/core@0.4.0
  - @voyantjs/finance@0.4.0
  - @voyantjs/hono@0.4.0
  - @voyantjs/notifications@0.4.0

## 0.3.1

### Patch Changes

- 8566f2d: Formalize checkout as a first-class Voyant module and add admin reminder
  tracking.

  `@voyantjs/checkout` now exposes a `createCheckoutHonoModule()` helper,
  typed response schemas for collection plans and initiated collections, and an
  admin `GET /v1/admin/checkout/bookings/:bookingId/reminder-runs` route backed by
  notification reminder runs. The operator, dmc, and dev templates now mount
  checkout through the module system and explicitly keep `/v1/checkout/*`
  available as a public path.

- Updated dependencies [8566f2d]
- Updated dependencies [8566f2d]
- Updated dependencies [8566f2d]
- Updated dependencies [8566f2d]
  - @voyantjs/bookings@0.3.1
  - @voyantjs/core@0.3.1
  - @voyantjs/finance@0.3.1
  - @voyantjs/hono@0.3.1
  - @voyantjs/notifications@0.3.1

## 0.3.0

### Patch Changes

- @voyantjs/bookings@0.3.0
- @voyantjs/core@0.3.0
- @voyantjs/finance@0.3.0
- @voyantjs/hono@0.3.0
- @voyantjs/notifications@0.3.0

## 0.2.0

### Patch Changes

- 45db219: Fix the published package layout so build output lands at `dist/*` instead of `dist/src/*`, matching the package exports.
  - @voyantjs/bookings@0.2.0
  - @voyantjs/core@0.2.0
  - @voyantjs/finance@0.2.0
  - @voyantjs/hono@0.2.0
  - @voyantjs/notifications@0.2.0

## 0.1.1

### Patch Changes

- @voyantjs/bookings@0.1.1
- @voyantjs/core@0.1.1
- @voyantjs/finance@0.1.1
- @voyantjs/hono@0.1.1
- @voyantjs/notifications@0.1.1
