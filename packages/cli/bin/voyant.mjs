#!/usr/bin/env node
import { main } from "../dist/index.js"

main(process.argv.slice(2))
  .then((code) => {
    if (typeof code === "number") {
      process.exit(code)
    }
  })
  .catch((err) => {
    process.stderr.write(`${err?.stack ?? String(err)}\n`)
    process.exit(1)
  })
