import { NextResponse } from "next/server"

import { listProducts } from "../../../lib/voyant-client"

/**
 * JSON API endpoint for client-side product browsing.
 *
 * Most pages in this example fetch Voyant directly from server components, but
 * this route handler exposes the same data as a BFF-style JSON endpoint in
 * case you want to hit it from a client component or a mobile app.
 */
export const dynamic = "force-dynamic"

export async function GET(): Promise<NextResponse> {
  const data = await listProducts()
  return NextResponse.json(data)
}
