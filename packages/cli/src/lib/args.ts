/**
 * Minimal POSIX-ish argv parser.
 *
 * Recognises:
 * - `--flag` → boolean flag (true)
 * - `--key value` and `--key=value` → string value
 * - `-x` → short boolean flag (true)
 * - Everything else → positional
 *
 * Does not support short-flag clustering (`-xyz`) or numeric coercion.
 */
export interface ParsedArgs {
  positionals: string[]
  flags: Record<string, string | boolean>
}

export function parseArgs(argv: ReadonlyArray<string>): ParsedArgs {
  const positionals: string[] = []
  const flags: Record<string, string | boolean> = {}

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i]
    if (token === undefined) continue

    if (token.startsWith("--")) {
      const body = token.slice(2)
      const eq = body.indexOf("=")
      if (eq >= 0) {
        flags[body.slice(0, eq)] = body.slice(eq + 1)
        continue
      }
      const next = argv[i + 1]
      if (next !== undefined && !next.startsWith("-")) {
        flags[body] = next
        i++
      } else {
        flags[body] = true
      }
      continue
    }

    if (token.startsWith("-") && token.length > 1) {
      flags[token.slice(1)] = true
      continue
    }

    positionals.push(token)
  }

  return { positionals, flags }
}
