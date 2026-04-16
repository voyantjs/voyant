---
"@voyantjs/availability": minor
"@voyantjs/availability-react": minor
---

Enrich availability list responses with product names via LEFT JOIN

Availability list endpoints (rules, start-times, slots, closeouts, pickup-points, meeting-configs) now return `productName` alongside the raw `productId`, resolved via a LEFT JOIN against a minimal products table reference. Operator UIs no longer need a secondary product lookup query just to render display labels. The `productNameById` utility in `@voyantjs/availability-react` now accepts the server-provided name as a third argument and falls back to the client-side lookup.
