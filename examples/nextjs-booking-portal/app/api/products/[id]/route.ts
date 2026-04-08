import { NextResponse } from "next/server"

import { getProduct } from "../../../../lib/voyant-client"

interface RouteContext {
  params: Promise<{ id: string }>
}

export const dynamic = "force-dynamic"

export async function GET(_request: Request, context: RouteContext): Promise<NextResponse> {
  const { id } = await context.params
  const product = await getProduct(id)
  if (!product) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 })
  }
  return NextResponse.json(product)
}
