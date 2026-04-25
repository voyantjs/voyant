---
"@voyantjs/hospitality": minor
---

Add `hospitalityService.reserveStay(db, input)` — atomic per-night inventory consumption for pooled-mode room types.

Inside one `db.transaction`:

1. Per-night `SELECT ... FOR UPDATE` against `room_inventory` for the date range, locks acquired in **date-sorted order** so concurrent reserves with overlapping ranges always grab locks in the same order — no deadlock.
2. Reject if any night is `stop_sell`, missing, or has `< roomCount` available.
3. Decrement `available_units`, increment `held_units` per night.
4. Insert the `stay_booking_items` row.
5. Insert per-night `stay_daily_rates`.

6 integration tests cover concurrent-reserve races (2 reserves on the last room, 10 reserves on a 5-room slot, day-mid sold-out atomicity).
