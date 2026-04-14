---
"@voyantjs/checkout": patch
"@voyantjs/plugin-netopia": patch
---

Add a fuller storefront payment bootstrap surface to checkout.

- allow exact-amount collection overrides in checkout plans and initiation
- return customer-safe bank transfer instructions from checkout when configured
- support combined provider startup in checkout through injected payment
  starters
- add a Netopia checkout starter helper in `@voyantjs/plugin-netopia`
