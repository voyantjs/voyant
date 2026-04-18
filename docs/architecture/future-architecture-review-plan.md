# Voyant Future Architecture Review Plan

This document does not promote the deferred ideas in
[`future-architecture-considerations.md`](./future-architecture-considerations.md)
into active scope.

Its purpose is narrower:

- define the order in which deferred items should be reconsidered
- state what evidence is required before promoting one
- constrain the first implementation slice so it stays small and honest

Rule:

When one of the deferred areas becomes relevant, revisit it through this plan
instead of turning all deferred ideas into simultaneous scope.

## Review Order

### 1. Advanced constraint and index policy

Why first:

- it is the lowest-risk deferred area
- it can improve correctness and performance without adding a new runtime
  subsystem
- it fits naturally with
  [`data-model-schema-authoring.md`](./data-model-schema-authoring.md)

Promotion evidence:

- repeated slow-query patterns in production or staging
- multiple packages converging on the same ad hoc composite or partial indexes
- recurring schema review comments about check constraints or index shape

First executable slice:

- extend the schema authoring guide with explicit index and constraint policy
- audit a small set of high-value queries and map them to index guidance
- add package-level examples instead of introducing a framework-wide abstraction

Do not do first:

- a general schema optimization engine
- package-generated index synthesis
- formal index metadata in module contracts

### 2. Locking and concurrency control as a first-class subsystem

Why second:

- it is the most likely operational pressure point once workflows and daemons
  grow
- it already has adjacent boundaries in
  [`caching-architecture.md`](./caching-architecture.md) and
  [`execution-architecture.md`](./execution-architecture.md)

Promotion evidence:

- real daemon ownership collisions
- duplicate long-running workflow side effects
- recurring need for distributed coordination that ordinary database locking
  cannot express cleanly

First executable slice:

- define a narrow shared lock contract for one concrete use case
- provide an in-memory adapter for local/dev and a Postgres adapter for real
  deployments
- apply it to a single daemon or workflow ownership path

Do not do first:

- a universal distributed coordination framework
- Redis-only semantics disguised as a portable primitive
- lock usage in unrelated code paths "just in case"

### 3. Event priority and durable queued event processing

Why third:

- it depends on concrete execution pressure, not just event taxonomy
- priority is only meaningful once durable queued delivery exists

Promotion evidence:

- in-process delivery becomes unreliable for real workloads
- a business-critical event class needs stronger retry/delivery behavior
- throughput or isolation concerns appear between low-importance and
  high-importance event work

First executable slice:

- introduce one durable queue-backed execution path for one event family
- keep the envelope portable and runtime-specific semantics explicit
- defer event priority until durable delivery exists and has proven value

Do not do first:

- a generalized priority matrix for all events
- vendor-specific queue semantics hidden behind fake portability
- moving all event delivery to a queue before one event family justifies it

### 4. Asymmetric signing / JWKS-style auth distribution

Why fourth:

- it introduces real security and operational surface area
- the current Better Auth shared-secret model remains simpler and sufficient

Promotion evidence:

- multiple services need to verify Voyant-issued tokens independently
- external consumers need verification without shared secrets
- key rotation becomes an active operational requirement instead of a future
  possibility

First executable slice:

- define a signing-key abstraction and rotation plan
- add JWKS publishing only if an external verifier actually exists
- keep the current session model intact for deployments that do not need this

Do not do first:

- replacing all session handling with JWT-first architecture
- cross-service auth redesign without an actual multi-service verifier surface
- exposing JWKS just because it is a familiar pattern

### 5. Custom link metadata and richer relationship records

Why fifth:

- the current link model already covers the baseline use cases
- richer relationship records add API, query, and migration complexity

Promotion evidence:

- repeated demand for edge-specific labels, timestamps, or configuration
- cross-module workflows that need metadata on the relationship itself instead
  of either endpoint
- query/read-model pressure that cannot be expressed cleanly with the current
  link shape

First executable slice:

- add optional metadata to one relationship family with one real use case
- document the query and mutation behavior explicitly
- keep the record shape narrow instead of introducing a graph-style API

Do not do first:

- generic relationship-schema builders
- arbitrary metadata payloads across every link in the platform
- graph database style semantics layered onto the current model

### 6. Cross-module indexing and projection infrastructure

Why last:

- it is the broadest and most expensive deferred area
- it depends on real workload evidence and likely on whichever linked-read
  pressures remain after the simpler model matures

Promotion evidence:

- repeated slow cross-module traversals on real workloads
- search/read models that cannot be supported acceptably with the current
  application-layer traversal defaults
- clear evidence that one or more projections materially reduce product latency
  or query cost

First executable slice:

- build one projection for one concrete expensive read path
- define freshness, rebuild, and ownership behavior for that single projection
- measure before and after rather than building a platform-wide projection
  framework up front

Do not do first:

- a universal projection engine
- broad denormalization infrastructure without a target read model
- implicit background indexing for every cross-module relationship

## Review Procedure

When revisiting one of these items:

1. Confirm the simpler current model is causing real friction.
2. Collect concrete evidence from workload, product behavior, or repeated code
   review pressure.
3. Promote one item only.
4. Define the smallest executable slice that proves the need.
5. Update the relevant active architecture document only after that slice is
   accepted.

Rule:

Move one deferred item into active scope at a time. Do not reopen the entire
future-architecture list as a batch.
