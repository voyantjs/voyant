---
"@voyantjs/db": patch
"@voyantjs/core": patch
"@voyantjs/crm": patch
"@voyantjs/finance": patch
"@voyantjs/legal": patch
"@voyantjs/transactions": patch
---

Standardize TypeID prefixes to a first-N-chars convention for better DX.

Root entities now use the shortest unambiguous first-N chars of the entity name
(e.g. `pers` instead of `prsn`, `org` instead of `orgn`). Child entities use a
2-char module code plus 2-char suffix. 19 prefixes renamed in total.
