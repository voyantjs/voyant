import { describe, expect, it } from "vitest"

import { renderPdfDocument } from "../src/pdf-renderer.js"

describe("renderPdfDocument", () => {
  it("renders html content into a non-empty pdf byte array", async () => {
    const pdf = await renderPdfDocument({
      title: "Contract",
      content: "<h1>Hello</h1><p>Passenger: Ana</p>",
      format: "html",
      metadataLines: ["Ref: CONT-1"],
    })

    expect(pdf).toBeInstanceOf(Uint8Array)
    expect(pdf.byteLength).toBeGreaterThan(100)
  })

  it("extracts text from lexical json content", async () => {
    const pdf = await renderPdfDocument({
      content: JSON.stringify({
        root: {
          type: "root",
          children: [
            {
              type: "paragraph",
              children: [{ type: "text", text: "Invoice body" }],
            },
          ],
        },
      }),
      format: "lexical_json",
    })

    expect(pdf.byteLength).toBeGreaterThan(100)
  })
})
