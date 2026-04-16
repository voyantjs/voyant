---
"@voyantjs/bookings-react": minor
"@voyantjs/voyant-ui": minor
---

Add canonical booking status presentation helpers to `@voyantjs/bookings-react`:

- `bookingStatusBadgeVariant: Record<BookingStatus, 'default' | 'secondary' | 'outline' | 'destructive'>` — exhaustive (not `Record<string, …>`), so adding a new booking status becomes a compile error here instead of a silent UX miss in every app.
- `formatBookingStatus(status)` — humanized label (`"in_progress"` → `"In Progress"`).
- `bookingStatuses` / `bookingStatusOptions` — status list derived from the Zod schema, ready for Select pickers.
- `BookingStatus` type (now exported from `./schemas`).

Registry components in `@voyantjs/voyant-ui` (`booking-list`, `booking-detail-page` copies, `status-change-dialog`) drop their duplicated local `statusVariant` / `formatStatus` / `BOOKING_STATUSES` constants and consume these instead — single source of truth.
