import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    globals: false,
    server: {
      deps: {
        // `@cloudflare/containers` uses `cloudflare:workers`, a CF-runtime
        // specifier Node can't resolve. The test target never constructs
        // NodeStepContainer — it just imports the module graph — so a
        // lightweight shim lets the tests load.
        inline: ["@cloudflare/containers"],
      },
    },
  },
  resolve: {
    alias: [
      // Regex alias — string aliases with `:` specifiers are
      // inconsistently matched across Vite/Vitest versions.
      {
        find: /^cloudflare:workers$/,
        replacement: fileURLToPath(new URL("./test-shims/cloudflare-workers.ts", import.meta.url)),
      },
    ],
  },
})
