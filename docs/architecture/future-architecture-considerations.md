# Voyant Future Architecture Considerations

This document tracks architecture ideas that are worth keeping visible, but
that should stay out of the active cleanup and execution backlog for now.

The goal is simple:

- capture promising future work without treating it as current scope
- keep later-stage ideas visible and reviewable
- avoid bloating the active architecture surface before the basics are settled

These are not rejected ideas. They are deferred ideas.

For the disciplined review order and the "first real slice" to take when one of
these items becomes justified, see
[`future-architecture-review-plan.md`](./future-architecture-review-plan.md).

## Deferral Rules

An item belongs here when:

- it solves a real future problem but not an urgent current one
- the current framework can stay simpler without it
- it depends on runtime or scale assumptions that are not settled yet
- it would add meaningful surface area before the simpler baseline is fully in
  place

Rule:

If an idea is plausible but not yet necessary, track it here instead of turning
it into an active architecture requirement.

## Promoted Since Drafting

The following item has moved into active architecture guidance:

- advanced constraint and index policy
  see [`data-model-schema-authoring.md`](./data-model-schema-authoring.md) and
  [`index-and-constraint-policy.md`](./index-and-constraint-policy.md)
- locking and concurrency control policy
  see [`locking-and-concurrency-policy.md`](./locking-and-concurrency-policy.md)
- event delivery and durable execution policy
  see
  [`event-delivery-and-durable-execution-policy.md`](./event-delivery-and-durable-execution-policy.md)

## Deferred Areas

### 1. Custom link metadata and richer relationship records

Voyant links are already useful for cross-module associations.

A future enhancement may allow the relationship itself to carry additional
metadata, such as:

- role/label information
- edge-specific timestamps
- relationship-scoped configuration

This is useful, but not necessary to validate the current cross-module link and
query model.

Why deferred:

- the current link model already covers the core cross-module use cases
- richer link records increase API and query complexity

### 2. Cross-module indexing and projection infrastructure

Application-layer link/query traversal is the right current default.

At larger scale, Voyant may need a more explicit projection/indexing layer for:

- faster cross-module filtering
- search-oriented linked reads
- denormalized query performance

Why deferred:

- this is a scale/performance optimization problem, not a baseline architecture
  blocker
- it depends on real workload evidence

### 3. Asymmetric signing / JWKS-style auth distribution

Voyant’s current shared-secret session model is sufficient for the present auth
surface.

Future work may be justified when Voyant needs:

- cross-service token verification at scale
- external token consumers
- formal key rotation and JWKS distribution

Why deferred:

- current Better Auth and session usage do not require this complexity yet

## Review Guidance

When revisiting an item from this document, ask:

1. Is the current simpler model now causing real friction?
2. Do we have concrete workload or product evidence for the change?
3. Can the new primitive stay narrow instead of becoming a framework-wide
   abstraction leak?

If the answer is yes, the item may be ready to move into the active backlog.

## Non-Goals

This document is not:

- a roadmap commitment
- a promise that every item here will be built
- a dump for vague ideas with no architectural reason

The purpose is disciplined deferral, not an architecture wish list.
