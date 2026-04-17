# @voyantjs/hono

Hono transport adapter for Voyant. Provides `createApp()`, middleware, auth helpers, and the admin/public route surfaces for mounting Voyant modules behind a Hono app. Plugin bundles remain an optional packaging layer on top of modules and extensions.

## Install

```bash
pnpm add @voyantjs/hono hono
```

## Usage

```typescript
import { createApp } from "@voyantjs/hono"

const app = createApp({
  db: (env) => getDb(env),
  auth: { handler, resolve },
  modules: [crmModule, productsModule, bookingsModule],
})
```

The middleware chain is: container → requestId → logger → errorBoundary → CORS → health → auth handler → requireAuth → db → actor guards → module routes.

## Exports

| Entry | Description |
| --- | --- |
| `.` | Barrel re-exports |
| `./app` | `createApp` factory |
| `./module` | `HonoModule`, `HonoExtension` contracts |
| `./plugin` | `HonoPlugin`, `defineHonoPlugin`, `expandHonoPlugins` for reusable plugin bundles |
| `./middleware` | All middleware re-exports |
| `./middleware/auth` | `requireAuth` session/API-key/JWT auth |
| `./middleware/cors` | CORS configuration |
| `./middleware/error-boundary` | Error handling + JSON error envelope |
| `./middleware/db` | Attach db client to `c.var.db` |
| `./middleware/rate-limit` | KV-backed rate limiter |
| `./middleware/require-actor` | Enforce `staff`/`customer`/`partner`/`supplier` actor |
| `./middleware/require-permission` | Permission-based guards |
| `./middleware/logger` | Request logger |
| `./auth/session-jwt` | `verifySession` JWT verification |
| `./auth/crypto` | `sha256Base64Url`, cookie helpers |

## License

FSL-1.1-Apache-2.0
