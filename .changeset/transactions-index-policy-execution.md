---
"@voyantjs/transactions": patch
---

Align transaction child-list indexes with dominant parent-scoped query shapes
by replacing single-column parent indexes with composite parent-and-sort
indexes for offer participants, offer items, order participants, order items,
order item participants, and order terms.
