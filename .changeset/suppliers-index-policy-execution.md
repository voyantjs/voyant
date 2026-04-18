---
"@voyantjs/suppliers": patch
---

Align supplier child-list indexes with the actual parent-and-sort query shapes used for services, rates, notes, availability, and contracts, and add a supplier-owned directory projection so supplier reads no longer hydrate identity data from three cross-module tables on every list and detail fetch.
