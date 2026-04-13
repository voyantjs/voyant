# Voyant Platform Surface Roadmap

This roadmap turns downstream integration friction into an upstream package and
API plan for Voyant itself.

## Principles

- Do not preserve Payload semantics as a long-term public contract.
- Keep admin CRUD and consumer-facing contracts separate.
- Prefer reusable domain packages over app-local adapters.
- Make every public surface explicit, typed, and stable enough for multiple
  agencies to build on top of it.

## Current State

Voyant already has the right transport split:

- `/v1/admin/*` for staff/operator surfaces
- `/v1/public/*` for customer, partner, and supplier surfaces
- `/auth/*` for session and workspace/authenticated-user operations

The current gap is no longer “invent the surface model”. The gap is:

- release the source-level surfaces that already exist in-tree
- finish the remaining public/storefront contracts that still force app-local
  compatibility layers
- add first-class lifecycle/document workflows where apps still need copied
  orchestration

## Status Snapshot

### Release and package integrity

Resolved in source, but not in the published `0.3.0` npm train:

- `@voyantjs/finance` now exports the public finance schemas and public finance
  routes used by `@voyantjs/finance-react`
- `@voyantjs/products` now exports `publicProductsService`
- `@voyantjs/bookings` now exports `publicBookingsService` and public booking
  route helpers
- `@voyantjs/products-react` now exports the day, version, and media hooks and
  query helpers from the package root

Required follow-up:

- republish those packages on a new version
- keep CI/release smoke tests on runtime entrypoint exports, not just tarball
  file presence

### Auth and workspace surface

Resolved upstream for contracts, partially resolved for reusable UI:

- `@voyantjs/auth-react` covers current user, workspace, status, active
  organization, members, invitations, invite, remove, cancel, and role update
  flows
- Voyant still does not ship reusable staff team-management registry UI

### Customer portal surface

Resolved upstream for the base platform contract, adoption still incomplete in
  downstream apps:

- dedicated `@voyantjs/customer-portal` and
  `@voyantjs/customer-portal-react` packages exist
- public/authenticated routes now cover bootstrap, profile, companions,
  booking list/detail, documents, marketing consent, email contact-exists, and
  phone contact-exists

Still missing on this surface:

- richer booking summaries and financial history
- broader profile fields for traveler identity and billing
- broader public document coverage
- phone-based contact existence checks
- a first-class companion schema for richer traveler identity data

### Storefront catalog surface

Partially resolved:

- public catalog routes now cover product search/filter/sort, category listing,
  tag listing, and product detail

Still missing:

- localized slugs on the public contract
- SEO/meta fields required by storefront routes
- a first-class slug lookup route or equivalent summary fields
- a locale-aware internal product hydration/search-document helper for search
  indexing and other background jobs

### Public pricing and availability surface

Partially resolved:

- public pricing and availability routes now cover snapshot-style reads

Still missing:

- full storefront departure semantics expected by older site flows
- richer itinerary, extension, and offer payloads
- a clean replacement for app-local departure/pricing compatibility adapters

### Public booking and checkout surface

Partially resolved:

- public booking-session init/read/update/reserve and public overview are now in
  Voyant source

Still missing:

- public and internal overview helpers beyond `bookingNumber + email`
- cleaner package/service helpers for adapter-free storefront usage

Now covered:

- first-class booking-session state storage at
  `/v1/public/bookings/sessions/:sessionId/state`
- session snapshots now include persisted wizard state
- storefront repricing at `/v1/public/bookings/sessions/:sessionId/reprice`
  with preview mode and explicit `applyToSession` support for committing the
  selected unit/category pricing back onto booking items and totals
- matching React helpers in `@voyantjs/bookings-react` for public session read,
  state read/write, and repricing flows

Now covered:

- first-class checkout bootstrap routes in `@voyantjs/checkout`, including
  module-based mounting and typed collection-plan/initiate-collection response
  contracts

### Public finance surface

Partially resolved:

- public finance now covers booking payment options, payment-session
  reads/starts, and voucher validation

Still missing:

- hosted collection/bootstrap flows for exact booking balance collection
- first-class booking checkout start APIs that combine checkout creation and
  provider initiation
- customer-safe bank transfer instructions on the public finance surface
- reminder tracking and unpaid bank-transfer reminder workflows

Now covered:

- booking-scoped public finance document lookup for invoice and proforma
  renditions, including customer-safe download metadata when a ready rendition
  has a public or signed URL available
- admin checkout reminder tracking backed by first-class notification reminder
  runs instead of app-local booking metadata

### Legal and finance document workflows

Pending:

- storefront default contract-template selection is still app-owned policy
- legal contract rendering is still template-variable replacement only and does
  not cover richer Liquid/Lexical workflows
- finance invoice/proforma renditions still stop at `pending` without an
  upstream render/store/ready workflow

Required upstream workflows:

- render/generate/store/regenerate contract documents
- render/generate/store/regenerate invoice and proforma documents
- booking document preview, bundle, and email-send workflows

### Storefront support surfaces

Pending:

- storefront lead-capture and newsletter intake contract, if that becomes a
  repeated cross-app need instead of app-owned CRM and ESP wiring

### Shared editor surface

Resolved for base catalog CRUD, partially resolved for deeper product editing:

- packaged/shared registry coverage now exists for products, tags, categories,
  pricing categories, options, option units, availability, departures,
  schedules, product days, day services, versions, and media

Still missing:

- supplier-service picker workflows in shared day-service UI
- day-level media workflows beyond the current local wrapper patterns
- upload-aware media UX as a first-class shared operator surface

## Near-Term Priority

1. Republish the broken or stale package surfaces so npm matches the current
   source tree.
2. Finish the storefront catalog, pricing, booking, and finance contracts so
   downstream apps can remove compatibility adapters.
3. Add first-class legal and finance document generation/storage workflows.
4. Add generic storefront support surfaces: settings, verification,
   lead-capture, and transport requirements.
5. Keep growing shared operator UI only where the underlying public/admin
   contracts are already stable.

## Execution Slices

### Slice 1: additive public contract upgrades

Completed in the current source tree:

- customer-portal phone contact-exists preflight route and React hook
- legal default active contract-template selector with language fallback
- legal public template preview route
- public catalog localized slug/SEO fields and slug lookup route

### Slice 2: storefront operational surfaces

In progress:

- first-class storefront settings contract via `@voyantjs/storefront`
- generic email/SMS verification challenge flow via `@voyantjs/storefront-verification`
- transport requirements surface for passport/document rules via
  `@voyantjs/booking-requirements`

Deferred for now:

- storefront lead-capture/newsletter intake, with apps free to write directly
  into admin CRM or Mailchimp-style providers until a shared upstream model is
  justified

### Slice 3: booking and finance completion

Next:

- customer-safe bank transfer instructions
- unpaid bank-transfer reminder workflow behavior

### Slice 4: legal and finance document lifecycle

Next:

- contract artifact render/store/regenerate workflow
- invoice/proforma rendition completion workflow
- booking document bundle and send workflow
