# @voyantjs/cruises-react

React Query hooks + Zod-validated fetch client for the Voyant cruises module.

Mirrors the convention used by `@voyantjs/crm-react` and `@voyantjs/products-react`.

## Quickstart

```tsx
import { VoyantCruisesProvider } from "@voyantjs/cruises-react/provider"
import { useStorefrontCruises } from "@voyantjs/cruises-react"

function App() {
  return (
    <VoyantCruisesProvider baseUrl="/api">
      <CruiseGrid />
    </VoyantCruisesProvider>
  )
}

function CruiseGrid() {
  const { data, isLoading } = useStorefrontCruises({ cruiseType: "expedition" })
  if (isLoading) return <p>Loading…</p>
  return (
    <ul>
      {data?.data.map((c) => <li key={c.id}>{c.name}</li>)}
    </ul>
  )
}
```

See `docs/architecture/cruises-module.md` in the monorepo root for the full module design.
