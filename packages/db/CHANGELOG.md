# @voyantjs/db

## 0.8.0

### Patch Changes

- @voyantjs/core@0.8.0

## 0.7.0

### Patch Changes

- @voyantjs/core@0.7.0

## 0.6.9

### Patch Changes

- @voyantjs/core@0.6.9

## 0.6.8

### Patch Changes

- b218885: Add a composite Better Auth membership index for workspace organization access paths.
  - @voyantjs/core@0.6.8

## 0.6.7

### Patch Changes

- @voyantjs/core@0.6.7

## 0.6.6

### Patch Changes

- @voyantjs/core@0.6.6

## 0.6.5

### Patch Changes

- @voyantjs/core@0.6.5

## 0.6.4

### Patch Changes

- @voyantjs/core@0.6.4

## 0.6.3

### Patch Changes

- d3c6937: Add a narrow execution lock surface and use it to serialize worker-driven notification reminder sweeps across processes.
- Updated dependencies [d3c6937]
  - @voyantjs/core@0.6.3

## 0.6.2

### Patch Changes

- @voyantjs/core@0.6.2

## 0.6.1

### Patch Changes

- @voyantjs/core@0.6.1

## 0.6.0

### Patch Changes

- @voyantjs/core@0.6.0

## 0.5.0

### Patch Changes

- ce72e29: Add a shared-room / split-booking group model

  Multiple separate bookings can now intentionally share one room/accommodation while each booking keeps its own finance + traveler records. Inspired by the ProTravel v3 `sharing_groups` pattern: flat peer bookings, a lightweight `booking_groups` + `booking_group_members` schema, smart cleanup on cancellation.

  `@voyantjs/bookings`: new `bookingGroups` and `bookingGroupMembers` tables (TypeID prefixes `bkgr` / `bkgm`), service functions for CRUD plus reverse lookup, unified traveler list across members, and automatic group dissolution when a cancellation leaves ≤1 active members. New routes under `/v1/bookings/groups` plus the REST-nested `GET /v1/bookings/:id/group`.

  `@voyantjs/bookings-react`: hooks for `useBookingGroups`, `useBookingGroup`, `useBookingGroupForBooking`, `useBookingGroupMutation`, and `useBookingGroupMemberMutation` (stateless — accepts `groupId` per-call so create-then-add flows work with a single hook instance).

  `@voyantjs/db`: register TypeID prefixes `bkgr` (booking_groups) and `bkgm` (booking_group_members).

  - @voyantjs/core@0.5.0

## 0.4.5

### Patch Changes

- e3f6e72: Standardize TypeID prefixes to a first-N-chars convention for better DX.

  Root entities now use the shortest unambiguous first-N chars of the entity name
  (e.g. `pers` instead of `prsn`, `org` instead of `orgn`). Child entities use a
  2-char module code plus 2-char suffix. 19 prefixes renamed in total.

- Updated dependencies [e3f6e72]
  - @voyantjs/core@0.4.5

## 0.4.4

### Patch Changes

- @voyantjs/core@0.4.4

## 0.4.3

### Patch Changes

- @voyantjs/core@0.4.3

## 0.4.2

### Patch Changes

- @voyantjs/core@0.4.2

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
