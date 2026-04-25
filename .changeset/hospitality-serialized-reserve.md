---
"@voyantjs/hospitality": minor
---

Extend `hospitalityService.reserveStay` to dispatch by the room type's `inventoryMode`. Pooled-mode (existing) decrements `room_inventory` per-night; serialized-mode (new) picks a specific `room_unit` and binds the stay to it.

Serialized-mode flow inside `db.transaction`:

1. Find the first available unit for (roomTypeId, date range) via a single query that excludes:
   - units in non-active status
   - units covered by an active `room_blocks` entry (per-unit OR property-wide roomType block) whose date range overlaps
   - units covered by an active `maintenance_blocks` entry on the same logic
   - units already in a `reserved` or `checked_in` `stay_booking_items` whose date range overlaps
2. `SELECT ... FOR UPDATE` the chosen unit so concurrent reserves on the same physical room serialize through the row lock.
3. Insert `stay_booking_items` with `roomUnitId` set.
4. Insert `stay_daily_rates`.

If no unit qualifies → `{ status: "no_unit_available" }`.
