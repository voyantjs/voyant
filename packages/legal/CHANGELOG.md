# @voyantjs/legal

## 0.6.6

### Patch Changes

- @voyantjs/core@0.6.6
- @voyantjs/crm@0.6.6
- @voyantjs/db@0.6.6
- @voyantjs/hono@0.6.6
- @voyantjs/voyant-storage@0.6.6
- @voyantjs/suppliers@0.6.6
- @voyantjs/utils@0.6.6

## 0.6.5

### Patch Changes

- @voyantjs/core@0.6.5
- @voyantjs/crm@0.6.5
- @voyantjs/db@0.6.5
- @voyantjs/hono@0.6.5
- @voyantjs/voyant-storage@0.6.5
- @voyantjs/suppliers@0.6.5
- @voyantjs/utils@0.6.5

## 0.6.4

### Patch Changes

- Updated dependencies [d6c4022]
  - @voyantjs/core@0.6.4
  - @voyantjs/crm@0.6.4
  - @voyantjs/db@0.6.4
  - @voyantjs/hono@0.6.4
  - @voyantjs/voyant-storage@0.6.4
  - @voyantjs/suppliers@0.6.4
  - @voyantjs/utils@0.6.4

## 0.6.3

### Patch Changes

- Updated dependencies [d3c6937]
  - @voyantjs/core@0.6.3
  - @voyantjs/crm@0.6.3
  - @voyantjs/db@0.6.3
  - @voyantjs/hono@0.6.3
  - @voyantjs/voyant-storage@0.6.3
  - @voyantjs/suppliers@0.6.3
  - @voyantjs/utils@0.6.3

## 0.6.2

### Patch Changes

- @voyantjs/core@0.6.2
- @voyantjs/crm@0.6.2
- @voyantjs/db@0.6.2
- @voyantjs/hono@0.6.2
- @voyantjs/voyant-storage@0.6.2
- @voyantjs/suppliers@0.6.2
- @voyantjs/utils@0.6.2

## 0.6.1

### Patch Changes

- @voyantjs/core@0.6.1
- @voyantjs/crm@0.6.1
- @voyantjs/db@0.6.1
- @voyantjs/hono@0.6.1
- @voyantjs/voyant-storage@0.6.1
- @voyantjs/suppliers@0.6.1
- @voyantjs/utils@0.6.1

## 0.6.0

### Patch Changes

- @voyantjs/core@0.6.0
- @voyantjs/crm@0.6.0
- @voyantjs/db@0.6.0
- @voyantjs/hono@0.6.0
- @voyantjs/voyant-storage@0.6.0
- @voyantjs/suppliers@0.6.0
- @voyantjs/utils@0.6.0

## 0.5.0

### Patch Changes

- Updated dependencies [ce72e29]
  - @voyantjs/core@0.5.0
  - @voyantjs/crm@0.5.0
  - @voyantjs/db@0.5.0
  - @voyantjs/hono@0.5.0
  - @voyantjs/voyant-storage@0.5.0
  - @voyantjs/suppliers@0.5.0
  - @voyantjs/utils@0.5.0

## 0.4.5

### Patch Changes

- e3f6e72: Standardize TypeID prefixes to a first-N-chars convention for better DX.

  Root entities now use the shortest unambiguous first-N chars of the entity name
  (e.g. `pers` instead of `prsn`, `org` instead of `orgn`). Child entities use a
  2-char module code plus 2-char suffix. 19 prefixes renamed in total.

- Updated dependencies [e3f6e72]
  - @voyantjs/core@0.4.5
  - @voyantjs/crm@0.4.5
  - @voyantjs/db@0.4.5
  - @voyantjs/hono@0.4.5
  - @voyantjs/voyant-storage@0.4.5
  - @voyantjs/suppliers@0.4.5
  - @voyantjs/utils@0.4.5

## 0.4.4

### Patch Changes

- @voyantjs/core@0.4.4
- @voyantjs/crm@0.4.4
- @voyantjs/db@0.4.4
- @voyantjs/hono@0.4.4
- @voyantjs/voyant-storage@0.4.4
- @voyantjs/suppliers@0.4.4
- @voyantjs/utils@0.4.4

## 0.4.3

### Patch Changes

- @voyantjs/core@0.4.3
- @voyantjs/crm@0.4.3
- @voyantjs/db@0.4.3
- @voyantjs/hono@0.4.3
- @voyantjs/voyant-storage@0.4.3
- @voyantjs/suppliers@0.4.3
- @voyantjs/utils@0.4.3

## 0.4.2

### Patch Changes

