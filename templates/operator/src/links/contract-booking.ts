import { bookingLinkable } from "@voyantjs/bookings"
import { defineLink } from "@voyantjs/core"
import { contractLinkable } from "@voyantjs/legal"

/**
 * A booking can have many contracts (customer travel contract, supplier
 * addendum, amendment). Each contract attaches to at most one booking.
 */
export const contractBookingLink = defineLink(
  { linkable: contractLinkable, isList: true },
  bookingLinkable,
)
