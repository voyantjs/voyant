/**
 * Booking-portal types — these intentionally mirror a **subset** of Voyant's
 * `products` module shapes so the example stays self-contained. In a real
 * app, you would either:
 *
 *   1. Import the Zod schemas from `@voyantjs/products` and infer
 *      types via `z.infer<typeof selectProductSchema>`, or
 *   2. Use OpenAPI codegen against Voyant's `/v1/public/*` surface.
 *
 * We keep the fields small here to make the example readable.
 */

export interface PublicProduct {
  id: string
  name: string
  summary: string
  description: string
  destination: string
  durationDays: number
  basePriceCents: number
  currency: string
  heroImage: string
  highlights: readonly string[]
}

export interface PublicProductList {
  items: readonly PublicProduct[]
  total: number
}

/**
 * Customer inquiry submitted from the `/inquire/[id]` form. A real customer
 * actor posts this to `/v1/public/bookings` (or a dedicated inquiries
 * module) with `Content-Type: application/json`.
 */
export interface InquiryInput {
  productId: string
  travelDate: string
  partySize: number
  contact: {
    firstName: string
    lastName: string
    email: string
    phone?: string
  }
  message?: string
}

export interface InquiryResponse {
  id: string
  status: "received" | "error"
  productId: string
  createdAt: string
}
