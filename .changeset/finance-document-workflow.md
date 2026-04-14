---
"@voyantjs/finance": patch
---

Add a first-class invoice and proforma document generation workflow.

- add configurable admin routes for `generate-document` and
  `regenerate-document`
- add `createFinanceHonoModule()` so apps can mount finance with an invoice
  document generator
- generate ready `invoice_renditions` and mark prior renditions of the same
  format as `stale`
- expose the new document-generation schemas and route factories from the
  package entrypoint
