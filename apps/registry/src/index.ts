/**
 * Voyant shadcn registry host.
 *
 * Serves pre-built registry JSON payloads out of `public/r/` and adds CORS
 * headers so the shadcn CLI can consume them from any consumer project.
 *
 * URL shape: `GET /r/{name}.json`
 */

export interface Env {
  ASSETS: Fetcher
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS })
    }

    const url = new URL(request.url)

    // Root index — list registries
    if (url.pathname === "/" || url.pathname === "/r" || url.pathname === "/r/") {
      return new Response(
        JSON.stringify({
          name: "voyant",
          description: "Voyant shadcn registry",
          routes: ["/r/{name}.json"],
        }),
        {
          headers: {
            "Content-Type": "application/json",
            ...CORS_HEADERS,
          },
        },
      )
    }

    const assetResponse = await env.ASSETS.fetch(request)
    const headers = new Headers(assetResponse.headers)
    for (const [key, value] of Object.entries(CORS_HEADERS)) {
      headers.set(key, value)
    }
    return new Response(assetResponse.body, {
      status: assetResponse.status,
      statusText: assetResponse.statusText,
      headers,
    })
  },
}
