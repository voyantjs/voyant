const { spawnSync } = require("node:child_process")

const turboArgs = ["exec", "turbo", "run", "test", "--continue", ...process.argv.slice(2)]

if (process.env.TEST_DATABASE_URL) {
  turboArgs.push("--concurrency=1")
}

const result = spawnSync("pnpm", turboArgs, {
  stdio: "inherit",
  env: process.env,
})

if (result.error) {
  throw result.error
}

process.exit(result.status ?? 1)
