import type { CommandContext, CommandResult } from "../types.js"

const USAGE = `voyant — Voyant CLI

USAGE
  voyant <command> [...args]

COMMANDS
  new <name> [--template <name|path>] Scaffold a new project from a template
  generate module <name>             Scaffold a new module package under packages/<name>
  generate link <a> <b>              Emit a defineLink snippet (a, b as <module>.<entity>)
  config <show|validate|path>        Inspect the nearest voyant.config.* manifest
  dev --file <path>                  Watch and serve workflows locally with hot reload
  db <generate|migrate|studio|push>  Proxy drizzle-kit commands to the nearest template
  db sync-links                      Emit SQL DDL for cross-module link tables
  exec <script.ts> [args...]         Run a TS/JS script with the voyant loader hook
  workflows <subcommand>             Build, serve, inspect, and self-host workflows
  --help, -h                         Show this help

EXAMPLES
  voyant new my-app --template dmc
  voyant new my-app --template operator
  voyant new my-app --template ./my-custom-template
  voyant generate module invoices
  voyant generate link crm.person products.product --right-list
  voyant config show
  voyant config validate --path ./templates/dmc/voyant.config.ts
  voyant dev --file ./src/workflows.ts
  voyant db generate
  voyant db migrate
  voyant db sync-links --template ./templates/dmc --out ./links.sql
  voyant exec ./scripts/backfill.ts --dry-run
  voyant workflows build --file ./src/workflows.ts --out ./.voyant/build
`

export function helpCommand(ctx: CommandContext): CommandResult {
  ctx.stdout(USAGE)
  return 0
}
