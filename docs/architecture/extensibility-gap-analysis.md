# Voyant Extensibility Gap Analysis

This document translates the extensibility rubric into the remaining active
cleanup backlog for the codebase.

The major architecture doctrine is now documented. The main remaining gaps are
less about philosophy and more about code adoption, package discipline, and
runtime consistency.

For the umbrella principles, see
[Voyant Extensibility Rubric](./extensibility-rubric.md).

## Summary

Voyant is already broadly aligned with the intended architecture:

- real module boundaries exist
- extensions are first-class
- provider-style seams exist in places like notifications and checkout
- templates own app assembly instead of pushing everything into framework core
- UI blocks and `-react` runtime packages are already split cleanly

The main remaining work is to make the codebase consistently behave the way the
docs now describe.

## Active Gap Categories

### 1. Package Taxonomy Adoption

The docs now distinguish modules, providers, adapters, extensions, and plugin
bundles clearly. The codebase and package docs still need to reflect that more
consistently.

Remaining work:

- audit `packages/plugins/*` and describe each package by its real runtime role
- reduce unnecessary “plugin-first” language in package READMEs and examples
- make provider terminology more consistent across packages

### 2. Runtime Seam Hardening

Several important seams already exist in code, but not all of them are yet
uniformly presented or adopted.

Remaining work:

- keep formalizing provider registries where a module has real implementation
  variance
- keep using bootstrap-time validation for runtime options where packages still
  fail lazily
- continue moving routes and integrations toward the shared auth/validation/error
  helpers

### 3. Admin Surface Adoption

The admin runtime, localization model, and extension surface are now clearly
documented. More package and template code should adopt those shared seams.

Remaining work:

- move more operator UI composition onto the shared admin runtime and extension
  contracts
- add more real module contributions through widgets/routes/nav instead of only
  template-local composition
- keep admin localization flowing through the shared runtime rather than
  package-local UI state

### 4. Storefront/Public Contract Adoption

The public/storefront contract is now clearly defined. More code should align
to that model consistently.

Remaining work:

- keep public payloads customer-facing instead of leaking admin CRUD semantics
- remove remaining app-local compatibility wrappers where the shared public
  contract is already strong enough
- keep `/v1/public/*` and the `storefront` package/runtime naming consistent

### 5. Storage And Document Access Adoption

The storage split is now clearly documented and partially implemented.

Remaining work:

- continue removing persisted signed URL assumptions where durable storage keys
  are the better source of truth
- keep document delivery explicit and separate from public media serving
- propagate the media/documents split consistently across generators, routes,
  and attachments

### 6. Notification Surface Adoption

The notification architecture is in decent shape, but the codebase should keep
converging on the documented send model.

Remaining work:

- keep specialized notification flows as wrappers over one canonical send
  surface
- keep workflow-triggered delivery using the shared notification service
- keep sensitive attachment access resolved at send time

### 7. Execution Model Adoption

Workflows, schedules, and daemons now have a clearer conceptual split. The
remaining work is in applying that split consistently.

Remaining work:

- keep orchestration logic out of module internals where it belongs in workflow
  surfaces
- avoid flattening long-running daemon-style concerns into generic workflow
  semantics
- keep runtime selection explicit by execution class rather than by one
  universal engine

## Recommended Next Code Slices

The next code-focused cleanup should favor small, shippable branches.

Recommended order:

1. provider/plugin taxonomy cleanup in package READMEs and exports
2. further admin extension-surface adoption in real operator pages
3. storefront/public contract cleanup where app-local wrappers still exist
4. continued storage/document-access hardening
5. further bootstrap-time option validation in packages that still fail lazily

## Definition Of Success

The cleanup is in good shape when:

- the codebase and package docs use the same vocabulary as the rubric
- major runtime seams are explicit and consistent
- admin and storefront/public surfaces feel like deliberate framework layers
- storage, notifications, auth, and execution concerns follow their documented
  contracts in code
- downstream apps need less compatibility glue to consume Voyant cleanly
