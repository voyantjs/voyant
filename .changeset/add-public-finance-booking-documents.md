---
"@voyantjs/finance": patch
"@voyantjs/finance-react": patch
---

Add a booking-scoped public finance document surface for invoice and proforma
downloads.

`@voyantjs/finance` now exposes a public booking documents route that returns
customer-safe invoice and proforma document metadata, including the best
available rendition status and download URL when a ready rendition has a public
or signed URL. `@voyantjs/finance-react` now exposes matching schemas, query
keys, query options, operations, and a `usePublicBookingDocuments` hook.
