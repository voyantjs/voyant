# @voyantjs/plugin-sanity-cms

Sanity CMS sync plugin for Voyant. Subscribes to module events and mirrors documents into a Sanity dataset keyed by a `voyantId` field.

## Install

```bash
pnpm add @voyantjs/plugin-sanity-cms
```

## Usage

```typescript
import { sanityCmsPlugin } from "@voyantjs/plugin-sanity-cms"
import { createApp } from "@voyantjs/hono"

const app = createApp({
  plugins: [
    sanityCmsPlugin({
      projectId: env.SANITY_PROJECT_ID,
      dataset: "production",
      token: env.SANITY_TOKEN,
      documentType: "product",
      // optional: apiVersion, voyantIdField, apiHost, events, mapEvent, logger
    }),
  ],
})
```

Uses GROQ for reads and Sanity Mutations API for writes. Default `apiVersion` is `"2024-01-01"`. By default the plugin wires up 3 subscribers (`product.created`, `product.updated`, `product.deleted`).

## Exports

| Entry | Description |
| --- | --- |
| `.` | Barrel re-exports |
| `./plugin` | `sanityCmsPlugin(options)` |
| `./client` | `createSanityClient` — `upsertByVoyantId`, `deleteByVoyantId`, `findByVoyantId` |
| `./types` | Plugin option types |

## License

FSL-1.1-Apache-2.0
