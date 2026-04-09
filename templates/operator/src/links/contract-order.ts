import { defineLink } from "@voyantjs/core"
import { contractLinkable } from "@voyantjs/legal"
import { orderLinkable } from "@voyantjs/transactions"

/**
 * An order can have many contracts; each contract attaches to at most one order.
 */
export const contractOrderLink = defineLink(
  { linkable: contractLinkable, isList: true },
  orderLinkable,
)
