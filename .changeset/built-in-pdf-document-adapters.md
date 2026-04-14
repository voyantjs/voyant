---
"@voyantjs/utils": patch
"@voyantjs/legal": patch
"@voyantjs/finance": patch
---

Add built-in PDF document adapters for legal and finance workflows.

`@voyantjs/utils` now exports `renderPdfDocument()` as a shared basic PDF
renderer for rendered text content. `@voyantjs/legal` and `@voyantjs/finance`
now expose bundled PDF serializers and generator helpers on top of their
storage-backed document workflows, so apps can generate readable PDF artifacts
without wiring a custom browser renderer for the common case.
