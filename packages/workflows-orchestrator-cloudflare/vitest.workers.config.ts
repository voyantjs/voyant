import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/workflows-config"

// Separate config for the miniflare-backed suite. The main `test`
// script runs plain-node tests against structural-type mocks; this
// `test:workers` script runs tests inside workerd against a real
// Durable Object + alarm runtime.
export default defineWorkersConfig({
  test: {
    include: ["test-worker/__tests__/**/*.test.ts"],
    poolOptions: {
      workers: {
        wrangler: { configPath: "./test-worker/wrangler.jsonc" },
      },
    },
  },
})
