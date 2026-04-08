import { and, desc, eq, sql } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import type { z } from "zod"

import { quoteLines, quotes } from "../schema.js"
import type {
  insertQuoteLineSchema,
  insertQuoteSchema,
  quoteListQuerySchema,
  updateQuoteLineSchema,
  updateQuoteSchema,
} from "../validation.js"
import { paginate } from "./helpers.js"

type QuoteListQuery = z.infer<typeof quoteListQuerySchema>
type CreateQuoteInput = z.infer<typeof insertQuoteSchema>
type UpdateQuoteInput = z.infer<typeof updateQuoteSchema>
type CreateQuoteLineInput = z.infer<typeof insertQuoteLineSchema>
type UpdateQuoteLineInput = z.infer<typeof updateQuoteLineSchema>

export const quotesService = {
  async listQuotes(db: PostgresJsDatabase, query: QuoteListQuery) {
    const conditions = []
    if (query.opportunityId) conditions.push(eq(quotes.opportunityId, query.opportunityId))
    if (query.status) conditions.push(eq(quotes.status, query.status))
    const where = conditions.length ? and(...conditions) : undefined

    return paginate(
      db
        .select()
        .from(quotes)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(desc(quotes.updatedAt)),
      db.select({ count: sql<number>`count(*)::int` }).from(quotes).where(where),
      query.limit,
      query.offset,
    )
  },

  async getQuoteById(db: PostgresJsDatabase, id: string) {
    const [row] = await db.select().from(quotes).where(eq(quotes.id, id)).limit(1)
    return row ?? null
  },

  async createQuote(db: PostgresJsDatabase, data: CreateQuoteInput) {
    const [row] = await db.insert(quotes).values(data).returning()
    return row
  },

  async updateQuote(db: PostgresJsDatabase, id: string, data: UpdateQuoteInput) {
    const [row] = await db
      .update(quotes)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(quotes.id, id))
      .returning()
    return row ?? null
  },

  async deleteQuote(db: PostgresJsDatabase, id: string) {
    const [row] = await db.delete(quotes).where(eq(quotes.id, id)).returning({ id: quotes.id })
    return row ?? null
  },

  listQuoteLines(db: PostgresJsDatabase, quoteId: string) {
    return db
      .select()
      .from(quoteLines)
      .where(eq(quoteLines.quoteId, quoteId))
      .orderBy(quoteLines.createdAt)
  },

  async createQuoteLine(db: PostgresJsDatabase, quoteId: string, data: CreateQuoteLineInput) {
    const [row] = await db
      .insert(quoteLines)
      .values({ ...data, quoteId })
      .returning()
    return row
  },

  async updateQuoteLine(db: PostgresJsDatabase, id: string, data: UpdateQuoteLineInput) {
    const [row] = await db
      .update(quoteLines)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(quoteLines.id, id))
      .returning()
    return row ?? null
  },

  async deleteQuoteLine(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(quoteLines)
      .where(eq(quoteLines.id, id))
      .returning({ id: quoteLines.id })
    return row ?? null
  },
}
