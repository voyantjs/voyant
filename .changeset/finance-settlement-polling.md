---
"@voyantjs/finance": patch
"@voyantjs/plugin-smartbill": patch
---

Add first-class invoice settlement polling and reconciliation.

- add `POST /v1/admin/finance/invoices/:id/poll-settlement` with typed polling
  and reconciliation results
- sync provider settlement state back onto `invoice_external_refs`
- reconcile newly observed paid amounts into completed Voyant payments without
  over-applying across multiple provider refs
- add `createSmartbillInvoiceSettlementPoller()` in
  `@voyantjs/plugin-smartbill`
