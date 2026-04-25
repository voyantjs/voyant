---
"@voyantjs/finance": patch
"@voyantjs/bookings": patch
"@voyantjs/transactions": patch
---

Add Postgres `CHECK` constraints across finance, bookings, and transactions schemas to enforce: if any `*_amount_cents` column is set, its companion currency column must also be set.

Two flavours, depending on column shape:

- **Strict XNOR** (`(currency IS NULL) = (amount IS NULL)`) — one currency to one amount: `booking_guarantees`, `booking_item_commissions`, `payments` (base).
- **Implication** (`(amounts NULL) OR (currency NOT NULL)`) — one currency covering multiple amount columns: `bookings.base_currency`, `booking_items.cost_currency`, `offer_items.cost_currency`, `order_items.cost_currency`, `invoices.base_currency`.

The implication form intentionally allows "currency without amount" because the currency may be pre-declared before line items roll up.
