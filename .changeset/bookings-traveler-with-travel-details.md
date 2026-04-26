---
"@voyantjs/bookings": minor
---

Add `bookingsService.createTravelerWithTravelDetails` and `updateTravelerWithTravelDetails` — convenience verbs that take the same flat payload shape `createTravelerRecord` accepted before 0.10 (with `dateOfBirth` / `nationality` / `passportNumber` / `passportExpiry` / `dietaryRequirements` / `accessibilityNeeds` / `isLeadTraveler` included) and internally fan out to `createTravelerRecord` + `BookingPiiService.upsertTravelerTravelDetails`. The storage split (plaintext columns + encrypted envelope) is preserved at rest — only the call ergonomics collapse.

Migration boundary helper for consumers coming from the pre-0.10 single-call shape: instead of learning the encrypted PII service contract just to keep parity with the dropped `accessibility_needs` column, you can pass one flat object as before.

Also adds `accessibilityNeeds` to `upsertTravelerTravelDetailsSchema` (the underlying PII service has always supported it; the public-facing schema was missing it).

```ts
import { bookingsService, createBookingPiiService } from "@voyantjs/bookings"

const pii = createBookingPiiService({ kms })

const result = await bookingsService.createTravelerWithTravelDetails(
  db,
  bookingId,
  {
    participantType: "traveler",
    firstName: "Ana",
    lastName: "Traveler",
    email: "ana@example.com",
    nationality: "RO",
    passportNumber: "ABC123",
    accessibilityNeeds: "wheelchair access",
    isLeadTraveler: true,
  },
  { pii, userId: actorId, actorId },
)
// → { traveler, travelDetails }
```

Operations are sequential, not transactional — a failure in the encrypted-fields write leaves the plaintext row in place (matching the pre-helper two-call protocol).
