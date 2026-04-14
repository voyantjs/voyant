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
      "{% if passengers.size > 0 %}{% for passenger in passengers %}{{ passenger.name }}{% unless forloop.last %}, {% endunless %}{% endfor %}{% else %}No passengers{% endif %}"
    expect(
      renderStructuredTemplate(body, "html", {
        passengers: [{ name: "Ana" }, { name: "Bob" }],
      }),
    ).toBe("Ana, Bob")
    expect(renderStructuredTemplate(body, "markdown", { passengers: [] })).toBe("No passengers")
  })

  it("supports liquid filters inside lexical text nodes", () => {
    const body = JSON.stringify({
      root: {
        type: "root",
        children: [
          {
            type: "paragraph",
            children: [{ type: "text", text: "Passengers: {{ passengers | json }}" }],
          },
        ],
      },
    })

    const output = renderStructuredTemplate(body, "lexical_json", {
      passengers: [{ name: "Ana" }],
    })

    expect(JSON.parse(output).root.children[0].children[0].text).toBe(
      'Passengers: [{"name":"Ana"}]',
    )
  })
})
