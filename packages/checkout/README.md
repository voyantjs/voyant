# @voyantjs/checkout

Optional checkout and collection orchestration for Voyant.

This package sits above `@voyantjs/finance` and `@voyantjs/notifications`. It does not implement payment providers. Instead, it decides which booking schedule or invoice to collect, creates the right finance record, and optionally sends the corresponding notification.

## What it does

- previews a booking collection plan
- creates bank-transfer collection documents (`proforma` by default)
- creates card collection `payment_sessions`
- supports schedule-backed or invoice-backed card collection
- optionally sends invoice or payment-session notifications

## Routes

- `POST /v1/checkout/bookings/:bookingId/collection-plan`
- `POST /v1/checkout/bookings/:bookingId/initiate-collection`

## Notes

- payment-provider plugins like Netopia remain optional
- email-provider choice remains app-owned
- projects can override the default collection policy when mounting the routes
