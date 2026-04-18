# @voyantjs/bookings

## 0.6.1

### Patch Changes

- @voyantjs/core@0.6.1
- @voyantjs/db@0.6.1
- @voyantjs/hono@0.6.1
- @voyantjs/utils@0.6.1

## 0.6.0

### Patch Changes

- @voyantjs/core@0.6.0
- @voyantjs/db@0.6.0
- @voyantjs/hono@0.6.0
- @voyantjs/utils@0.6.0

## 0.5.0

### Minor Changes

- ce72e29: Add a shared-room / split-booking group model

  Multiple separate bookings can now intentionally share one room/accommodation while each booking keeps its own finance + traveler records. Inspired by the ProTravel v3 `sharing_groups` pattern: flat peer bookings, a lightweight `booking_groups` + `booking_group_members` schema, smart cleanup on cancellation.

  `@voyantjs/bookings`: new `bookingGroups` and `bookingGroupMembers` tables (TypeID prefixes `bkgr` / `bkgm`), service functions for CRUD plus reverse lookup, unified passenger list across members, and automatic group dissolution when a cancellation leaves ≤1 active members. New routes under `/v1/bookings/groups` plus the REST-nested `GET /v1/bookings/:id/group`.

  `@voyantjs/bookings-react`: hooks for `useBookingGroups`, `useBookingGroup`, `useBookingGroupForBooking`, `useBookingGroupMutation`, and `useBookingGroupMemberMutation` (stateless — accepts `groupId` per-call so create-then-add flows work with a single hook instance).

  `@voyantjs/db`: register TypeID prefixes `bkgr` (booking_groups) and `bkgm` (booking_group_members).

### Patch Changes

- Updated dependencies [ce72e29]
  - @voyantjs/core@0.5.0
  - @voyantjs/db@0.5.0
  - @voyantjs/hono@0.5.0
  - @voyantjs/utils@0.5.0

## 0.4.5

### Patch Changes

- Updated dependencies [e3f6e72]
  - @voyantjs/core@0.4.5
  - @voyantjs/db@0.4.5
  - @voyantjs/hono@0.4.5
  - @voyantjs/utils@0.4.5

## 0.4.4

### Patch Changes

- @voyantjs/core@0.4.4
- @voyantjs/db@0.4.4
- @voyantjs/hono@0.4.4
- @voyantjs/utils@0.4.4

## 0.4.3

### Patch Changes

- @voyantjs/core@0.4.3
- @voyantjs/db@0.4.3
- @voyantjs/hono@0.4.3
- @voyantjs/utils@0.4.3

## 0.4.2

### Patch Changes

- @voyantjs/core@0.4.2
- @voyantjs/db@0.4.2
- @voyantjs/hono@0.4.2
- @voyantjs/utils@0.4.2

## 0.4.1

### Patch Changes

- 4c4ea3c: Avoid deep `@voyantjs/db/schema/iam/kms` imports in published bundles by using the stable
  `@voyantjs/db/schema/iam` entrypoint instead. This reduces downstream SSR bundler resolution issues
  under pnpm-based builds.
  - @voyantjs/core@0.4.1
  - @voyantjs/db@0.4.1
  - @voyantjs/hono@0.4.1
  - @voyantjs/utils@0.4.1

## 0.4.0

### Patch Changes

- e84fe0f: Add a first-class admin booking overview lookup route and shared service helper
  that can resolve booking overviews by booking id, booking number, or booking
  code without requiring the public customer email lookup contract.
- Updated dependencies [e84fe0f]
- Updated dependencies [e84fe0f]
- Updated dependencies [e84fe0f]
  - @voyantjs/core@0.4.0
  - @voyantjs/db@0.4.0
  - @voyantjs/hono@0.4.0
  - @voyantjs/utils@0.4.0

## 0.3.1

### Patch Changes

- 8566f2d: Add first-class public booking-session wizard state and storefront repricing.

  `@voyantjs/bookings` now persists wizard session state in `booking_session_states`,
  includes that state in public session reads, exposes public state read/write
  routes, and adds `POST /v1/public/bookings/sessions/:sessionId/reprice` for
  previewing or applying room/unit repricing back onto the booking session.

  `@voyantjs/bookings-react` now exports public session/state query helpers and a
  mutation helper for session state updates and repricing.

- 8566f2d: Republish the public storefront package surfaces so published tarballs match the
  current source tree. This release restores the public finance schemas needed by
  `@voyantjs/finance-react`, publishes the public booking and product service
  exports already present in source, and ships the day/version/media product React
  exports from the package root.
- Updated dependencies [8566f2d]
- Updated dependencies [8566f2d]
  - @voyantjs/core@0.3.1
  - @voyantjs/db@0.3.1
  - @voyantjs/hono@0.3.1
  - @voyantjs/utils@0.3.1

## 0.3.0

### Patch Changes

- @voyantjs/core@0.3.0
- @voyantjs/db@0.3.0
- @voyantjs/hono@0.3.0
- @voyantjs/utils@0.3.0

## 0.2.0

### Patch Changes

- @voyantjs/core@0.2.0
- @voyantjs/db@0.2.0
- @voyantjs/hono@0.2.0
- @voyantjs/utils@0.2.0

## 0.1.1

### Patch Changes

- @voyantjs/core@0.1.1
- @voyantjs/db@0.1.1
- @voyantjs/hono@0.1.1
- @voyantjs/utils@0.1.1
