---
"@voyantjs/bookings": patch
"@voyantjs/finance": patch
"@voyantjs/finance-react": patch
"@voyantjs/products": patch
"@voyantjs/products-react": patch
---

Republish the public storefront package surfaces so published tarballs match the
current source tree. This release restores the public finance schemas needed by
`@voyantjs/finance-react`, publishes the public booking and product service
exports already present in source, and ships the day/version/media product React
exports from the package root.
