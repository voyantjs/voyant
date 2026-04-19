import path from "node:path"
import { fileURLToPath } from "node:url"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// `voyant workflows serve` / `voyant dev` locate this app's `dist/`
// via `findDashboardDir()` and serve it as a static site. Output is
// kept at `dist/` with `index.html` at the root so that discovery
// continues to work without extra wiring.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
  },
  server: {
    // Stand-alone dev preview: `vite dev` hits the voyant API at 3232.
    proxy: {
      "/api": "http://127.0.0.1:3232",
      "/sse": "http://127.0.0.1:3232",
    },
  },
})
