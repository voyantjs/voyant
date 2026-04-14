import { Liquid } from "liquidjs"

export type StructuredTemplateBodyFormat = "html" | "markdown" | "lexical_json"

type LexicalNode = {
  type?: string
  text?: string
  children?: LexicalNode[]
  [key: string]: unknown
}

const liquid = new Liquid({
  strictFilters: false,
  strictVariables: false,
  jsTruthy: true,
})

liquid.registerFilter("json", (value: unknown) => JSON.stringify(value ?? null))

function resolvePath(obj: unknown, path: string): unknown {
  if (obj === null || obj === undefined) return undefined
  const segments: Array<string | number> = []
  const parts = path.split(".")
  for (const part of parts) {
    if (!part) continue
    const indexMatches = [...part.matchAll(/([^[\]]+)|\[(\d+)\]/g)]
    for (const match of indexMatches) {
      if (match[1] !== undefined) segments.push(match[1])
      else if (match[2] !== undefined) segments.push(Number.parseInt(match[2], 10))
    }
  }
  let current: unknown = obj
  for (const seg of segments) {
    if (current === null || current === undefined) return undefined
    if (typeof seg === "number") {
      if (!Array.isArray(current)) return undefined
      current = current[seg]
    } else {
      if (typeof current !== "object") return undefined
      current = (current as Record<string, unknown>)[seg]
    }
  }
  return current
}

function stringifyValue(value: unknown): string {
  if (value === null || value === undefined) return ""
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  return JSON.stringify(value)
}

const MUSTACHE_RE = /\{\{\s*([^}]+?)\s*\}\}/g
const LIQUID_CONTROL_RE = /\{%-?[\s\S]*?-?%\}/
const LIQUID_FILTER_RE = /\{\{[\s\S]*\|[\s\S]*\}\}/

export function renderMustacheTemplate(body: string, variables: Record<string, unknown>): string {
  return body.replace(MUSTACHE_RE, (_, path: string) => {
    const resolved = resolvePath(variables, path.trim())
    return stringifyValue(resolved)
  })
}

function shouldUseLiquid(body: string) {
  return LIQUID_CONTROL_RE.test(body) || LIQUID_FILTER_RE.test(body)
}

export function renderStringTemplate(body: string, variables: Record<string, unknown>): string {
  if (!shouldUseLiquid(body)) {
    return renderMustacheTemplate(body, variables)
  }

  return liquid.parseAndRenderSync(body, variables)
}

function walkLexical(node: LexicalNode, variables: Record<string, unknown>): LexicalNode {
  const next: LexicalNode = { ...node }
  if (typeof next.text === "string") {
    next.text = renderStringTemplate(next.text, variables)
  }
  if (Array.isArray(next.children)) {
    next.children = next.children.map((child) => walkLexical(child, variables))
  }
  return next
}

export function renderStructuredTemplate(
  body: string,
  bodyFormat: StructuredTemplateBodyFormat,
  variables: Record<string, unknown>,
): string {
  if (bodyFormat === "lexical_json") {
    try {
      const parsed: unknown = JSON.parse(body)
      if (Array.isArray(parsed)) {
        return JSON.stringify(
          parsed.map((entry) => {
            if (entry && typeof entry === "object") {
              return walkLexical(entry as LexicalNode, variables)
            }
            return entry
          }),
        )
      }
      if (parsed && typeof parsed === "object") {
        const obj = parsed as { root?: unknown } & Record<string, unknown>
        if (obj.root && typeof obj.root === "object") {
          const result = { ...obj, root: walkLexical(obj.root as LexicalNode, variables) }
          return JSON.stringify(result)
        }
        return JSON.stringify(walkLexical(obj as LexicalNode, variables))
      }
      return body
    } catch {
      return renderStringTemplate(body, variables)
    }
  }

  return renderStringTemplate(body, variables)
}
