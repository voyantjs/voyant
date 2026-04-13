---
"@voyantjs/booking-requirements": patch
"@voyantjs/booking-requirements-react": patch
---

Add a public storefront transport requirements surface for booking flows.

`@voyantjs/booking-requirements` now exposes a public route for product
transport and passenger document requirements, including option-aware passport,
nationality, and date-of-birth summaries. `@voyantjs/booking-requirements-react`
now exposes matching transport requirement schemas, query keys, query options,
and a `useTransportRequirements` hook for storefront consumers.
