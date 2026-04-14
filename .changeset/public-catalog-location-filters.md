---
"@voyantjs/products": patch
---

Add location-aware public catalog listing support.

Public catalog product list queries now support filtering by `locationTitle`,
`locationCity`, `locationCountryCode`, and `locationType`, and public catalog
product summaries now include typed `locations` so storefront list pages do not
need to hydrate full product detail just to render basic destination/location
metadata.
