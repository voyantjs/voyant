---
"@voyantjs/bookings": patch
"@voyantjs/bookings-react": patch
"@voyantjs/customer-portal": patch
"@voyantjs/customer-portal-react": patch
"@voyantjs/transactions": patch
---

Continue the traveler-first booking contract cleanup across the published booking surfaces while preserving compatibility aliases.

- `@voyantjs/bookings`: add traveler-first public aliases for booking travel details, group traveler routes, public booking-session traveler input, and traveler-facing validation/error wording while keeping legacy participant/passenger compatibility routes and schemas.
- `@voyantjs/bookings-react`: make traveler hooks, query options, schemas, and exports the primary surface again; keep passenger/item-participant names as compatibility aliases instead of separate primaries.
- `@voyantjs/customer-portal` and `@voyantjs/customer-portal-react`: move booking import schemas, operations, and exports to traveler-first names while preserving legacy participant aliases and routes.
- `@voyantjs/transactions`: expose traveler-first request/response aliases and traveler route aliases for offer/order traveler and item-traveler flows while preserving legacy participant compatibility endpoints.
- `@voyantjs/auth-react`: add exported query keys, query options, and schemas for current workspace, organization members, and organization invitations so app surfaces can consume the auth workspace contract directly.
- `@voyantjs/products` and `@voyantjs/products-react`: tighten the itinerary-facing public surface and query/schema exports used by the shared product itinerary UI.
- `@voyantjs/legal` and `@voyantjs/notifications`: keep template authoring and Liquid exports available from the package roots while aligning the notification/template surface with the updated booking traveler contract.
- Supporting packages and tests also picked up repo-wide import-order, lint, and small compatibility cleanups across auth, booking requirements, checkout, octo, pricing, sellability, storefront, and utilities as part of bringing the whole worktree back to a green release state.
- Align the touched app/template compatibility wrappers with the new primary traveler and workspace surfaces, and keep repo `typecheck` / `lint` green after the broader cleanup.
