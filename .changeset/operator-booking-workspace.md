---
"@voyantjs/bookings-react": minor
"@voyantjs/finance-react": minor
"@voyantjs/legal-react": minor
---

Flesh out the operator booking workspace with React hooks for the sections that already existed on the backend.

- `@voyantjs/bookings-react`: add hooks for booking items (`useBookingItems`, `useBookingItemMutation`), item-participant assignment (`useBookingItemParticipants`, `useBookingItemParticipantMutation`), documents (`useBookingDocuments`, `useBookingDocumentMutation`), cancellation (`useBookingCancelMutation`), and convert-from-product (`useBookingConvertMutation`).
- `@voyantjs/finance-react`: add hooks for booking payment schedules (`useBookingPaymentSchedules`, `useBookingPaymentScheduleMutation`) and booking guarantees (`useBookingGuarantees`, `useBookingGuaranteeMutation`).
- `@voyantjs/legal-react`: add policy resolution (`useResolvePolicy`) and cancellation evaluation (`useEvaluateCancellation`) hooks that power the structured booking cancellation workflow.
