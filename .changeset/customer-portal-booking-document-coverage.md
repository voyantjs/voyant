---
"@voyantjs/customer-portal": patch
---

Expand customer-portal booking document coverage.

- include booking-linked contract attachments in
  `/v1/public/customer-portal/bookings/:bookingId/documents` when they have a
  customer-safe download URL
- include booking-linked invoice and proforma renditions in that same document
  list when a customer-safe download URL exists
- add a `source` discriminator plus `mimeType` and `reference` fields to the
  customer-portal booking document schema
