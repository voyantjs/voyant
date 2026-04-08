# @voyantjs/bookings

Bookings module for Voyant. Manages booking lifecycle with passengers, supplier statuses, activity log, and notes. Uses `personId` + `organizationId` from CRM as client snapshot.

## Install

```bash
pnpm add @voyantjs/bookings
```

## Usage

```typescript
import { bookingsModule } from "@voyantjs/bookings"
import { createApp } from "@voyantjs/hono"

const app = createApp({
  modules: [bookingsModule],
  // ...
})
```

## Entities

- **Bookings** (`book`)
- **Booking passengers** (`bkps`)
- **Booking supplier statuses** (`bkss`)
- **Booking activity log** (`bkal`)
- **Booking notes** (`bnot`)

## Exports

| Entry | Description |
| --- | --- |
| `.` | Module export + service |
| `./schema` | Drizzle tables |
| `./validation` | Zod schemas |
| `./routes` | Hono routes |

## License

FSL-1.1-Apache-2.0
