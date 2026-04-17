# @voyantjs/plugin-sanity-cms

Sanity CMS sync adapter bundle for Voyant.

Architecturally, this package is primarily:

- a Sanity sync adapter
- a subscriber bundle that mirrors Voyant module records into Sanity
- an optional plugin bundle for distribution

It subscribes to module events and mirrors documents into a Sanity dataset keyed
by a `voyantId` field.

## Install

```bash
pnpm add @voyantjs/plugin-sanity-cms
```

## Usage

```typescript
import { createSanityCmsSyncPlugin } from "@voyantjs/plugin-sanity-cms"
import { createApp } from "@voyantjs/hono"

const app = createApp({
  plugins: [
    createSanityCmsSyncPlugin({
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
| `./plugin` | `sanityCmsPlugin(options)` and `createSanityCmsSyncPlugin(options)` |
| `./client` | `createSanityClient` — `upsertByVoyantId`, `deleteByVoyantId`, `findByVoyantId` |
| `./types` | Plugin option types |

## License

FSL-1.1-Apache-2.0
