---
"@voyantjs/legal": patch
"@voyantjs/finance": patch
---

Add storage-backed document generator helpers for legal and finance workflows.

`@voyantjs/legal` now exports `createStorageBackedContractDocumentGenerator()`
and `defaultStorageBackedContractDocumentSerializer()` so rendered contract
artifacts can be uploaded through Voyant storage providers without custom
generator plumbing.

`@voyantjs/finance` now exports
`createStorageBackedInvoiceDocumentGenerator()` and
`defaultStorageBackedInvoiceDocumentSerializer()` for the same workflow on
invoice/proforma renditions, with built-in support for html/json/xml artifact
uploads and explicit opt-in for custom PDF serializers.
