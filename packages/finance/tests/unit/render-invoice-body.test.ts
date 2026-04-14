import { describe, expect, it } from "vitest"

import { renderInvoiceBody } from "../../src/service.js"

/**
 * Unit tests for `renderInvoiceBody`. Mustache-style `{{path.to.value}}`
 * substitution with dot-path accessors, plus lexical_json AST walking.
 */

describe("renderInvoiceBody — mustache (markdown/html)", () => {
  it("substitutes top-level variables in markdown", () => {
    expect(renderInvoiceBody("Total: {{total}}", "markdown", { total: "100.00" })).toBe(
      "Total: 100.00",
    )
  })

  it("substitutes top-level variables in html", () => {
    expect(renderInvoiceBody("<p>Total: {{total}}</p>", "html", { total: "100.00" })).toBe(
      "<p>Total: 100.00</p>",
    )
  })

  it("resolves dot paths", () => {
    expect(
      renderInvoiceBody("Customer: {{customer.name}}", "markdown", {
        customer: { name: "Acme Corp" },
      }),
    ).toBe("Customer: Acme Corp")
  })

  it("resolves deep dot paths", () => {
    expect(
      renderInvoiceBody("Street: {{addr.billing.street.line1}}", "markdown", {
        addr: { billing: { street: { line1: "123 Main" } } },
      }),
    ).toBe("Street: 123 Main")
  })

  it("resolves array-style index accessors via bracket notation", () => {
    expect(
      renderInvoiceBody("First line: {{lines[0].description}}", "markdown", {
        lines: [{ description: "Tour Package" }, { description: "Extras" }],
      }),
    ).toBe("First line: Tour Package")
  })

  it("stringifies numbers and booleans", () => {
    expect(
      renderInvoiceBody("Qty: {{qty}}, Active: {{active}}", "markdown", {
        qty: 42,
        active: true,
      }),
    ).toBe("Qty: 42, Active: true")
  })

  it("stringifies objects as JSON", () => {
    expect(renderInvoiceBody("Data: {{o}}", "markdown", { o: { a: 1 } })).toBe('Data: {"a":1}')
  })

  it("returns empty string for missing variables", () => {
    expect(renderInvoiceBody("Missing: {{x}}", "markdown", {})).toBe("Missing: ")
  })

  it("returns empty string for missing nested path", () => {
    expect(renderInvoiceBody("Missing: {{a.b.c}}", "markdown", { a: { b: {} } })).toBe("Missing: ")
  })

  it("trims whitespace inside mustache braces", () => {
    expect(renderInvoiceBody("Hi {{  name  }}!", "markdown", { name: "X" })).toBe("Hi X!")
  })

  it("handles multiple placeholders", () => {
    expect(renderInvoiceBody("{{a}}-{{b}}-{{c}}", "markdown", { a: "1", b: "2", c: "3" })).toBe(
      "1-2-3",
    )
  })

  it("treats null and undefined as empty string", () => {
    expect(renderInvoiceBody("{{a}}|{{b}}", "markdown", { a: null, b: undefined })).toBe("|")
  })

  it("leaves body with no placeholders unchanged", () => {
    expect(renderInvoiceBody("Plain body.", "markdown", { a: 1 })).toBe("Plain body.")
  })

  it("supports liquid loops and conditionals in html/markdown bodies", () => {
    const body =
      "{% if lines.size > 0 %}{% for line in lines %}{{ line.description }}{% unless forloop.last %}, {% endunless %}{% endfor %}{% else %}No lines{% endif %}"

    expect(
      renderInvoiceBody(body, "html", {
        lines: [{ description: "Tour Package" }, { description: "Extras" }],
      }),
    ).toBe("Tour Package, Extras")
    expect(renderInvoiceBody(body, "markdown", { lines: [] })).toBe("No lines")
  })
})

describe("renderInvoiceBody — lexical_json", () => {
  it("substitutes text nodes inside lexical AST", () => {
    const lexical = JSON.stringify({
      root: {
        children: [
          {
            type: "paragraph",
            children: [{ type: "text", text: "Amount: {{amount}}" }],
          },
        ],
      },
    })
    const output = renderInvoiceBody(lexical, "lexical_json", { amount: "500.00" })
    const parsed = JSON.parse(output)
    expect(parsed.root.children[0].children[0].text).toBe("Amount: 500.00")
  })

  it("walks nested children recursively", () => {
    const lexical = JSON.stringify({
      root: {
        children: [
          {
            type: "list",
            children: [
              { children: [{ type: "text", text: "Line 1: {{a}}" }] },
              { children: [{ type: "text", text: "Line 2: {{b}}" }] },
            ],
          },
        ],
      },
    })
    const output = renderInvoiceBody(lexical, "lexical_json", { a: "foo", b: "bar" })
    const parsed = JSON.parse(output)
    expect(parsed.root.children[0].children[0].children[0].text).toBe("Line 1: foo")
    expect(parsed.root.children[0].children[1].children[0].text).toBe("Line 2: bar")
  })

  it("preserves non-text properties in lexical nodes", () => {
    const lexical = JSON.stringify({
      root: {
        type: "root",
        format: "ltr",
        children: [{ type: "text", text: "Bold: {{x}}", format: "bold", style: "color:red" }],
      },
    })
    const output = renderInvoiceBody(lexical, "lexical_json", { x: "HI" })
    const parsed = JSON.parse(output)
    expect(parsed.root.format).toBe("ltr")
    expect(parsed.root.children[0].format).toBe("bold")
    expect(parsed.root.children[0].style).toBe("color:red")
    expect(parsed.root.children[0].text).toBe("Bold: HI")
  })

  it("falls back to mustache when lexical JSON is invalid", () => {
    expect(renderInvoiceBody("not valid {{name}} json", "lexical_json", { name: "Z" })).toBe(
      "not valid Z json",
    )
  })

  it("handles lexical arrays at the top level", () => {
    const lexical = JSON.stringify([
      { type: "text", text: "{{a}}" },
      { type: "text", text: "{{b}}" },
    ])
    const output = renderInvoiceBody(lexical, "lexical_json", { a: "X", b: "Y" })
    const parsed = JSON.parse(output)
    expect(parsed[0].text).toBe("X")
    expect(parsed[1].text).toBe("Y")
  })

  it("supports liquid filters inside lexical text nodes", () => {
    const lexical = JSON.stringify({
      root: {
        children: [
          {
            type: "paragraph",
            children: [{ type: "text", text: "Lines: {{ lines | json }}" }],
          },
        ],
      },
    })
    const output = renderInvoiceBody(lexical, "lexical_json", {
      lines: [{ description: "Tour Package" }],
    })
    const parsed = JSON.parse(output)
    expect(parsed.root.children[0].children[0].text).toBe('Lines: [{"description":"Tour Package"}]')
  })
})
