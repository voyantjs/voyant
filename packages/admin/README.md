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
| `./providers/admin-provider` | `AdminProvider` composing QueryClient + Theme |
| `./providers/theme` | `ThemeProvider`, `useTheme` with system-theme support |
| `./providers/query-client` | `makeQueryClient(config?)` factory with Voyant defaults |
| `./lib/initials` | `getInitials`, `getDisplayName` helpers |
| `./types` | `AdminUser`, `NavItem`, `NavSubItem`, `ThemeMode`, `AuthActions` |

## License

FSL-1.1-Apache-2.0
