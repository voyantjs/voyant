import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"

import { bookingsService } from "../service.js"

export interface ExpireStaleBookingHoldsInput {
  before?: string | null
  note?: string | null
}

export interface ExpireStaleBookingHoldsResult {
  expiredIds: string[]
  count: number
  cutoff: Date
}

export async function expireStaleBookingHolds(
  db: PostgresJsDatabase,
  input: ExpireStaleBookingHoldsInput = {},
  userId = "system",
): Promise<ExpireStaleBookingHoldsResult> {
  return bookingsService.expireStaleBookings(
    db,
    {
      before: input.before ?? null,
      note: input.note ?? null,
    },
    userId,
  )
}
