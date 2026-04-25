---
"@voyantjs/hospitality": minor
---

Date-scoped rate variation via `priceScheduleId` (weekend bumps, seasonal pricing). `hospitalityService.resolveStayDailyRates` now consults `price_schedules` so callers can write one `room_type_rates` row per schedule (uniqueness on `(ratePlanId, roomTypeId, priceScheduleId)`) plus a default row with `priceScheduleId: null`.

Schedule matching:

- `weekdays` (e.g. `["fri", "sat"]`) — match by day of week.
- `validFrom` / `validTo` — match within an inclusive ISO date window.
- `priority` — higher wins when multiple schedules match a date.
- `recurrenceRule` (iCal RRULE) is intentionally NOT parsed — most production usage maps cleanly to the simpler columns above. Inactive schedules (`active=false`) are ignored even if otherwise matching.
