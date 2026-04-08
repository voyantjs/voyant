import { formatDuration, formatPrice } from "../lib/format"
import { listProducts } from "../lib/voyant-client"

export const dynamic = "force-dynamic"

/**
 * Home page — product listing.
 *
 * Fetches products **server-side** from the Voyant `/v1/public/products`
 * surface and renders a responsive card grid. Each card links to
 * `/products/[id]` for the full detail view + booking flow.
 */
export default async function HomePage() {
  const { items } = await listProducts()

  return (
    <>
      <section className="hero">
        <h1>Small-group tours, thoughtfully crafted.</h1>
        <p>
          Hand-picked multi-day itineraries across four continents. Book directly with us, or speak
          to a specialist to tailor the trip to your dates and interests.
        </p>
      </section>
      <section>
        <h2>Available tours</h2>
        <div className="grid">
          {items.map((product) => (
            <a key={product.id} href={`/products/${encodeURIComponent(product.id)}`}>
              <article className="card">
                <div
                  className="card-image"
                  style={{ backgroundImage: `url(${product.heroImage})` }}
                  role="img"
                  aria-label={product.name}
                />
                <div className="card-body">
                  <h3>{product.name}</h3>
                  <div className="card-meta">
                    {product.destination} · {formatDuration(product.durationDays)}
                  </div>
                  <p className="card-summary">{product.summary}</p>
                  <div className="card-footer">
                    <div>
                      <span className="price">
                        {formatPrice(product.basePriceCents, product.currency)}
                      </span>{" "}
                      <span className="price-unit">per person</span>
                    </div>
                    <span className="btn btn-outline">View tour</span>
                  </div>
                </div>
              </article>
            </a>
          ))}
        </div>
      </section>
    </>
  )
}
