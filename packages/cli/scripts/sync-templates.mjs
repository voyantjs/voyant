import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const cliRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const repoRoot = resolve(cliRoot, "..", "..")
const templatesRoot = join(cliRoot, "templates")

const skipNames = new Set([
  "node_modules",
  ".turbo",
  "dist",
  ".wrangler",
  ".next",
  ".vite",
  "coverage",
  ".cache",
  ".env",
  ".env.local",
  ".dev.vars",
  ".dev.vars.local",
  ".DS_Store",
])

const starters = ["dmc", "operator"]

rmSync(templatesRoot, { recursive: true, force: true })
mkdirSync(templatesRoot, { recursive: true })

for (const starter of starters) {
  const source = join(repoRoot, "templates", starter)
  const target = join(templatesRoot, starter)
  if (!existsSync(source)) {
    throw new Error(`Missing starter template: ${source}`)
  }

  cpSync(source, target, {
    recursive: true,
    force: true,
    filter: (src) => {
      const rel = src.slice(source.length).replace(/^[\\/]+/, "")
      if (!rel) return true
      const first = rel.split(/[\\/]/)[0]
      return !skipNames.has(first)
    },
  })
}
