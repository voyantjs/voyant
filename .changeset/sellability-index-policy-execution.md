---
"@voyantjs/sellability": patch
---

Align sellability schema indexes with the active index policy by replacing
decorative single-column list indexes with parent-and-sort composite indexes
for snapshot items, policy results, explanations, and offer lifecycle runs.
