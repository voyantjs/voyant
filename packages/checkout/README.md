# @voyantjs/checkout

Optional checkout and collection orchestration for Voyant.

This package sits above `@voyantjs/finance` and `@voyantjs/notifications`. It does not implement payment providers. Instead, it decides which booking schedule or invoice to collect, creates the right finance record, and optionally sends the corresponding notification.

## What it does

- previews a booking collection plan
- creates bank-transfer collection documents (`proforma` by default)
- supports exact-amount collection overrides by falling back to invoice-backed
  collection when the requested amount does not match an existing schedule
- creates card collection `payment_sessions`
- supports schedule-backed or invoice-backed card collection
- can start the provider flow in the same checkout request when a payment
  starter is configured
- can return customer-safe bank-transfer instructions when a bank-transfer
  resolver is configured
- optionally sends invoice or payment-session notifications

## Routes

- `POST /v1/checkout/bookings/:bookingId/collection-plan`
- `POST /v1/checkout/bookings/:bookingId/initiate-collection`
- `GET /v1/admin/checkout/bookings/:bookingId/reminder-runs`

## Notes

- payment-provider adapters like Netopia remain optional
- provider startup is injected through `paymentStarters` or
  `resolvePaymentStarters`
- bank-transfer instructions are injected through `bankTransferDetails` or
  `resolveBankTransferDetails`
- email-provider choice remains app-owned
- projects can override the default collection policy when mounting checkout
- `createCheckoutHonoModule()` now mounts checkout through Voyant's module
  system while preserving the legacy `/v1/checkout/*` public path
- third parties can still ship provider integrations as plugin bundles, but
  checkout itself stays provider-agnostic
