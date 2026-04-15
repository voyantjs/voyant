---
"@voyantjs/customer-portal": patch
---

Stop importing the deep `@voyantjs/db/schema/iam/kms` subpath from the published customer portal bundle and use the stable `@voyantjs/db/schema/iam` entrypoint instead. This avoids downstream SSR bundler alias workarounds in setups like Astro/Vite under pnpm.
