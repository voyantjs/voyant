# @voyantjs/crm

CRM module for Voyant. People and organizations are the canonical person/company entities across the workspace. Includes pipelines, opportunities, quotes, activities, custom fields, notes, communications, segments, and CSV import/export.

## Install

```bash
pnpm add @voyantjs/crm
```

## Usage

```typescript
import { crmModule } from "@voyantjs/crm"
import { createApp } from "@voyantjs/hono"

const app = createApp({
  modules: [crmModule],
  // ...
})
```

## Entities

- **People** (`prsn`) — canonical person record; syncs inline contact fields (email, phone, address) to `identity` module
- **Organizations** (`orgn`) — canonical company record
- **Pipelines** + **Stages** (`pipe`, `stge`) — sales funnels
- **Opportunities** (`oppt`, `oppp`) — deals attached to people/orgs
- **Quotes** + **Quote lines** (`quot`, `qtln`)
- **Activities** (`actv`, `actl`, `actp`) — tasks, calls, meetings, emails
- **Custom fields** (`cfdf`, `cfvl`)
- **Notes** — person (`pnot`), organization (`onot`)
- **Communication log** (`clog`)
- **Segments** + **segment members** (`cseg`, `csgm`)

## Exports

| Entry | Description |
| --- | --- |
| `.` | Module export + public types |
| `./schema` | Drizzle tables + linkable definitions |
| `./validation` | Zod schemas |
| `./routes` | Hono routes for admin/public surfaces |

## License

FSL-1.1-Apache-2.0
