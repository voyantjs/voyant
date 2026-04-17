import { fetchWithValidation, VoyantApiError, type VoyantFetcher } from "@voyantjs/storefront-react"

import { findMockProduct, MOCK_PRODUCTS } from "./mock-data"
import {
  type InquiryInput,
  type InquiryResponse,
  inquiryResponseSchema,
  type PublicProduct,
  type PublicProductList,
  publicProductListSchema,
  publicProductSchema,
} from "./types"

/**
 * Server-side Voyant REST client.
 *
 * This example talks to Voyant through its `/v1/public/*` surface — the
 * customer-facing read endpoints that are available to any actor marked as
 * "customer" (see `packages/hono` for the actor guards). Keep this client on
 * the server: it may carry an API key and should never be shipped to the
 * browser bundle.
 *
 * Set `USE_MOCK_DATA=1` in `.env` to run the booking portal against the
 * in-memory mock catalog from `./mock-data.ts` — handy for demos and CI.
 */

const API_URL = process.env.VOYANT_API_URL?.replace(/\/$/, "") ?? ""
const API_KEY = process.env.VOYANT_API_KEY ?? ""
const MOCK = process.env.USE_MOCK_DATA === "1" || API_URL === ""

function createApiHeaders(init?: HeadersInit): Headers {
  const h = new Headers(init)
  if (API_KEY) {
    h.set("Authorization", `Bearer ${API_KEY}`)
  }
  return h
}

const apiFetcher: VoyantFetcher = (url, init) =>
  fetch(url, {
    ...init,
    headers: createApiHeaders(init?.headers),
    // Customer portals rarely need cached responses in the BFF layer; let
    // Next.js decide at the route-handler level.
    cache: "no-store",
  })

async function voyantFetch<T>(
  path: string,
  schema: Parameters<typeof fetchWithValidation<T>>[1],
  init?: RequestInit,
): Promise<T> {
  if (!API_URL) {
    throw new Error("VOYANT_API_URL is not configured")
  }

  return fetchWithValidation(path, schema, { baseUrl: API_URL, fetcher: apiFetcher }, init)
}

export async function listProducts(): Promise<PublicProductList> {
  if (MOCK) {
    return { items: [...MOCK_PRODUCTS], total: MOCK_PRODUCTS.length }
  }
  // Real Voyant call — adapt the mapping to your product schema's public
  // projection. The DMC template returns `{ items, total }` by convention.
  return voyantFetch("/v1/public/products", publicProductListSchema)
}

export async function getProduct(id: string): Promise<PublicProduct | null> {
  if (MOCK) {
    return findMockProduct(id)
  }
  try {
    return await voyantFetch(`/v1/public/products/${encodeURIComponent(id)}`, publicProductSchema)
  } catch (err) {
    if (err instanceof VoyantApiError && err.status === 404) {
      return null
    }
    throw err
  }
}

export async function submitInquiry(input: InquiryInput): Promise<InquiryResponse> {
  if (MOCK) {
    // In a real app, the server would persist this in Voyant via a booking
    // request endpoint. For the demo we just echo a receipt.
    return {
      id: `inq_${Math.random().toString(36).slice(2, 12)}`,
      status: "received",
      productId: input.productId,
      createdAt: new Date().toISOString(),
    }
  }
  return voyantFetch("/v1/public/inquiries", inquiryResponseSchema, {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function isMockMode(): boolean {
  return MOCK
}
