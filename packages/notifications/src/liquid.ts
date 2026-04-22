import { Liquid } from "liquidjs"

const engine = new Liquid({
  strictFilters: false,
  strictVariables: false,
  trimTagLeft: false,
  trimTagRight: false,
  greedy: false,
  jsTruthy: true,
})

engine.registerFilter("json", (value: unknown) => JSON.stringify(value ?? null))

engine.registerFilter("currency", (value: unknown, currency = "EUR", locale = "en-US") => {
  const num = typeof value === "number" ? value : Number.parseFloat(String(value))
  if (Number.isNaN(num)) return String(value ?? "")
  return new Intl.NumberFormat(String(locale), {
    style: "currency",
    currency: String(currency || "EUR"),
  }).format(num)
})

engine.registerFilter("date_format", (value: unknown, _format?: string, locale = "en-US") => {
  if (!value) return ""
  const date = value instanceof Date ? value : new Date(String(value))
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString(String(locale), {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
})

engine.registerFilter("phone", (value: unknown) => {
  if (!value) return ""
  const phone = String(value).replace(/\D/g, "")
  if (phone.length === 10) {
    return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`
  }
  if (phone.length === 11 && phone.startsWith("1")) {
    return `+1 (${phone.slice(1, 4)}) ${phone.slice(4, 7)}-${phone.slice(7)}`
  }
  if (phone.length > 10) {
    return `+${phone.slice(0, -9)} ${phone.slice(-9, -6)} ${phone.slice(-6, -3)} ${phone.slice(-3)}`
  }
  return String(value)
})

engine.registerFilter("default", (value: unknown, defaultValue: unknown) => {
  if (value === null || value === undefined || value === "") return defaultValue
  return value
})

engine.registerFilter("pluralize", (count: unknown, singular: string, plural: string) => {
  const num = typeof count === "number" ? count : Number.parseInt(String(count), 10)
  return num === 1 ? singular : plural
})

function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

function normalizeKeys(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    result[key] =
      value && typeof value === "object" && !Array.isArray(value)
        ? normalizeKeys(value as Record<string, unknown>)
        : value
    const snakeKey = toSnakeCase(key)
    if (snakeKey !== key) {
      result[snakeKey] = result[key]
    }
  }
  return result
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
}

function healBrokenTags(html: string): string {
  html = html.replace(/\{\{([\s\S]{1,300}?)\}\}/g, (match) => {
    let healed = match
    if (/</.test(healed)) healed = healed.replace(/<[^>]+>/g, "").replace(/\s+/g, " ")
    if (/&\w+;/.test(healed)) healed = decodeHtmlEntities(healed)
    return healed
  })
  html = html.replace(/\{%([\s\S]{1,300}?)%\}/g, (match) => {
    let healed = match
    if (/</.test(healed)) healed = healed.replace(/<[^>]+>/g, "").replace(/\s+/g, " ")
    if (/&\w+;/.test(healed)) healed = decodeHtmlEntities(healed)
    return healed
  })
  return html
}

function healSyntax(template: string): string {
  let result = healBrokenTags(template)
  result = result.replace(/\{%[-\s]*for\s+(\w+)\s*[-]?%\}/gi, (match, collection: string) => {
    if (/\bfor\s+\w+\s+in\s+/i.test(match)) return match
    const singular = collection.endsWith("ies")
      ? `${collection.slice(0, -3)}y`
      : collection.endsWith("s")
        ? collection.slice(0, -1)
        : `${collection}_item`
    return `{% for ${singular} in ${collection} %}`
  })
  result = result.replace(
    /\{%[-\s]*(endfor|endif|else|endunless|endcase|endcapture|endraw)\s*[-]?%\}/gi,
    (_match, tag: string) => `{% ${tag.toLowerCase()} %}`,
  )
  return result
}

function regexFallback(template: string, data: Record<string, unknown>): string {
  function resolve(obj: unknown, path: string): unknown {
    const parts = path.split(".")
    let cur: unknown = obj
    for (const p of parts) {
      if (cur == null || typeof cur !== "object") return undefined
      cur = (cur as Record<string, unknown>)[p]
    }
    return cur
  }

  let result = template
  result = result.replace(/\{\{\s*([^}|]+?)(?:\s*\|[^}]*)?\s*\}\}/g, (_match, rawPath: string) => {
    const path = rawPath.trim()
    const value = resolve(data, path)
    if (value !== undefined && value !== null) return String(value)
    return _match
  })
  result = result.replace(/\{%[\s\S]*?%\}/g, "")
  return result
}

export function renderLiquidTemplate(
  template: string | null | undefined,
  data: Record<string, unknown>,
): string | null {
  if (!template) return null
  const normalized = normalizeKeys(data)
  const healed = healSyntax(template)

  try {
    return engine.parseAndRenderSync(healed, normalized)
  } catch (error) {
    console.error("[notifications:liquid] template parsing failed, falling back to regex", error)
  }

  try {
    return regexFallback(healed, normalized)
  } catch (fallbackError) {
    console.error("[notifications:liquid] regex fallback failed", fallbackError)
    return template
  }
}

export { engine as notificationLiquidEngine }
