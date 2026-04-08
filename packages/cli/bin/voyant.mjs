#!/usr/bin/env node
import { main } from "../dist/index.js"

main(process.argv.slice(2))
  .then((code) => process.exit(code ?? 0))
  .catch((err) => {
    process.stderr.write(`${err?.stack ?? String(err)}\n`)
    process.exit(1)
  })
