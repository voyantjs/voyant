---
"@voyantjs/products": patch
---

Add a first-class product brochure workflow.

Products now support canonical brochure persistence via `GET/PUT/DELETE
/v1/products/:id/brochure` and `GET /v1/public/products/:id/brochure`, with
public catalog detail exposing `brochure` separately from the normal media
gallery. The package also exports `generateAndStoreProductBrochure()` so apps
can generate a PDF brochure, upload it through a Voyant storage provider, and
register it as the canonical brochure without keeping an app-local convention.
