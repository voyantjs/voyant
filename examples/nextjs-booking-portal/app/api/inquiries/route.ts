import { NextResponse } from "next/server"

import type { InquiryInput } from "../../../lib/types"
import { submitInquiry } from "../../../lib/voyant-client"

export const dynamic = "force-dynamic"

function isValidInquiry(body: unknown): body is InquiryInput {
  if (typeof body !== "object" || body === null) return false
  const b = body as Record<string, unknown>
  if (typeof b.productId !== "string") return false
  if (typeof b.travelDate !== "string") return false
  if (typeof b.partySize !== "number") return false
  const contact = b.contact as Record<string, unknown> | undefined
  if (!contact) return false
  if (typeof contact.firstName !== "string") return false
  if (typeof contact.lastName !== "string") return false
  if (typeof contact.email !== "string") return false
  return true
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  if (!isValidInquiry(body)) {
    return NextResponse.json({ error: "Invalid inquiry payload" }, { status: 400 })
  }
  const response = await submitInquiry(body)
  return NextResponse.json(response, { status: 201 })
}
