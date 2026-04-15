# @voyantjs/db

## 0.4.1

### Patch Changes

- @voyantjs/core@0.4.1

## 0.4.0

### Patch Changes

- e84fe0f: Enrich the public customer-portal profile with middle name, top-level
  date-of-birth/address fields, consent provenance/source, and encrypted travel
  document reads/writes backed by `user_profiles.documentsEncrypted`.
  - @voyantjs/core@0.4.0

## 0.3.1

### Patch Changes

- 8566f2d: Add first-class public booking-session wizard state and storefront repricing.

  `@voyantjs/bookings` now persists wizard session state in `booking_session_states`,
  includes that state in public session reads, exposes public state read/write
  routes, and adds `POST /v1/public/bookings/sessions/:sessionId/reprice` for
  previewing or applying room/unit repricing back onto the booking session.

  `@voyantjs/bookings-react` now exports public session/state query helpers and a
  mutation helper for session state updates and repricing.

- 8566f2d: Add a first-class public storefront verification flow with email and SMS
  challenge start/confirm routes, pluggable developer-supplied senders, and
  built-in notification-provider adapters including Resend email and Twilio SMS.
  - @voyantjs/core@0.3.1

## 0.3.0

### Patch Changes

- @voyantjs/core@0.3.0

## 0.2.0

### Patch Changes

- @voyantjs/core@0.2.0

## 0.1.1

### Patch Changes

- @voyantjs/core@0.1.1

## 1.1.11

## 1.1.1

## 1.1.0

### Minor Changes

- [#292](https://github.com/voyantjs/voyant/pull/292)
  [`d799492`](https://github.com/voyantjs/voyant/commit/d799492fabc7789315d614af4bb2f3a58804ce10)
  Thanks [@mihaipxm](https://github.com/mihaipxm)! - Initial SDK release