- 8de4602: Add optional event-bus hooks around document primitives.

  - `@voyantjs/legal` contract document generation routes/services can now emit
    `contract.document.generated`
  - `@voyantjs/finance` invoice document generation can emit
    `invoice.document.generated`, and settlement reconciliation can emit
    `invoice.settled`
  - `@voyantjs/notifications` booking document sends can emit
    `booking.documents.sent`

  These stay at the primitive layer so apps can orchestrate their own document
  policies without Voyant owning the full workflow.

  - @voyantjs/core@0.4.2
  - @voyantjs/crm@0.4.2
  - @voyantjs/db@0.4.2
  - @voyantjs/hono@0.4.2
  - @voyantjs/voyant-storage@0.4.2
  - @voyantjs/suppliers@0.4.2
  - @voyantjs/utils@0.4.2

## 0.4.1

### Patch Changes

- @voyantjs/core@0.4.1
- @voyantjs/crm@0.4.1
- @voyantjs/db@0.4.1
- @voyantjs/hono@0.4.1
- @voyantjs/voyant-storage@0.4.1
- @voyantjs/suppliers@0.4.1
- @voyantjs/utils@0.4.1

## 0.4.0

### Patch Changes

- e84fe0f: Add built-in PDF document adapters for legal and finance workflows.

  `@voyantjs/utils` now exports `renderPdfDocument()` as a shared basic PDF
  renderer for rendered text content. `@voyantjs/legal` and `@voyantjs/finance`
  now expose bundled PDF serializers and generator helpers on top of their
  storage-backed document workflows, so apps can generate readable PDF artifacts
  without wiring a custom browser renderer for the common case.

- e84fe0f: Add a first-class contract document generation workflow to legal.

  - add configurable admin routes for `generate-document` and
    `regenerate-document`
  - add `createLegalHonoModule()` so apps can mount legal with a document
    generator
  - generate and replace canonical `contract_attachments` rows for rendered
    contract artifacts
  - expose the new document-generation schemas and route factories from the
    package entrypoint

- e84fe0f: Upgrade legal and finance template rendering to support Liquid-style control
  flow.

  - add a shared structured template renderer in `@voyantjs/utils`
  - keep simple `{{path}}` interpolation compatibility for existing templates
  - support Liquid loops, conditionals, and filters in legal and finance
    html/markdown templates
  - support Liquid rendering inside lexical text nodes for legal and finance
    template bodies

- e84fe0f: Add storage-backed document generator helpers for legal and finance workflows.

  `@voyantjs/legal` now exports `createStorageBackedContractDocumentGenerator()`
  and `defaultStorageBackedContractDocumentSerializer()` so rendered contract
  artifacts can be uploaded through Voyant storage providers without custom
  generator plumbing.

  `@voyantjs/finance` now exports
  `createStorageBackedInvoiceDocumentGenerator()` and
  `defaultStorageBackedInvoiceDocumentSerializer()` for the same workflow on
  invoice/proforma renditions, with built-in support for html/json/xml artifact
  uploads and explicit opt-in for custom PDF serializers.

- Updated dependencies [e84fe0f]
- Updated dependencies [e84fe0f]
- Updated dependencies [2d5f323]
- Updated dependencies [e84fe0f]
  - @voyantjs/core@0.4.0
  - @voyantjs/crm@0.4.0
  - @voyantjs/db@0.4.0
  - @voyantjs/hono@0.4.0
  - @voyantjs/voyant-storage@0.4.0
  - @voyantjs/suppliers@0.4.0
  - @voyantjs/utils@0.4.0

## 0.3.1

### Patch Changes

- 8566f2d: Advance the public storefront surface with phone contact-exists support in the
  customer portal, default-template and preview helpers in legal, localized slug
  and SEO catalog fields in products, and a new config-backed storefront settings
  module for booking/account pages.
- Updated dependencies [8566f2d]
- Updated dependencies [8566f2d]
  - @voyantjs/core@0.3.1
  - @voyantjs/crm@0.3.1
  - @voyantjs/db@0.3.1
  - @voyantjs/hono@0.3.1
  - @voyantjs/suppliers@0.3.1

## 0.3.0

### Patch Changes

- @voyantjs/core@0.3.0
- @voyantjs/crm@0.3.0
- @voyantjs/db@0.3.0
- @voyantjs/hono@0.3.0
- @voyantjs/suppliers@0.3.0

## 0.2.0

### Patch Changes

- @voyantjs/core@0.2.0
- @voyantjs/crm@0.2.0
- @voyantjs/db@0.2.0
- @voyantjs/hono@0.2.0
- @voyantjs/suppliers@0.2.0

## 0.1.1

### Patch Changes

- @voyantjs/core@0.1.1
- @voyantjs/crm@0.1.1
- @voyantjs/db@0.1.1
- @voyantjs/hono@0.1.1
- @voyantjs/suppliers@0.1.1
