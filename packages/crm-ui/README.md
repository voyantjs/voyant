# @voyantjs/voyant-crm-ui

React hooks, client, and shadcn registry components for the Voyant CRM module. Provides `VoyantProvider`, typed Zod-validated fetch client, TanStack Query hooks, and installable UI components.

## Install

```bash
pnpm add @voyantjs/voyant-crm-ui
```

## Usage

```typescript
import { VoyantProvider, usePeople, usePersonMutation } from "@voyantjs/voyant-crm-ui"

function App() {
  return (
    <VoyantProvider baseUrl="/v1">
      <PeopleList />
    </VoyantProvider>
  )
}

function PeopleList() {
  const { data } = usePeople()
  return <>{data?.items.map((p) => <div key={p.id}>{p.firstName}</div>)}</>
}
```

## shadcn Registry Components

Install CRM components via the shadcn CLI — see the hosted registry at `apps/registry`:

```bash
npx shadcn@latest add https://registry.voyantjs.com/r/crm/person-list.json
```

Available components under `registry/default/crm/`: `person-card`, `person-form`, `person-dialog`, `person-list`, `organization-card`.

## Exports

| Entry | Description |
| --- | --- |
| `.` | Barrel re-exports |
| `./provider` | `VoyantProvider`, `useVoyant` |
| `./hooks` | Query + mutation hooks (`usePeople`, `usePerson`, `usePersonMutation`, etc.) |
| `./client` | Typed Zod fetch client |
| `./query-keys` | TanStack Query key factory |

## License

FSL-1.1-Apache-2.0
