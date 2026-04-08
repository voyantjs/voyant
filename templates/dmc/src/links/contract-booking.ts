import { bookingLinkable } from "@voyantjs/bookings"
import { contractLinkable } from "@voyantjs/legal"
import { defineLink } from "@voyantjs/core"

/**
 * A booking can have many contracts (customer travel contract, supplier
 * addendum, amendment). Each contract attaches to at most one booking.
 */
export const contractBookingLink = defineLink(
  { linkable: contractLinkable, isList: true },
  bookingLinkable,
)
