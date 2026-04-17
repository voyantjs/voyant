# Voyant Storefront And Public Contract Architecture

This guide defines how Voyant should treat the customer-facing storefront and
the broader public API surface.

The goal is simple:

- keep `storefront` as the customer-facing product/runtime concept
- keep `/v1/public/*` as the external-facing HTTP boundary
- separate public contracts from admin CRUD semantics
- keep the final storefront application template-owned while the shared public
  contract remains framework-owned

Storefront should be a first-class framework surface, not just a set of public
routes.

## Core Rules

### 1. Keep `storefront` as the customer-facing package concept

In Voyant, `storefront` should remain the product/runtime term for the
customer-facing discovery and booking experience.

That includes things like:

- catalog browsing
- departure detail
- pricing preview
- booking-session flows
- customer-facing extensions and itinerary reads

Rule:

Use `storefront` as the package/runtime concept for the customer-facing
experience.

### 2. Keep `/v1/public/*` as the HTTP umbrella

The HTTP transport boundary should stay:

- `/v1/admin/*` for staff/operator surfaces
- `/v1/public/*` for external-facing surfaces

`storefront` should not become a second nested HTTP namespace like
`/v1/public/storefront/*` by default.

Rule:

Keep `public` as the HTTP boundary and `storefront` as the product/runtime
concept.

### 3. Public routes should be capability-based

Public routes should be grouped by business capability:

- products
- pricing
- bookings
- finance
- customer portal

They should not be shaped around which frontend happens to call them.

Rule:

Public HTTP paths describe capabilities, not applications.

## Public Contract

### 4. Public contracts should stay separate from admin CRUD semantics

Public customer-facing APIs should not simply leak admin service shapes,
internal CRUD records, or admin workflows.

The public contract should be designed around:

- customer-facing reads
- booking/session flows
- pricing previews
- safe public document/payment surfaces

Rule:

Public contracts should be customer-facing by design, not admin APIs exposed by
accident.

### 5. Public contracts should be typed and reusable

Voyant should continue exposing public/storefront contracts through shared
packages and typed runtime helpers.

That means:

- public route contracts in shared packages
- typed React/runtime helpers for storefront consumers
- no forced app-local wrappers when the shared contract already exists

Rule:

The shared storefront/public contract should be reusable and typed, not
template-local glue.

### 6. Public context should stay explicit

Public contract behavior may depend on context such as:

- locale
- market
- channel
- customer/session identity when authenticated

That context should be explicit in the public contract and routing model instead
of hidden as template-local behavior.

Rule:

Storefront/public behavior should make locale/market/channel context explicit
when it affects the contract.

## Frontend Layering

### 7. Keep the frontend split clear

Voyant already has distinct frontend layers that should remain separate:

- public/storefront contract packages
- shared React/runtime packages
- source-installed UI blocks
- app/template-owned final storefront shell

These are complementary layers, not competing strategies.

Rule:

Keep public contracts, runtime hooks, UI blocks, and final storefront apps as
distinct layers.

### 8. Preserve the source-installed UI strategy

Voyant should keep the registry/source-installed block approach for storefront
UI.

That gives teams editable storefront presentation while the framework still
owns:

- the public contract
- the runtime hooks/providers
- the core route semantics

Rule:

Editable UI blocks remain part of the storefront strategy and should not be
replaced with a more opaque frontend system.

## Template Ownership

### 9. Storefront apps should remain template-owned

The final storefront application should remain app/template-owned.

That includes:

- brand expression
- final route composition
- page layout
- custom public UI flows

Voyant should own the contract and runtime surfaces beneath it, not the entire
frontend product.

Rule:

The final storefront UX is template-owned even when the shared public contract
is framework-owned.

### 10. Shared public contracts should reduce app-local compatibility code

When a shared public/storefront contract exists upstream, downstream apps should
not need local wrappers just to consume it.

The purpose of the shared storefront surface is to reduce:

- app-local adapters
- duplicated public fetchers
- inconsistent payload shaping

Rule:

The public/storefront package surface should aim to remove local compatibility
layers, not create more of them.

## Practical Checklist

When adding or reviewing a storefront/public capability:

1. Decide whether it belongs in the shared public contract or only in an
   app/template.
2. Keep the HTTP surface under `/v1/public/*`.
3. Keep `storefront` as the package/runtime term, not a nested HTTP namespace.
4. Shape the public payload around customer-facing needs, not admin CRUD.
5. Make market/locale/channel context explicit when it affects the contract.
6. Keep the final storefront shell template-owned.
7. Preserve the source-installed UI strategy for editable presentation.

## Non-Goals

This guide does not introduce:

- a closed turnkey storefront product
- a second HTTP namespace for `storefront`
- a replacement for the source-installed UI/block strategy

The point is a clear shared storefront/public contract, not a more rigid
frontend platform.
