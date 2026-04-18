import { NextResponse } from "next/server"

import { inquiryInputSchema } from "../../../lib/types"
import { submitInquiry } from "../../../lib/voyant-client"

export const dynamic = "force-dynamic"

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = inquiryInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid inquiry payload" }, { status: 400 })
  }

  const response = await submitInquiry(parsed.data)
  return NextResponse.json(response, { status: 201 })
}
