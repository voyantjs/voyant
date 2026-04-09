import { defineLink } from "@voyantjs/core"
import { invoiceLinkable } from "@voyantjs/finance"
import { contractLinkable } from "@voyantjs/legal"

/**
 * A contract can be referenced by many invoices (e.g. a retainer contract
 * backs several billing invoices over the engagement).
 */
export const contractInvoiceLink = defineLink(contractLinkable, {
  linkable: invoiceLinkable,
  isList: true,
})
