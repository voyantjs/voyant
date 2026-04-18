# @voyantjs/customer-portal

## 0.6.5

### Patch Changes

- Updated dependencies [ae9933b]
  - @voyantjs/bookings@0.6.5
  - @voyantjs/core@0.6.5
  - @voyantjs/crm@0.6.5
  - @voyantjs/db@0.6.5
  - @voyantjs/finance@0.6.5
  - @voyantjs/hono@0.6.5
  - @voyantjs/identity@0.6.5
  - @voyantjs/legal@0.6.5
  - @voyantjs/utils@0.6.5

## 0.6.4

### Patch Changes

- @voyantjs/bookings@0.6.4
- @voyantjs/core@0.6.4
- @voyantjs/crm@0.6.4
- @voyantjs/db@0.6.4
- @voyantjs/finance@0.6.4
- @voyantjs/hono@0.6.4
- @voyantjs/identity@0.6.4
- @voyantjs/legal@0.6.4
- @voyantjs/utils@0.6.4

## 0.6.3

### Patch Changes

- Updated dependencies [d3c6937]
  - @voyantjs/bookings@0.6.3
  - @voyantjs/core@0.6.3
  - @voyantjs/crm@0.6.3
  - @voyantjs/db@0.6.3
  - @voyantjs/finance@0.6.3
  - @voyantjs/hono@0.6.3
  - @voyantjs/identity@0.6.3
  - @voyantjs/legal@0.6.3
  - @voyantjs/utils@0.6.3

## 0.6.2

### Patch Changes

- @voyantjs/bookings@0.6.2
- @voyantjs/core@0.6.2
- @voyantjs/crm@0.6.2
- @voyantjs/db@0.6.2
- @voyantjs/finance@0.6.2
- @voyantjs/hono@0.6.2
- @voyantjs/identity@0.6.2
- @voyantjs/legal@0.6.2
- @voyantjs/utils@0.6.2

## 0.6.1

### Patch Changes

- @voyantjs/bookings@0.6.1
- @voyantjs/core@0.6.1
- @voyantjs/crm@0.6.1
- @voyantjs/db@0.6.1
- @voyantjs/finance@0.6.1
- @voyantjs/hono@0.6.1
- @voyantjs/identity@0.6.1
- @voyantjs/legal@0.6.1
- @voyantjs/utils@0.6.1

## 0.6.0

### Patch Changes

- @voyantjs/bookings@0.6.0
- @voyantjs/core@0.6.0
- @voyantjs/crm@0.6.0
- @voyantjs/db@0.6.0
- @voyantjs/finance@0.6.0
- @voyantjs/hono@0.6.0
- @voyantjs/identity@0.6.0
- @voyantjs/legal@0.6.0
- @voyantjs/utils@0.6.0

## 0.5.0

### Patch Changes

- Updated dependencies [ce72e29]
  - @voyantjs/bookings@0.5.0
  - @voyantjs/core@0.5.0
  - @voyantjs/crm@0.5.0
  - @voyantjs/db@0.5.0
  - @voyantjs/finance@0.5.0
  - @voyantjs/hono@0.5.0
  - @voyantjs/identity@0.5.0
  - @voyantjs/legal@0.5.0
  - @voyantjs/utils@0.5.0

## 0.4.5

### Patch Changes

- Updated dependencies [e3f6e72]
  - @voyantjs/bookings@0.4.5
  - @voyantjs/core@0.4.5
  - @voyantjs/crm@0.4.5
  - @voyantjs/db@0.4.5
  - @voyantjs/finance@0.4.5
  - @voyantjs/hono@0.4.5
  - @voyantjs/identity@0.4.5
  - @voyantjs/legal@0.4.5
  - @voyantjs/utils@0.4.5

## 0.4.4

### Patch Changes

- @voyantjs/bookings@0.4.4
- @voyantjs/core@0.4.4
- @voyantjs/crm@0.4.4
- @voyantjs/db@0.4.4
- @voyantjs/finance@0.4.4
- @voyantjs/hono@0.4.4
- @voyantjs/identity@0.4.4
- @voyantjs/legal@0.4.4
- @voyantjs/utils@0.4.4

## 0.4.3

### Patch Changes

