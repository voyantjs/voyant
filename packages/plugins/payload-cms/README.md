# @voyantjs/plugin-payload-cms

Payload CMS sync adapter for Voyant. It subscribes to module events and mirrors documents into a Payload collection keyed by a `voyantId` field. The package is distributed as a Voyant plugin bundle so it can be mounted directly in app composition.

## Install

```bash
pnpm add @voyantjs/plugin-payload-cms
```

## Usage

```typescript
import { payloadCmsPlugin } from "@voyantjs/plugin-payload-cms"
import { createApp } from "@voyantjs/hono"

const app = createApp({
  plugins: [
    payloadCmsPlugin({
      apiUrl: "https://cms.example.com/api",
      apiKey: env.PAYLOAD_API_KEY,
      collection: "products",
      // optional: events, mapEvent, logger, apiKeyAuthScheme
    }),
  ],
})
```

By default the bundle wires up 3 subscribers (`product.created`, `product.updated`, `product.deleted`) that upsert/delete documents keyed by `voyantId`. All error handling is fire-and-forget per the EventBus contract.

## Exports

| Entry | Description |
| --- | --- |
| `.` | Barrel re-exports |
| `./plugin` | `payloadCmsPlugin(options)` plugin bundle factory |
| `./client` | `createPayloadClient` — `upsertByVoyantId`, `deleteByVoyantId`, `findByVoyantId` |
| `./types` | Plugin option types |

## License

FSL-1.1-Apache-2.0
