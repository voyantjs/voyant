import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  createBasicPdfProductBrochurePrinter,
  createCloudflareBrowserProductBrochurePrinter,
  createCloudflareBrowserProductBrochurePrinterFromEnv,
} from "../../src/tasks/brochure-printers.js"
import { renderProductBrochureTemplate } from "../../src/tasks/brochure-templates.js"

const templateContext = {
  product: {
    id: "prod_123",
    name: "Voyant City Break",
  },
  days: [
    {
      id: "prod_days_1",
      productId: "prod_123",
      dayNumber: 1,
      title: "Arrival",
      description: "Airport transfer and hotel check-in",
      location: "Bucharest",
      createdAt: new Date("2026-04-01T10:00:00.000Z"),
      updatedAt: new Date("2026-04-01T10:00:00.000Z"),
      services: [],
    },
  ],
  generatedAt: new Date("2026-04-14T10:00:00.000Z"),
} as const

describe("product brochure template and printers", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("renders Liquid brochure templates with product/day variables", async () => {
    const rendered = await renderProductBrochureTemplate(
      {
        bodyFormat: "markdown",
        title: ({ product }) => `${product.name} brochure`,
        filename: ({ product }) => `${product.name}.pdf`,
        body: [
          "# {{ product.name }}",
          "{% for day in days %}",
          "Day {{ day.dayNumber }}: {{ day.title }}",
          "{% endfor %}",
        ].join("\n"),
      },
      templateContext,
    )

    expect(rendered.title).toBe("Voyant City Break brochure")
    expect(rendered.filename).toBe("Voyant City Break.pdf")
    expect(rendered.body).toContain("# Voyant City Break")
    expect(rendered.body).toContain("Day 1: Arrival")
  })

  it("creates PDF artifacts with the built-in printer", async () => {
    const printer = createBasicPdfProductBrochurePrinter()
    const artifact = await printer({
      template: {
        title: "Voyant City Break brochure",
        filename: "voyant-city-break.pdf",
        body: "# Voyant City Break\nA compact brochure body",
        bodyFormat: "markdown",
        variables: {},
        metadataLines: ["Generated in unit test"],
      },
      context: templateContext,
    })

    expect(artifact.mimeType).toBe("application/pdf")
    expect(artifact.fileSize).toBeGreaterThan(0)
    expect(artifact.metadata).toMatchObject({
      renderer: "voyant-basic-pdf",
      bodyFormat: "markdown",
    })
    expect(artifact.body.byteLength).toBeGreaterThan(0)
  })

  it("prints brochures through the Cloudflare Browser adapter", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(new Uint8Array([1, 2, 3, 4]), {
          status: 200,
          headers: {
            "X-Browser-Ms-Used": "91",
          },
        }),
    )
    vi.stubGlobal("fetch", fetchMock)

    const printer = createCloudflareBrowserProductBrochurePrinter({
      accountId: "cf-account",
      apiToken: "cf-token",
      addStyleTag: [{ content: "body { font-family: sans-serif; }" }],
      pdfOptions: { format: "A4" },
    })

    const artifact = await printer({
      template: {
        title: "Voyant City Break brochure",
        filename: "voyant-city-break.pdf",
        body: "<h1>Voyant City Break</h1>",
        bodyFormat: "html",
        variables: {},
        metadataLines: [],
      },
      context: templateContext,
    })

    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, request] = fetchMock.mock.calls[0] ?? []
    expect(url).toBe(
      "https://api.cloudflare.com/client/v4/accounts/cf-account/browser-rendering/pdf",
    )
    expect(request?.method).toBe("POST")
    expect(request?.headers).toMatchObject({
      Authorization: "Bearer cf-token",
      "Content-Type": "application/json",
    })
    expect(JSON.parse(String(request?.body))).toMatchObject({
      html: expect.stringContaining("<h1>Voyant City Break</h1>"),
      pdfOptions: { format: "A4" },
    })
    expect(artifact.mimeType).toBe("application/pdf")
    expect(artifact.fileSize).toBe(4)
    expect(artifact.metadata).toMatchObject({
      renderer: "cloudflare-browser",
      bodyFormat: "html",
      browserMsUsed: "91",
      productId: "prod_123",
    })
  })

  it("requires Cloudflare credentials when building a printer from env", () => {
    expect(() =>
      createCloudflareBrowserProductBrochurePrinterFromEnv({
        CLOUDFLARE_ACCOUNT_ID: "cf-account",
      }),
    ).toThrow(/CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN/)
  })
})
