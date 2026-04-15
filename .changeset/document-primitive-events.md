---
"@voyantjs/legal": patch
"@voyantjs/finance": patch
"@voyantjs/notifications": patch
---

Add optional event-bus hooks around document primitives.

- `@voyantjs/legal` contract document generation routes/services can now emit
  `contract.document.generated`
- `@voyantjs/finance` invoice document generation can emit
  `invoice.document.generated`, and settlement reconciliation can emit
  `invoice.settled`
- `@voyantjs/notifications` booking document sends can emit
  `booking.documents.sent`

These stay at the primitive layer so apps can orchestrate their own document
policies without Voyant owning the full workflow.
