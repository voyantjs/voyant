import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    passWithNoTests: true,
    fileParallelism: false,
    maxWorkers: 1,
    hookTimeout: 60000,
  },
})
