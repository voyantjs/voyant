const { spawnSync } = require("node:child_process")

const testFiles = [
  "tests/integration/product-extras.test.ts",
  "tests/integration/option-extra-configs.test.ts",
  "tests/integration/booking-extras.test.ts",
]

for (const testFile of testFiles) {
  const result = spawnSync("pnpm", ["exec", "vitest", "run", testFile], {
    stdio: "inherit",
    shell: process.platform === "win32",
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}
