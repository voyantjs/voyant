# @voyantjs/bookings

## 0.10.0

### Minor Changes

- 29a581a: Auto-rollup booking total from `booking_items`. `bookingsService.recomputeBookingTotal(db, bookingId)` is now wired into `createItem` / `updateItem` / `deleteItem`, each wrapped in `db.transaction` so partial failures can never leave the parent total stale.

  Also exposed publicly for ad-hoc invocation (saga compensation, fix-up scripts).

  Base-currency totals (`baseSellAmountCents` / `baseCostAmountCents`) are NOT recomputed by this rollup — those are FX-derived and handled by the FX rollup added in the same release.

- 29a581a: **BREAKING:** encrypt `accessibilityNeeds` at rest. Move accessibility info from a plaintext column on `booking_travelers` into the KMS-encrypted `booking_traveler_travel_details` envelope (alongside passport / nationality / DOB / dietary).

  Disability data has tighter regulatory expectations in many jurisdictions (ADA / Equality Act) than freeform notes, so it lives with the passport-class data, not with `specialRequests` or `notes`.

  **Migration:**

  - The `booking_travelers.accessibility_needs` column is dropped.
  - `accessibilityNeeds` is removed from `bookingTravelerRecord`, `BookingTraveler*` insert/update validation schemas, `redactTravelerIdentity`, and the bookings-react / finance / scripts surface.
  - Read accessibility data through `createBookingPiiService.getTravelerTravelDetails`, which decrypts via `decryptOptionalJsonEnvelope` + audits the access. Same authorisation gate as the existing dietary / identity buckets.

  Contact identifiers (email, phone, names, address) and `specialRequests` deliberately stay plaintext — see `docs/architecture/booking-pii.md` for the cost-benefit decision.

