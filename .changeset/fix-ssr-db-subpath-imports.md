---
"@voyantjs/bookings": patch
"@voyantjs/transactions": patch
---

Avoid deep `@voyantjs/db/schema/iam/kms` imports in published bundles by using the stable
`@voyantjs/db/schema/iam` entrypoint instead. This reduces downstream SSR bundler resolution issues
under pnpm-based builds.
