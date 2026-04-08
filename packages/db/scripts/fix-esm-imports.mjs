/**
 * Post-build script: appends .js extensions to relative imports in dist/
 *
 * TypeScript with module:"ESNext" + moduleResolution:"Bundler" does not
 * emit .js extensions, but Node ESM requires them. This script fixes that.
 */
import { readFileSync, statSync, writeFileSync } from "node:fs"
import { glob } from "node:fs/promises"
import { dirname, join, resolve } from "node:path"

const distDir = new URL("../dist", import.meta.url).pathname

// Match relative imports/exports: from "./foo" or from "../bar/baz"
const importRe = /(from\s+["'])(\.\.?\/[^"']+)(["'])/g

async function main() {
  let fixed = 0
  for await (const file of glob("**/*.{js,d.ts}", { cwd: distDir })) {
    const filePath = join(distDir, file)
    const content = readFileSync(filePath, "utf8")

    const updated = content.replace(importRe, (match, pre, specifier, post) => {
      // Already has extension
      if (specifier.endsWith(".js") || specifier.endsWith(".ts")) return match

      // Check if it's a directory with index.js
      const absDir = resolve(dirname(filePath), specifier)
      try {
        if (statSync(absDir).isDirectory()) {
          return `${pre}${specifier}/index.js${post}`
        }
      } catch {}

      return `${pre}${specifier}.js${post}`
    })

    if (updated !== content) {
      writeFileSync(filePath, updated)
      fixed++
    }
  }
  console.log(`fix-esm-imports: patched ${fixed} files`)
}

main()
