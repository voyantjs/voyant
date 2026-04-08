import { notFound, redirect } from "next/navigation"

import { formatPrice } from "../../../lib/format"
import type { InquiryInput } from "../../../lib/types"
import { getProduct, submitInquiry } from "../../../lib/voyant-client"

interface PageProps {
  params: Promise<{ id: string }>
}

/**
 * Inquiry form — server component with a Server Action that submits the
 * booking request to Voyant. The form posts to the same URL, is handled by
 * `createInquiry`, and on success redirects to `/thanks`.
 */
export default async function InquirePage({ params }: PageProps) {
  const { id } = await params
  const product = await getProduct(id)

  if (!product) {
    notFound()
  }

  async function createInquiry(formData: FormData): Promise<void> {
    "use server"

    const partySize = Number(formData.get("partySize") ?? "1")
    const input: InquiryInput = {
      productId: id,
      travelDate: String(formData.get("travelDate") ?? ""),
      partySize: Number.isFinite(partySize) ? partySize : 1,
      contact: {
        firstName: String(formData.get("firstName") ?? ""),
        lastName: String(formData.get("lastName") ?? ""),
        email: String(formData.get("email") ?? ""),
        phone: (formData.get("phone") as string) || undefined,
      },
      message: (formData.get("message") as string) || undefined,
    }

    const response = await submitInquiry(input)
    redirect(`/thanks?inquiry=${encodeURIComponent(response.id)}`)
  }

  return (
    <>
      <a href={`/products/${encodeURIComponent(product.id)}`} className="back-link">
        ← Back to tour
      </a>
      <form className="form" action={createInquiry}>
        <h2>Request {product.name}</h2>
        <p style={{ color: "var(--muted)", marginBottom: "1.5rem" }}>
          Starting from {formatPrice(product.basePriceCents, product.currency)} per person. We'll be
          in touch within one business day to confirm availability and pricing.
        </p>

        <div className="field-row">
          <div className="field">
            <label htmlFor="firstName">First name</label>
            <input id="firstName" name="firstName" required />
          </div>
          <div className="field">
            <label htmlFor="lastName">Last name</label>
            <input id="lastName" name="lastName" required />
          </div>
        </div>

        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required />
        </div>

        <div className="field">
          <label htmlFor="phone">Phone (optional)</label>
          <input id="phone" name="phone" type="tel" />
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="travelDate">Preferred travel date</label>
            <input id="travelDate" name="travelDate" type="date" required />
          </div>
          <div className="field">
            <label htmlFor="partySize">Party size</label>
            <select id="partySize" name="partySize" defaultValue="2" required>
              <option value="1">1 traveler</option>
              <option value="2">2 travelers</option>
              <option value="3">3 travelers</option>
              <option value="4">4 travelers</option>
              <option value="5">5 travelers</option>
              <option value="6">6+ travelers</option>
            </select>
          </div>
        </div>

        <div className="field">
          <label htmlFor="message">Anything we should know? (optional)</label>
          <textarea
            id="message"
            name="message"
            placeholder="Dietary restrictions, mobility needs, celebrations, dates flexibility..."
          />
        </div>

        <button type="submit" className="btn" style={{ width: "100%", marginTop: "0.5rem" }}>
          Send inquiry
        </button>
      </form>
    </>
  )
}
