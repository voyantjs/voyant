const { spawnSync } = require("node:child_process")

const testFiles = [
  "tests/integration/facilities.test.ts",
  "tests/integration/facility-identity.test.ts",
  "tests/integration/facility-operations.test.ts",
  "tests/integration/properties.test.ts",
  "tests/integration/property-groups.test.ts",
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
