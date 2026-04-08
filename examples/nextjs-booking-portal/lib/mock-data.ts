import type { PublicProduct } from "./types"

/**
 * A small in-memory catalog that mirrors what a DMC (Destination Management
 * Company) might expose via `/v1/public/products` after filtering by visibility.
 * Values are illustrative; amounts are in minor units (cents) to match the
 * Voyant finance convention.
 */
export const MOCK_PRODUCTS: readonly PublicProduct[] = [
  {
    id: "prod_01h2xfakemock00000000aaaa",
    name: "Amalfi Coast — 5 Day Classic",
    summary: "Lemon groves, pastel villages, and a private boat day off Positano.",
    description:
      "Base yourself in a cliffside hotel in Amalfi and explore Ravello, Positano, and Capri at your own pace. Includes airport transfers, daily breakfast, a guided walk of the Path of the Gods, and a half-day private boat charter.",
    destination: "Amalfi Coast, Italy",
    durationDays: 5,
    basePriceCents: 189_000,
    currency: "EUR",
    heroImage:
      "https://images.unsplash.com/photo-1533106418989-88406c7cc8ca?w=1200&q=60&auto=format&fit=crop",
    highlights: [
      "Cliffside boutique hotel in Amalfi",
      "Private boat charter along the coast",
      "Guided Path of the Gods hike",
      "Airport transfers and daily breakfast",
    ],
  },
  {
    id: "prod_01h2xfakemock00000000bbbb",
    name: "Kyoto Temples & Arashiyama",
    summary: "Quiet mornings at Fushimi Inari and a tea ceremony in Gion.",
    description:
      "A slow-paced 4-night introduction to Kyoto: Fushimi Inari at dawn, Arashiyama's bamboo grove before the crowds, Nishiki market, a private tea ceremony in Gion, and a day trip to Nara. Includes a licensed English-speaking guide on 3 of 4 days.",
    destination: "Kyoto, Japan",
    durationDays: 4,
    basePriceCents: 214_500,
    currency: "USD",
    heroImage:
      "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=1200&q=60&auto=format&fit=crop",
    highlights: [
      "Dawn visit to Fushimi Inari",
      "Private tea ceremony in Gion",
      "Day trip to Nara",
      "Licensed English-speaking guide",
    ],
  },
  {
    id: "prod_01h2xfakemock00000000cccc",
    name: "Patagonia Torres del Paine W-Trek",
    summary: "Seven days hiking the iconic W circuit with full refugio support.",
    description:
      "The classic W-trek across Torres del Paine National Park: Grey Glacier, the French Valley, and a sunrise at the Base of the Towers. Includes all refugio stays, breakfasts and dinners, park entrance fees, and catamaran crossings.",
    destination: "Patagonia, Chile",
    durationDays: 7,
    basePriceCents: 267_000,
    currency: "USD",
    heroImage:
      "https://images.unsplash.com/photo-1531794473797-9ceb0ac1a08b?w=1200&q=60&auto=format&fit=crop",
    highlights: [
      "All refugio accommodation",
      "Guided ascent to the Base of the Towers",
      "Grey Glacier catamaran crossing",
      "Daily breakfasts and dinners",
    ],
  },
  {
    id: "prod_01h2xfakemock00000000dddd",
    name: "Morocco High Atlas — Berber Villages",
    summary: "Trekking from Imlil through mountain villages to Mt. Toubkal.",
    description:
      "A 6-day Berber village trek starting in Imlil, winding through terraced fields and traditional kasbahs, ending with an optional summit of Jebel Toubkal (4,167m). Includes mule-supported porterage, half-board homestays, and a local certified mountain guide.",
    destination: "High Atlas, Morocco",
    durationDays: 6,
    basePriceCents: 132_500,
    currency: "EUR",
    heroImage:
      "https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=1200&q=60&auto=format&fit=crop",
    highlights: [
      "Certified local mountain guide",
      "Optional Mt. Toubkal summit",
      "Berber village homestays",
      "Mule-supported porterage",
    ],
  },
]

export function findMockProduct(id: string): PublicProduct | null {
  return MOCK_PRODUCTS.find((p) => p.id === id) ?? null
}
