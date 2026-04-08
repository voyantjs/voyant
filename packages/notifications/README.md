# @voyantjs/notifications

Notifications module for Voyant. It includes:

- provider abstraction via `NotificationProvider`
- first-party providers for local development and optional Resend (email)
- database-backed notification templates
- database-backed delivery logs
- notification reminder rules and reminder runs
- finance-aware send flows for invoices and payment sessions
- routes for template management, delivery listing, reminder management, and sending

CRM communication history should remain a business-facing log. This module owns transport templates, delivery attempts, provider message ids, and reminder-oriented operational sends.

## Install

```bash
pnpm add @voyantjs/notifications
```

## Usage

```typescript
import { createNotificationService } from "@voyantjs/notifications"
import { createLocalProvider } from "@voyantjs/notifications/providers/local"
import { createResendProvider } from "@voyantjs/notifications/providers/resend"

const notifications = createNotificationService([
  createLocalProvider(),
  createResendProvider({ apiKey: env.RESEND_API_KEY, from: "noreply@example.com" }),
])

await notifications.sendWith("resend", {
  to: "user@example.com",
  channel: "email",
  template: "welcome",
  subject: "Hello",
  html: "<p>Welcome</p>",
})
```

Later providers override earlier ones on channel conflict; `sendWith(name, payload)` dispatches by provider name.

The bring-your-own path is first-class: any project can register its own `NotificationProvider`
without using Resend at all.

For the Hono module:

```ts
import {
  createDefaultNotificationProviders,
  createNotificationsHonoModule,
} from "@voyantjs/notifications"

const notificationsModule = createNotificationsHonoModule({
  resolveProviders: (env) =>
    createDefaultNotificationProviders(env, {
      emailProvider: "resend",
    }),
})
```

`createDefaultNotificationProviders(env)` is intentionally local-only by default. Built-in
email providers should be opted into explicitly at the app boundary.

For scheduled reminder sweeps:

```ts
import { sendDueNotificationReminders } from "@voyantjs/notifications/tasks"

await sendDueNotificationReminders(db, process.env, {
  now: "2026-04-08T09:00:00.000Z",
})
```

For finance-aware collection sends, the routes also support:

- `POST /payment-sessions/:id/send`
- `POST /invoices/:id/send`

Those routes resolve recipients from the payment session, invoice, and linked booking participants, then render the selected notification template with finance context such as payment links, invoice balances, and booking references.

## Exports

| Entry | Description |
| --- | --- |
| `.` | Barrel re-exports |
| `./schema` | Drizzle tables and module definitions |
| `./types` | `NotificationProvider`, payload types |
| `./validation` | Zod schemas for templates, deliveries, reminders, send input |
| `./routes` | Hono route factory |
| `./service` | Dispatcher + database-backed notifications service |
| `./tasks` | Reminder sweep task helpers |
| `./provider-resolution` | Default local/Resend provider wiring |
| `./providers/local` | Console sink for dev |
| `./providers/resend` | Resend email provider |

## License

FSL-1.1-Apache-2.0
