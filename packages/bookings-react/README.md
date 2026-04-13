`@voyantjs/bookings-react` provides React Query hooks and provider utilities for Voyant bookings.

It now includes public storefront flow helpers alongside the admin hooks:

- `usePublicBookingSession`
- `usePublicBookingSessionState`
- `usePublicBookingSessionFlowMutation`
- `getPublicBookingSessionQueryOptions`
- `getPublicBookingSessionStateQueryOptions`

Those helpers target the public booking session contract for wizard-state
storage and room-selection repricing.
