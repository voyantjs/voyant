---
"@voyantjs/bookings-react": minor
---

Add `useBookingPrimaryProduct(bookingId)` hook and make `BookingCancellationDialog` + `BookingGroupSection` self-resolve `productId` (and `optionUnitId`) from the booking's items.

The hook returns `{ productId, optionUnitId, isPending, isLoading }`, using the canonical "first item with a non-null productId" rule — the same heuristic every consumer was duplicating. Components auto-resolve by default when the prop is `undefined`; pass an explicit string or `null` as an override for multi-product bookings or to force the non-product-scoped policy.

This fixes a quiet correctness regression where callers who forgot to wire `productId` silently fell back to the default cancellation policy instead of the product-scoped one.
