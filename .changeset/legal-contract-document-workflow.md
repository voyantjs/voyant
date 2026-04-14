---
"@voyantjs/legal": patch
---

Add a first-class contract document generation workflow to legal.

- add configurable admin routes for `generate-document` and
  `regenerate-document`
- add `createLegalHonoModule()` so apps can mount legal with a document
  generator
- generate and replace canonical `contract_attachments` rows for rendered
  contract artifacts
- expose the new document-generation schemas and route factories from the
  package entrypoint
