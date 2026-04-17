# @voyantjs/plugin-payload-cms

Payload CMS sync adapter bundle for Voyant.

Architecturally, this package is primarily:

- a Payload sync adapter
- a subscriber bundle that mirrors Voyant module records into Payload
- an optional plugin bundle for distribution

It subscribes to module events and mirrors documents into a Payload collection
keyed by a `voyantId` field.

## Install

```bash
pnpm add @voyantjs/plugin-payload-cms
```

## Usage

```typescript
import { createPayloadCmsSyncPlugin } from "@voyantjs/plugin-payload-cms"
import { createApp } from "@voyantjs/hono"

const app = createApp({
  plugins: [
    createPayloadCmsSyncPlugin({
      apiUrl: "https://cms.example.com/api",
      apiKey: env.PAYLOAD_API_KEY,
      collection: "products",
      // optional: events, mapEvent, logger, apiKeyAuthScheme
    }),
  ],
})
```

By default the plugin wires up 3 subscribers (`product.created`, `product.updated`, `product.deleted`) that upsert/delete documents keyed by `voyantId`. All error handling is fire-and-forget per the EventBus contract.

## Exports

| Entry | Description |
| --- | --- |
| `.` | Barrel re-exports |
| `./plugin` | `payloadCmsPlugin(options)` and `createPayloadCmsSyncPlugin(options)` |
| `./client` | `createPayloadClient` — `upsertByVoyantId`, `deleteByVoyantId`, `findByVoyantId` |
| `./types` | Plugin option types |

## License

FSL-1.1-Apache-2.0
