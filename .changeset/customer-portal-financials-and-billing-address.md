---
"@voyantjs/customer-portal": patch
---

Expand the public customer-portal contract with booking financial history and a
first-class billing-address object on customer records.

Changes:

- add `financials.documents` and `financials.payments` to public booking detail
- include booking-linked invoice/proforma summaries and payment history in the
  booking detail route
- expose `customerRecord.billingAddress` on public profile/bootstrap payloads
- support updating the linked customer billing address through the public
  profile update and bootstrap flows
