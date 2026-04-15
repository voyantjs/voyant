# @voyantjs/finance-react

## 0.4.1

### Patch Changes

- a49630a: Extend the public finance surface with customer-safe document lookup by reference
  and add typed organization member/invitation exports in `@voyantjs/auth-react`
  for shared team-management UIs.
- Updated dependencies [a49630a]
  - @voyantjs/finance@0.4.1
  - @voyantjs/react@0.4.1

## 0.4.0

### Patch Changes

- e84fe0f: Add a public booking payment-history route and matching React helpers so
  storefronts can read booking-scoped payments with invoice context from
  `/v1/public/finance/bookings/:bookingId/payments`.
- Updated dependencies [e84fe0f]
- Updated dependencies [e84fe0f]
- Updated dependencies [e84fe0f]
- Updated dependencies [e84fe0f]
- Updated dependencies [e84fe0f]
- Updated dependencies [e84fe0f]
  - @voyantjs/finance@0.4.0
  - @voyantjs/react@0.4.0

## 0.3.1

### Patch Changes

- 8566f2d: Add a booking-scoped public finance document surface for invoice and proforma
  downloads.

  `@voyantjs/finance` now exposes a public booking documents route that returns
  customer-safe invoice and proforma document metadata, including the best
  available rendition status and download URL when a ready rendition has a public
  or signed URL. `@voyantjs/finance-react` now exposes matching schemas, query
  keys, query options, operations, and a `usePublicBookingDocuments` hook.

- 8566f2d: Republish the public storefront package surfaces so published tarballs match the
  current source tree. This release restores the public finance schemas needed by
  `@voyantjs/finance-react`, publishes the public booking and product service
  exports already present in source, and ships the day/version/media product React
  exports from the package root.
- Updated dependencies [8566f2d]
- Updated dependencies [8566f2d]
  - @voyantjs/finance@0.3.1
  - @voyantjs/react@0.3.1

## 0.3.0

### Patch Changes

- Updated dependencies [e57725d]
  - @voyantjs/finance@0.3.0
  - @voyantjs/react@0.3.0
