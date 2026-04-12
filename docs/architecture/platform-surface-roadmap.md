# Voyant Platform Surface Roadmap

This roadmap turns downstream integration friction into an upstream package and
API plan for Voyant itself.

## Principles

- Do not preserve Payload semantics as a long-term public contract.
- Keep admin CRUD and consumer-facing contracts separate.
- Prefer reusable domain packages over app-local adapters.
- Make every public surface explicit, typed, and stable enough for multiple
  agencies to build on top of it.

## Surface Model

Voyant already has the right transport split:

- `/v1/admin/*` for staff/operator surfaces
- `/v1/public/*` for customer, partner, and supplier surfaces
- `/auth/*` for session and workspace/authenticated-user operations

The missing work is on top of that split:

- reusable package surfaces
- consumer-oriented response contracts
- module boundaries that do not force storefront apps to reverse-engineer admin
  CRUD APIs

## Upstream Package Plan

### 1. Auth and workspace surface

Own the authenticated workspace contract in Voyant:

- `/auth/me`
- `/auth/status`
- `/auth/workspace`
- `/auth/workspace/active-organization`

Runtime package:

- `@voyantjs/auth-react`
- current user hook
- current workspace hook
- auth status hook
- active organization mutation

Follow-up scope on the same package and route family:

- organization members
- pending invitations
- invite/revoke/remove/update-role mutations

### 2. Customer portal surface

Do not hide customer-facing behavior inside admin modules.

Add a dedicated customer-facing contract that covers:

- profile read/update
- preferences and marketing consent
- companions and contact relationships
- customer-scoped booking list/detail/documents
- contact existence checks required by account and booking flows

Current implementation direction:

- dedicated `@voyantjs/customer-portal` package
- dedicated `@voyantjs/customer-portal-react` consumer package for typed
  operations, query keys, query options, and React hooks
- authenticated profile/preferences from Better Auth `user` +
  `user_profiles`
- optional explicit CRM customer linkage via `people.source = "auth.user"`
  and `people.sourceRef = user.id`
- customer-scoped bookings resolved from the linked CRM person and safe
  email-based booking participation fallback
- lightweight companion/contact records backed by identity named contacts
- authenticated bootstrap flow at `/v1/public/customer-portal/bootstrap`
- unauthenticated contact preflight at
  `/v1/customer-portal/contact-exists`

Still to add on this surface:

- a reference customer onboarding flow that consumes
  `@voyantjs/customer-portal-react`
- stronger customer-to-CRM linking and provisioning workflows beyond
  explicit candidate selection
- customer document download policies beyond simple ownership filtering
- eventual unauthenticated public-surface transport support so preflight
  endpoints do not need to use the legacy `/v1/{module}` escape hatch

### 3. Storefront catalog surface

Catalog reads should not be a thin wrapper around product admin CRUD.

Expose a storefront-oriented public catalog contract that covers:

- product search/filter/sort
- category and tag listing
- product detail
- departure summaries tied to a product
- offer applicability reads

### 4. Public pricing and availability surface

Pricing and availability need a public contract that is independent from
internal scheduling CRUD.

Cover:

- departure list/detail
- departure pricing
- availability snapshots and prerequisites
- applicable offers

### 5. Public booking and checkout surface

Booking flow and payment flow should be explicit storefront contracts, not
adaptations of internal reservation/payment primitives.

Cover:

- booking-session init/read/update/reserve
- booking overview by public reference
- booking payment list in public context
- payment session start and redirect initiation
- payment accounts/defaults
- voucher validation

## Editor Surface Plan

Shared operator UI should continue to grow, but only after the platform
contracts above exist.

Priority:

- first packaging milestone complete

Current implementation direction:

- product option and option-unit editor surface is now packaged as registry
  components on top of `@voyantjs/products-react`
- product departures and recurring schedules are now packaged as registry
  components on top of `@voyantjs/availability-react`
- product itinerary days/services, version snapshots, and media management
  are now packaged as registry components on top of `@voyantjs/products-react`
- further shared editor work should stay focused on route-level operator
  sections rather than low-level field widgets

## Execution Order

1. Finish downstream adoption of already-resolved tags/categories/pricing
   surfaces.
2. Ship the reusable auth/workspace contract and `@voyantjs/auth-react`.
3. Add member and invitation management to the same auth/workspace surface.
4. Design and implement dedicated customer portal contracts.
5. Design and implement dedicated public catalog and public
   pricing/availability contracts.
6. Design and implement public booking and payment contracts.
7. Expand shared operator editor surfaces.
