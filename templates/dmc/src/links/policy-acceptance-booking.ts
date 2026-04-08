import { bookingLinkable } from "@voyantjs/bookings"
import { defineLink } from "@voyantjs/core"
import { policyAcceptanceLinkable } from "@voyantjs/legal"

/**
 * A booking can have many policy acceptances (one per policy kind accepted
 * at checkout); each acceptance attaches to at most one booking.
 */
export const policyAcceptanceBookingLink = defineLink(
  { linkable: policyAcceptanceLinkable, isList: true },
  bookingLinkable,
)
