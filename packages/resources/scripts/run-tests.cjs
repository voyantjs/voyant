const { spawnSync } = require("node:child_process")

const testFiles = [
  "tests/integration/resources-and-pools.test.ts",
  "tests/integration/members-and-requirements.test.ts",
  "tests/integration/assignments-and-closeouts.test.ts",
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