- @voyantjs/bookings@0.4.3
- @voyantjs/core@0.4.3
- @voyantjs/crm@0.4.3
- @voyantjs/db@0.4.3
- @voyantjs/finance@0.4.3
- @voyantjs/hono@0.4.3
- @voyantjs/identity@0.4.3
- @voyantjs/legal@0.4.3
- @voyantjs/utils@0.4.3

## 0.4.2

### Patch Changes

- Updated dependencies [8de4602]
  - @voyantjs/bookings@0.4.2
  - @voyantjs/core@0.4.2
  - @voyantjs/crm@0.4.2
  - @voyantjs/db@0.4.2
  - @voyantjs/finance@0.4.2
  - @voyantjs/hono@0.4.2
  - @voyantjs/identity@0.4.2
  - @voyantjs/legal@0.4.2
  - @voyantjs/utils@0.4.2

## 0.4.1

### Patch Changes

- c3f3ccf: Stop importing the deep `@voyantjs/db/schema/iam/kms` subpath from the published customer portal bundle and use the stable `@voyantjs/db/schema/iam` entrypoint instead. This avoids downstream SSR bundler alias workarounds in setups like Astro/Vite under pnpm.
- Updated dependencies [4c4ea3c]
- Updated dependencies [a49630a]
  - @voyantjs/bookings@0.4.1
  - @voyantjs/core@0.4.1
  - @voyantjs/crm@0.4.1
  - @voyantjs/db@0.4.1
  - @voyantjs/finance@0.4.1
  - @voyantjs/hono@0.4.1
  - @voyantjs/identity@0.4.1
  - @voyantjs/legal@0.4.1
  - @voyantjs/utils@0.4.1

## 0.4.0

### Patch Changes

- e84fe0f: Expose booking billing contact through customer-portal booking detail and a
  dedicated public route, with React query helpers for storefront payment and
  remainder flows.
- e84fe0f: Expand customer-portal booking document coverage.

  - include booking-linked contract attachments in
    `/v1/public/customer-portal/bookings/:bookingId/documents` when they have a
    customer-safe download URL
  - include booking-linked invoice and proforma renditions in that same document
    list when a customer-safe download URL exists
  - add a `source` discriminator plus `mimeType` and `reference` fields to the
    customer-portal booking document schema

- e84fe0f: Add `productTitle` and native `paymentStatus` to public customer-portal
  booking summaries so storefront account lists can render booking rows without
  separate booking-detail and finance hydration calls.
- e84fe0f: Promote public companion traveler identity fields into the shared
  customer-portal contract with first-class `typeKey` and typed person, address,
  and document shapes instead of forcing apps to read and write those values only
  through untyped companion metadata.
- e84fe0f: Add a first-class customer-portal action to import accessible booking
  participants into companions with duplicate detection, plus matching React
  operations and mutation support.
- e84fe0f: Expand the public customer-portal contract with booking financial history and a
  first-class billing-address object on customer records.

  Changes:

  - add `financials.documents` and `financials.payments` to public booking detail
  - include booking-linked invoice/proforma summaries and payment history in the
    booking detail route
  - expose `customerRecord.billingAddress` on public profile/bootstrap payloads
  - support updating the linked customer billing address through the public
    profile update and bootstrap flows

- e84fe0f: Enrich the public customer-portal profile with middle name, top-level
  date-of-birth/address fields, consent provenance/source, and encrypted travel
  document reads/writes backed by `user_profiles.documentsEncrypted`.
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
  - @voyantjs/crm@0.4.0
  - @voyantjs/db@0.4.0
  - @voyantjs/finance@0.4.0
  - @voyantjs/hono@0.4.0
  - @voyantjs/identity@0.4.0
  - @voyantjs/legal@0.4.0
  - @voyantjs/utils@0.4.0

## 0.3.1

### Patch Changes

- 8566f2d: Advance the public storefront surface with phone contact-exists support in the
  customer portal, default-template and preview helpers in legal, localized slug
  and SEO catalog fields in products, and a new config-backed storefront settings
  module for booking/account pages.
- Updated dependencies [8566f2d]
- Updated dependencies [8566f2d]
- Updated dependencies [8566f2d]
  - @voyantjs/bookings@0.3.1
  - @voyantjs/core@0.3.1
  - @voyantjs/crm@0.3.1
  - @voyantjs/db@0.3.1
  - @voyantjs/hono@0.3.1
  - @voyantjs/identity@0.3.1
