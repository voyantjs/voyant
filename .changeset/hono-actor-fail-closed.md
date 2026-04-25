---
"@voyantjs/hono": major
---

**BREAKING:** `requireActor` middleware now returns `401 Unauthorized` when no actor is set on the request, instead of defaulting to `"staff"`.

Earlier versions silently granted operator privileges to anonymous traffic if `requireAuth` was missing, misordered, or a route mounted before auth. The fail-open default has been replaced with fail-closed.

**Migration:**

- `requireAuth` now sets `actor: "staff"` explicitly on the core-owned API key path (`voy_` prefix), so server-to-server integrations behave the same.
- Custom `auth.resolve` integrations that previously relied on the implicit `"staff"` fallback must now return an explicit `actor` from `resolve()`.
- Anonymous requests on `/v1/admin/*` now return `401` instead of `200`. Anonymous requests on `/v1/public/*` continue to receive `actor: "customer"` via the `publicPaths` bypass when applicable, and `401` otherwise.
- The differentiation between `401` (no actor) and `403` (actor not in the allowed list) is now reliable — earlier the no-actor path returned `403` for some surfaces and `200` for others.
