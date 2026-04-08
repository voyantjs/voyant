# @voyantjs/voyant-registry-host

Cloudflare Worker that serves aggregated shadcn registry JSON from `public/r/` with CORS. Registry files are built from each `packages/*-ui/` shadcn registry and flattened into a single host.

## Building the registry

```bash
pnpm registry:build
```

This runs `scripts/build-registry.ts`, which calls `shadcn build` inside each UI package and aggregates output into `apps/registry/public/r/`.

## Running locally

```bash
pnpm -F @voyantjs/voyant-registry-host dev
```

## Consuming components

```bash
npx shadcn@latest add https://registry.voyantjs.com/r/crm/person-list.json
```

## License

FSL-1.1-Apache-2.0
