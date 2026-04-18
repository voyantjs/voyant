---
"@voyantjs/core": patch
"@voyantjs/db": patch
"@voyantjs/notifications": patch
---

Add a narrow execution lock surface and use it to serialize worker-driven notification reminder sweeps across processes.
