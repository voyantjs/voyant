import { and, desc, eq } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"

import { contractNumberSeries } from "./schema.js"
import type {
  CreateContractNumberSeriesInput,
  UpdateContractNumberSeriesInput,
} from "./service-shared.js"

export const contractSeriesService = {
  async listSeries(db: PostgresJsDatabase) {
    return db.select().from(contractNumberSeries).orderBy(desc(contractNumberSeries.updatedAt))
  },
  async getSeriesById(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .select()
      .from(contractNumberSeries)
      .where(eq(contractNumberSeries.id, id))
      .limit(1)
    return row ?? null
  },
  /**
   * Find the most-recently-updated active series matching a name. Used by
   * the auto-generate subscriber so consumers can pin a named series
   * (`"2026 Customer"`) in config and let operators rename the row via
   * the admin UI without breaking the wiring.
   */
  async findSeriesByName(db: PostgresJsDatabase, name: string) {
    const [row] = await db
      .select()
      .from(contractNumberSeries)
      .where(and(eq(contractNumberSeries.name, name), eq(contractNumberSeries.active, true)))
      .orderBy(desc(contractNumberSeries.updatedAt))
      .limit(1)
    return row ?? null
  },
  async createSeries(db: PostgresJsDatabase, data: CreateContractNumberSeriesInput) {
    const [row] = await db.insert(contractNumberSeries).values(data).returning()
    return row ?? null
  },
  async updateSeries(db: PostgresJsDatabase, id: string, data: UpdateContractNumberSeriesInput) {
    const [row] = await db
      .update(contractNumberSeries)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(contractNumberSeries.id, id))
      .returning()
    return row ?? null
  },
  async deleteSeries(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(contractNumberSeries)
      .where(eq(contractNumberSeries.id, id))
      .returning({ id: contractNumberSeries.id })
    return row ?? null
  },
}
