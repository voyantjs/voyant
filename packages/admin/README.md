# @voyantjs/voyant-admin

Reusable admin dashboard primitives for Voyant templates. Pure, transport-agnostic React providers and helpers — no UI components tied to a specific shadcn copy.

## Install

```bash
pnpm add @voyantjs/voyant-admin
```

## Usage

```typescript
import { AdminProvider } from "@voyantjs/voyant-admin/providers/admin-provider"
import { ThemeProvider, useTheme } from "@voyantjs/voyant-admin/providers/theme"
import { makeQueryClient } from "@voyantjs/voyant-admin/providers/query-client"
import { getInitials, getDisplayName } from "@voyantjs/voyant-admin/lib/initials"
import {
  createAdminExtensionRegistry,
  defineAdminExtension,
  resolveAdminNavigation,
} from "@voyantjs/voyant-admin"

function App() {
  return (
    <AdminProvider defaultTheme="system">
      <Dashboard />
    </AdminProvider>
  )
}
```

## Exports

| Entry | Description |
| --- | --- |
| `.` | Barrel re-exports |
| `./extensions` | Admin extension types and helpers |
| `./providers/admin-provider` | `AdminProvider` composing QueryClient + Theme |
| `./providers/theme` | `ThemeProvider`, `useTheme` with system-theme support |
| `./providers/query-client` | `makeQueryClient(config?)` factory with Voyant defaults |
| `./lib/initials` | `getInitials`, `getDisplayName` helpers |
| `./types` | `AdminUser`, `NavItem`, `NavSubItem`, `ThemeMode`, `AuthActions` |

## Admin Extensions

Use `defineAdminExtension(...)` to declare shared admin contributions and keep
the extension surface explicit:

```ts
import { defineAdminExtension } from "@voyantjs/voyant-admin"

export const financeExtension = defineAdminExtension({
  id: "finance-tools",
  navigation: [
    {
      order: 10,
      items: [{ id: "settlements", title: "Settlements", url: "/finance/settlements" }],
    },
  ],
})
```

Templates can merge those contributions into their base navigation with
`resolveAdminNavigation(...)` and expose widget slots with
`resolveAdminWidgets(...)`. When a template wants one explicit source-controlled
registry, compose it with `createAdminExtensionRegistry(...)`.

## License

FSL-1.1-Apache-2.0
