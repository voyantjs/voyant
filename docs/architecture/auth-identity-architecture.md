# Voyant Auth And Identity Architecture

This guide defines how Voyant should treat authentication, identity, and
request actor context.

The goal is simple:

- keep auth as a shared infrastructure surface
- separate session identity from workspace/actor authorization
- keep module routes and services consuming shared auth context instead of
  rebuilding it
- keep identity storage and user preferences reusable across admin and public
  surfaces

Auth should be a framework capability, not a package-local pattern.

## Core Rules

### 1. Authentication should be shared infrastructure

Voyant should treat authentication as shared runtime infrastructure.

That includes:

- session resolution
- authenticated user identity
- request actor context
- API-level unauthorized handling

Modules and routes should consume that shared context, not invent their own
auth mechanisms.

Rule:

Auth belongs in shared runtime infrastructure, not inside individual domain
packages.

### 2. Identity and authorization are not the same thing

Voyant should distinguish between:

- who the user is
- what workspace/organization they act in
- what permissions they have

Those are related but separate concerns.

Examples:

- a signed-in user identity
- an active organization or actor context
- permission checks for admin actions

Rule:

Do not collapse identity, actor selection, and permission checks into one
generic auth concept.

### 3. Session auth should remain the default primary model

For Voyant admin and authenticated public surfaces, session-based auth should
remain the primary default.

That aligns with:

- Better Auth
- the shared authenticated-user flows
- admin and customer-portal runtime expectations

Rule:

Session auth should stay the default model unless a route explicitly needs a
different boundary such as internal or machine auth.

## Request Context

### 4. Routes should consume shared request identity helpers

Routes should use the shared request helpers and middleware surface for auth,
not read ad hoc request state directly.

Examples:

- `requireUserId(...)`
- shared auth middleware
- actor-aware middleware
- permission guards

Rule:

Routes should consume shared auth/request helpers instead of open-coded auth
branches.

### 5. Actor context should be explicit when routes depend on workspace state

Some routes only need a signed-in user.
Others need a resolved actor or workspace context.

Those should remain separate concepts.

Rule:

Use actor-aware middleware and guards only when the route genuinely depends on
workspace or actor context.

### 6. Permission checks should be narrower than auth

Permission checks are an authorization concern layered on top of auth and actor
resolution.

They should stay explicit and route-scoped.

Rule:

Do not treat every authenticated route as a permission-checked route by
default.

## Identity Storage

### 7. User profile data should stay reusable across surfaces

Voyant user identity/profile data should support both:

- admin/runtime preferences
- public/customer-facing identity reads and updates

Examples:

- locale
- timezone
- billing/contact preferences
- traveler identity/document data where appropriate

Rule:

Identity storage should remain a shared capability that multiple product
surfaces can use safely.

### 8. UI locale and business-content locale are separate

Admin UI locale should not be treated as the same concern as product-content
translations.

The auth/identity surface should support storing user-level locale/timezone
preferences so the admin runtime can resolve them cleanly.

Rule:

User preferences should support runtime presentation without being confused for
content translation ownership.

## Public And Internal Boundaries

### 9. Public auth surfaces should stay explicit

Public authenticated routes should remain clearly separated from:

- unauthenticated public APIs
- admin APIs
- internal-only routes

That keeps the transport boundary easy to reason about.

Rule:

Authentication should not blur the admin/public/internal route split.

### 10. Internal or machine auth should stay distinct from session auth

If Voyant adds or expands internal service auth, machine auth, or signed
request boundaries, that should be treated as a separate concern from standard
user sessions.

Rule:

Do not overload user-session auth to cover every non-user access pattern.

## Product Guidance

### 11. Templates should compose the auth surface, not redefine it

Starter templates may:

- choose auth UI
- decide how the auth runtime is mounted
- provide app-level session or workspace flows

But they should not redefine the core auth and identity model in incompatible
ways.

Rule:

Templates compose the shared auth surface; they should not create a second auth
architecture.

### 12. Modules should rely on shared auth contracts

Domain modules should assume:

- request auth has already been resolved
- the route layer can supply authenticated user or actor context
- shared auth errors and guards exist

They should not own package-specific auth models.

Rule:

Domain modules should consume shared auth context rather than implement their
own auth semantics.

## Practical Checklist

When adding auth-sensitive functionality in Voyant:

1. Decide whether the route needs signed-in identity, actor context, or a
   permission check.
2. Use the shared auth middleware and helpers for that level of need.
3. Keep session auth as the default for user-facing authenticated surfaces.
4. Keep internal/machine auth separate from user-session auth.
5. Reuse shared identity/profile storage for runtime preferences and customer
   identity data where appropriate.
6. Do not rebuild auth semantics inside the module itself.

## Non-Goals

This guide does not introduce:

- a replacement auth provider
- a new permission system
- a claim that every authenticated route needs the same authorization depth

The point is a clear shared auth and identity model, not a larger auth
framework.
