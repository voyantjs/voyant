# @voyantjs/core

Module system and framework primitives for Voyant. Transport-agnostic — provides the contracts, registry, container, event bus, links, query, workflows, and config shape that every Voyant module and transport adapter builds on. Plugin bundles are supported as a packaging layer on top of those primitives, not as the primary architecture unit.

## Install

```bash
pnpm add @voyantjs/core
```

## Usage

```typescript
import { defineModule } from "@voyantjs/core/module"
import { defineLink } from "@voyantjs/core/links"
import { defineVoyantConfig } from "@voyantjs/core/config"
import { createWorkflow, step } from "@voyantjs/core/workflows"
import { definePlugin } from "@voyantjs/core/plugin"
```

## Exports

| Entry | Description |
| --- | --- |
| `.` | Barrel re-exports |
| `./module` | `Module`, `defineModule` |
| `./registry` | Module registry |
| `./container` | `createContainer` dependency container |
| `./events` | `createEventBus` in-process event bus |
| `./hooks` | Lifecycle hook contracts |
| `./orchestration` | `JobRunner` interface for background jobs |
| `./links` | Module Links — `defineLink`, `generateLinkTableSql`, `LinkService` |
| `./query` | Cross-module reads — `queryGraph`, `createQueryContext` |
| `./workflows` | In-process saga primitive with compensation |
| `./plugin` | Plugin bundles for reusable package distribution — `definePlugin`, `registerPlugins` |
| `./config` | `VoyantConfig` manifest shape + `defineVoyantConfig` |
| `./env` | Environment helpers |

## License

FSL-1.1-Apache-2.0
