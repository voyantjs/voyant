import { notFound } from "next/navigation"

import { formatDuration, formatPrice } from "../../../lib/format"
import { getProduct } from "../../../lib/voyant-client"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ id: string }>
}

/**
 * Product detail — server-rendered.
 *
 * Fetches a single product from `/v1/public/products/:id` and renders the
 * description, highlights, and a sticky booking sidebar that deep-links into
 * `/inquire/[id]` with the product preselected.
 */
export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params
  const product = await getProduct(id)

  if (!product) {
    notFound()
  }

  return (
    <>
      <a href="/" className="back-link">
        ← Back to tours
      </a>
      <div className="product-detail">
        <article>
          <div
            className="product-hero"
            style={{ backgroundImage: `url(${product.heroImage})` }}
            role="img"
            aria-label={product.name}
          />
          <h1>{product.name}</h1>
          <div className="destination">
            {product.destination} · {formatDuration(product.durationDays)}
          </div>
          <p>{product.description}</p>

          <h3 style={{ marginTop: "2rem" }}>What's included</h3>
          <ul className="highlights">
            {product.highlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <aside className="booking-sidebar">
          <div className="price">{formatPrice(product.basePriceCents, product.currency)}</div>
          <div className="duration">per person · {formatDuration(product.durationDays)}</div>
          <a
            href={`/inquire/${encodeURIComponent(product.id)}`}
            className="btn"
            style={{ textDecoration: "none" }}
          >
            Request this tour
          </a>
        </aside>
      </div>
    </>
  )
}