- 29a581a: FX rollup for `base_*_amount_cents` on item mutations. `bookingsService.recomputeBookingTotal` now re-derives `baseSellAmountCents` / `baseCostAmountCents` from per-item totals when the booking declares a `baseCurrency` and `fxRateSetId`.

  Schema: `bookings.fx_rate_set_id` (text, nullable) — plain text per the cross-domain FK rule (reference into the markets package).

  FX behaviour:

  - **Single-currency** (`baseCurrency` null OR every item's `sellCurrency === baseCurrency`): conversion is a no-op, `base*Cents` track `sell*Cents` 1:1. `fxStatus: "ok"`.
  - **Multi-currency with valid FX**: each item converted via `exchange_rates` (direct rate or `inverse_rate_decimal` if direct row missing), summed. `fxStatus: "ok"`.
  - **Missing rate**: short-circuits with `fxStatus: "missing_rate"`; `base*Cents` left unchanged on the parent. Caller decides.
  - **No `fxRateSetId` configured**: skipped, `fxStatus: "skipped"`, `base*Cents` stay null.

- 29a581a: Add `Idempotency-Key` header protocol for non-idempotent booking-creation endpoints.

  Same key + same body replays the original response; same key + different body returns `409 Conflict`. Records expire after 24h. Wired (with `required: false` default) into:

  - `POST /v1/admin/bookings/`
  - `POST /v1/admin/bookings/reserve`
  - `POST /v1/admin/bookings/from-product`
  - `POST /v1/admin/bookings/from-offer/:offerId/reserve`
  - `POST /v1/admin/bookings/from-order/:orderId/reserve`
  - `POST /v1/public/bookings/sessions`
  - `POST /v1/public/bookings/sessions/:sessionId/confirm`

  Ships:

  - `idempotency_keys` table in `@voyantjs/db/schema/infra` keyed by `(scope, key)`, with body-hash, captured response, and TTL.
  - `idempotencyKey({ scope, required? })` middleware in `@voyantjs/hono` that reads the header, replays/conflicts/expires, and captures `2xx` JSON responses. Echoes `Idempotency-Key` + `Idempotency-Replayed: true` on replay.
  - `purgeExpiredIdempotencyKeys()` helper for daily-cron cleanup.

  Backwards-compatible: clients without the header continue to work. Templates can flip a route to `required: true` per endpoint once their client has rolled out.

- 29a581a: Add route-layer PII redaction + mandatory audit on the bookings admin read surface.

  `GET /v1/admin/bookings`, `GET /v1/admin/bookings/:id`, and `GET /v1/admin/bookings/:id/travelers` now:

  - Check `shouldRevealBookingPii(ctx)` against actor / scopes / caller type
  - Call `logBookingPiiAccess` with reason (`list_redacted` / `detail_reveal` / `insufficient_scope`) and metadata including row count
  - Mask contact PII (name, email, phone, address) in the response unless the caller has the `bookings-pii:read` (or `bookings-pii:*` / `*` superuser) scope, or the request is internal

  Exported helpers: `shouldRevealBookingPii`, `redactBookingContact`, `redactTravelerIdentity`, `redactEmail`, `redactPhone`, `redactString`. Surface area + posture documented in `docs/architecture/booking-pii.md`.

- 29a581a: Add `refundBooking` saga — atomic credit-note + hold-release + supplier-reverse + notify, built on the existing `createWorkflow` primitive.

  Side-effect dependencies are injected (no compile-time pull on finance / transactions / notifications) so the package stays slim; templates wire the deps.

  Step graph with reverse-order compensation:

  1. `validate-state` — refundable only when `confirmed`, `in_progress`, or `on_hold`. Rejects partial amounts outside `[0, sellAmountCents]`.
  2. `create-credit-note` — short-circuits when `refundAmount === 0`. Compensation: void.
  3. `release-inventory` — releases held + confirmed allocations, restores slot capacity. Compensation: re-decrement (loud failure if re-sold, intentional).
  4. `reverse-supplier-offer` — best-effort.
  5. `transition-booking` → `cancelled` via `transitionBooking()` (state-machine guard).
  6. `notify-customer` — fire-and-forget.

  Exports `refundBooking(input, deps)` and `buildRefundBookingWorkflow(deps)` for callers that want to inspect the workflow definition or run it via a JobRunner.

- 29a581a: **BREAKING:** introduce explicit booking state machine with `transitionBooking()` guards.

  Bookings now move through a typed state graph (`draft` → `on_hold` → `confirmed` → `in_progress` → `completed`, with `cancelled` / `expired` as terminal exits). Direct status writes are no longer permitted from service code — use `transitionBooking(bookingId, nextStatus, ctx)`, which enforces `BOOKING_TRANSITIONS` and emits an activity log row per transition.

  **Migration:**

  - Replace any `db.update(bookings).set({ status: ... })` in caller code with `transitionBooking()`.
  - The `redeemed` status is removed (it was a vouchers-domain concept that didn't apply here). Anything that read it should now look at `completed`.
  - The new `in_progress` status models "booking has started but the trip is mid-delivery" — set by the operator or by a scheduled transition once `startDate` is reached.

### Patch Changes

- 29a581a: Add Postgres `CHECK` constraints across finance, bookings, and transactions schemas to enforce: if any `*_amount_cents` column is set, its companion currency column must also be set.

  Two flavours, depending on column shape:

  - **Strict XNOR** (`(currency IS NULL) = (amount IS NULL)`) — one currency to one amount: `booking_guarantees`, `booking_item_commissions`, `payments` (base).
  - **Implication** (`(amounts NULL) OR (currency NOT NULL)`) — one currency covering multiple amount columns: `bookings.base_currency`, `booking_items.cost_currency`, `offer_items.cost_currency`, `order_items.cost_currency`, `invoices.base_currency`.

  The implication form intentionally allows "currency without amount" because the currency may be pre-declared before line items roll up.

- Updated dependencies [29a581a]
- Updated dependencies [b7f0501]
  - @voyantjs/core@0.10.0
  - @voyantjs/db@0.10.0
  - @voyantjs/hono@0.10.0
  - @voyantjs/utils@0.10.0

## 0.9.0

### Patch Changes

- @voyantjs/core@0.9.0
- @voyantjs/db@0.9.0
- @voyantjs/hono@0.9.0
- @voyantjs/utils@0.9.0

## 0.8.0

### Patch Changes

- Updated dependencies [24dc253]
  - @voyantjs/core@0.8.0
  - @voyantjs/db@0.8.0
  - @voyantjs/hono@0.8.0
  - @voyantjs/utils@0.8.0

## 0.7.0

### Minor Changes

- 96612b3: Bookings-create composition surface (#223) and vouchers-as-first-class (#227) — the packages on the release train all move together, so this covers the batch.

  **Atomic booking create (#263, #264, #265, #266)**

  - `POST /v1/admin/bookings/quick-create` — one-shot endpoint that converts a product, inserts travelers + payment schedules, redeems a voucher, and creates/joins a `booking_group` inside a single DB transaction. `quickCreateBooking(db, input, { userId, runtime })` service in `@voyantjs/finance`; `useBookingQuickCreateMutation` in `@voyantjs/bookings-react`.
  - `POST /v1/admin/bookings/dual-create` — partaj flow: two bookings + one shared-room group, also atomic. `dualCreateBooking` service, `useBookingDualCreateMutation` hook.
  - `booking.quick-created` and `booking.dual-created` events emitted post-commit when a runtime eventBus is wired.
  - `QuickBookDialog` now mounts all nine picker sections (product, departure, rooms, person, shared-room, passengers, price breakdown, voucher, payment schedule) and submits via quick-create. Post-create "Confirm & notify traveler" toggle uses the new `useBookingStatusByIdMutation` to transition the fresh booking to `confirmed` — which (when `autoConfirmAndDispatch` is on) fires the doc bundle + traveler email through the existing `booking.confirmed` subscriber.
  - Bookings fix: `productDaysRef` / `getConvertProductData` now join through `product_itineraries` to match the real products schema; the existing `POST /v1/bookings/from-product` convert path works again.

  **Vouchers as first-class financial instruments (#262, #267)**

  - One-shot data migration: `migrateVouchersFromPaymentInstruments(db, opts)` in `@voyantjs/finance` (CLI wrapper `pnpm -F @voyantjs/finance migrate:vouchers`, `--dry-run` supported). Idempotent; pulls code, currency, amount, expiry from legacy JSONB metadata into the new `vouchers` table.
  - `vouchers.validFrom` (start-of-validity, maps to OpenTravel `Finance.Voucher.effectiveDate`) and `vouchers.seriesCode` (batch/campaign id, maps to `Finance.Voucher.seriesCode`) columns added. Redeem guard returns `voucher_not_started` when now < validFrom; the public `validateVoucher` `not_started` branch is now reachable. `seriesCode` exposed as a list filter. Migration pulls both from legacy metadata (honouring OpenTravel's `effectiveDate` alias).

### Patch Changes

- @voyantjs/core@0.7.0
- @voyantjs/db@0.7.0
- @voyantjs/hono@0.7.0
- @voyantjs/utils@0.7.0

## 0.6.9

### Patch Changes

- 7619ef0: Continue the traveler-first booking contract cleanup across the published booking surfaces while preserving compatibility aliases.

  - `@voyantjs/bookings`: add traveler-first public aliases for booking travel details, group traveler routes, public booking-session traveler input, and traveler-facing validation/error wording while keeping legacy participant/passenger compatibility routes and schemas.
  - `@voyantjs/bookings-react`: make traveler hooks, query options, schemas, and exports the primary surface again; keep passenger/item-participant names as compatibility aliases instead of separate primaries.
  - `@voyantjs/customer-portal` and `@voyantjs/customer-portal-react`: move booking import schemas, operations, and exports to traveler-first names while preserving legacy participant aliases and routes.
  - `@voyantjs/transactions`: expose traveler-first request/response aliases and traveler route aliases for offer/order traveler and item-traveler flows while preserving legacy participant compatibility endpoints.
  - `@voyantjs/auth-react`: add exported query keys, query options, and schemas for current workspace, organization members, and organization invitations so app surfaces can consume the auth workspace contract directly.
  - `@voyantjs/products` and `@voyantjs/products-react`: tighten the itinerary-facing public surface and query/schema exports used by the shared product itinerary UI.
  - `@voyantjs/legal` and `@voyantjs/notifications`: keep template authoring and Liquid exports available from the package roots while aligning the notification/template surface with the updated booking traveler contract.
  - Supporting packages and tests also picked up repo-wide import-order, lint, and small compatibility cleanups across auth, booking requirements, checkout, octo, pricing, sellability, storefront, and utilities as part of bringing the whole worktree back to a green release state.
  - Align the touched app/template compatibility wrappers with the new primary traveler and workspace surfaces, and keep repo `typecheck` / `lint` green after the broader cleanup.
  - @voyantjs/core@0.6.9
  - @voyantjs/db@0.6.9
  - @voyantjs/hono@0.6.9
  - @voyantjs/utils@0.6.9

## 0.6.8

### Patch Changes

- b218885: Align booking root and child-list indexes with the package’s booking-scoped sort-heavy query shapes.
- Updated dependencies [b218885]
  - @voyantjs/core@0.6.8
  - @voyantjs/db@0.6.8
  - @voyantjs/hono@0.6.8
  - @voyantjs/utils@0.6.8

## 0.6.7

### Patch Changes

- @voyantjs/core@0.6.7
- @voyantjs/db@0.6.7
- @voyantjs/hono@0.6.7
- @voyantjs/utils@0.6.7

## 0.6.6

### Patch Changes

- @voyantjs/core@0.6.6
- @voyantjs/db@0.6.6
- @voyantjs/hono@0.6.6
- @voyantjs/utils@0.6.6

## 0.6.5

### Patch Changes

- ae9933b: Align booking group and booking group member indexes with the actual parent-and-created-at list query shapes used by rooming and shared-booking group management.
  - @voyantjs/core@0.6.5
  - @voyantjs/db@0.6.5
  - @voyantjs/hono@0.6.5
  - @voyantjs/utils@0.6.5

## 0.6.4

### Patch Changes

- @voyantjs/core@0.6.4
- @voyantjs/db@0.6.4
- @voyantjs/hono@0.6.4
- @voyantjs/utils@0.6.4

## 0.6.3

### Patch Changes

- Updated dependencies [d3c6937]
  - @voyantjs/core@0.6.3
  - @voyantjs/db@0.6.3
  - @voyantjs/hono@0.6.3
  - @voyantjs/utils@0.6.3

## 0.6.2

### Patch Changes

- @voyantjs/core@0.6.2
- @voyantjs/db@0.6.2
- @voyantjs/hono@0.6.2
- @voyantjs/utils@0.6.2

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

  `@voyantjs/bookings`: new `bookingGroups` and `bookingGroupMembers` tables (TypeID prefixes `bkgr` / `bkgm`), service functions for CRUD plus reverse lookup, unified traveler list across members, and automatic group dissolution when a cancellation leaves ≤1 active members. New routes under `/v1/bookings/groups` plus the REST-nested `GET /v1/bookings/:id/group`.

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
