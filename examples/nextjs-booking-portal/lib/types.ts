import { z } from "zod"

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

export const publicProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  summary: z.string(),
  description: z.string(),
  destination: z.string(),
  durationDays: z.number(),
  basePriceCents: z.number(),
  currency: z.string(),
  heroImage: z.string(),
  highlights: z.array(z.string()),
})

export const publicProductListSchema = z.object({
  items: z.array(publicProductSchema),
  total: z.number(),
})

/**
 * Customer inquiry submitted from the `/inquire/[id]` form. A real customer
 * actor posts this to `/v1/public/bookings` (or a dedicated inquiries
 * module) with `Content-Type: application/json`.
 */
export const inquiryInputSchema = z.object({
  productId: z.string(),
  travelDate: z.string(),
  partySize: z.number(),
  contact: z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
    phone: z.string().optional(),
  }),
  message: z.string().optional(),
})

export const inquiryResponseSchema = z.object({
  id: z.string(),
  status: z.enum(["received", "error"]),
  productId: z.string(),
  createdAt: z.string(),
})

export type PublicProduct = z.infer<typeof publicProductSchema>
export type PublicProductList = z.infer<typeof publicProductListSchema>
export type InquiryInput = z.infer<typeof inquiryInputSchema>
export type InquiryResponse = z.infer<typeof inquiryResponseSchema>
