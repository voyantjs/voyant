---
"@voyantjs/bookings-react": minor
---

**Rename**: `QuickBookDialog` → `BookingCreateDialog` across the registry, operator, and dmc templates. The dialog was originally a lightweight create alternative to a flat-form CTA, but since the composition slice landed (#264 — product / departure / rooms / person / shared-room / passengers / price breakdown / voucher / payment schedule all wired through the atomic `/quick-create` endpoint) it IS the booking-create workflow. Keeping "Quick Book" in the name actively misled operators.

**Bumped via this changeset but not code-changed on npm**: this package is on the fixed release train with everything else, so it ships the version bump alongside the others. The actual rename lives in `@voyantjs/voyant-ui` (registry, in the ignore list), `@voyantjs/i18n` (private), and the templates — consumers see the effect via fresh starter archives (`voyant new`) or the next `shadcn add`.

Breaking for consumers who copied the registry component earlier:
- `QuickBookDialog` → `BookingCreateDialog` (symbol)
- `quick-book-dialog.tsx` → `booking-create-dialog.tsx` (file path)
- Registry entry `voyant-bookings-quick-book-dialog` → `voyant-bookings-booking-create-dialog`
- i18n namespace `bookings.quickBook` → `bookings.create`; `bookings.list.quickBook` removed (booking list now has a single "+ New Booking" CTA)
- `BookingDialog` now declares `voyant-bookings-booking-create-dialog` as a registry dep, so `shadcn add voyant-bookings-booking-dialog` pulls both in automatically

Consumers who migrated the files locally can drop the old `QuickBookDialog` copy and regenerate via the registry, or run the equivalent of `grep -rl 'QuickBookDialog\|quick-book-dialog\|bookings\\.quickBook' | xargs sed -i ''` on their app.
