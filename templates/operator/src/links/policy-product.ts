import { defineLink } from "@voyantjs/core"
import { policyLinkable } from "@voyantjs/legal"
import { productLinkable } from "@voyantjs/products"

/**
 * A policy can apply to many products (cancellation rules, payment schedule,
 * etc.); a product can carry many policies (one per kind).
 */
export const policyProductLink = defineLink(
  { linkable: policyLinkable, isList: true },
  { linkable: productLinkable, isList: true },
)
