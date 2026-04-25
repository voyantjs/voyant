---
"@voyantjs/bookings": minor
---

**BREAKING:** encrypt `accessibilityNeeds` at rest. Move accessibility info from a plaintext column on `booking_travelers` into the KMS-encrypted `booking_traveler_travel_details` envelope (alongside passport / nationality / DOB / dietary).

Disability data has tighter regulatory expectations in many jurisdictions (ADA / Equality Act) than freeform notes, so it lives with the passport-class data, not with `specialRequests` or `notes`.

**Migration:**

- The `booking_travelers.accessibility_needs` column is dropped.
- `accessibilityNeeds` is removed from `bookingTravelerRecord`, `BookingTraveler*` insert/update validation schemas, `redactTravelerIdentity`, and the bookings-react / finance / scripts surface.
- Read accessibility data through `createBookingPiiService.getTravelerTravelDetails`, which decrypts via `decryptOptionalJsonEnvelope` + audits the access. Same authorisation gate as the existing dietary / identity buckets.

Contact identifiers (email, phone, names, address) and `specialRequests` deliberately stay plaintext — see `docs/architecture/booking-pii.md` for the cost-benefit decision.
