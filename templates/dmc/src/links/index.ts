import type { LinkDefinition } from "@voyantjs/core"

import { contractBookingLink } from "./contract-booking.js"
import { contractInvoiceLink } from "./contract-invoice.js"
import { contractOrderLink } from "./contract-order.js"
import { organizationProductLink } from "./organization-product.js"
import { personProductLink } from "./person-product.js"
import { policyAcceptanceBookingLink } from "./policy-acceptance-booking.js"
import { policyProductLink } from "./policy-product.js"

export {
  contractBookingLink,
  contractInvoiceLink,
  contractOrderLink,
  organizationProductLink,
  personProductLink,
  policyAcceptanceBookingLink,
  policyProductLink,
}

/**
 * All cross-module link definitions used by this template. Materialize their
 * pivot tables with `syncLinks(db, links)` from `@voyantjs/db/links`.
 */
export const links: LinkDefinition[] = [
  personProductLink,
  organizationProductLink,
  contractBookingLink,
  contractOrderLink,
  contractInvoiceLink,
  policyProductLink,
  policyAcceptanceBookingLink,
]
