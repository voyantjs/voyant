import { describe, expect, it } from "vitest"

import { renderStructuredTemplate } from "../src/template-renderer.js"

describe("renderStructuredTemplate", () => {
  it("keeps simple mustache interpolation compatibility", () => {
    expect(
      renderStructuredTemplate("Hello {{ customer.name }}", "markdown", {
        customer: { name: "Ana" },
      }),
    ).toBe("Hello Ana")
    expect(renderStructuredTemplate("Data {{ obj }}", "markdown", { obj: { a: 1 } })).toBe(
      'Data {"a":1}',
    )
  })

  it("supports liquid control flow for html/markdown bodies", () => {
    const body =
      "{% if travelers.size > 0 %}{% for traveler in travelers %}{{ traveler.name }}{% unless forloop.last %}, {% endunless %}{% endfor %}{% else %}No travelers{% endif %}"
    expect(
      renderStructuredTemplate(body, "html", {
        travelers: [{ name: "Ana" }, { name: "Bob" }],
      }),
    ).toBe("Ana, Bob")
    expect(renderStructuredTemplate(body, "markdown", { travelers: [] })).toBe("No travelers")
  })

  it("supports liquid filters inside lexical text nodes", () => {
    const body = JSON.stringify({
      root: {
        type: "root",
        children: [
          {
            type: "paragraph",
            children: [{ type: "text", text: "Travelers: {{ travelers | json }}" }],
          },
        ],
      },
    })

    const output = renderStructuredTemplate(body, "lexical_json", {
      travelers: [{ name: "Ana" }],
    })

    expect(JSON.parse(output).root.children[0].children[0].text).toBe('Travelers: [{"name":"Ana"}]')
  })
})
