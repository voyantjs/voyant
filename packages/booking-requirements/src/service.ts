import { and, asc, desc, eq, sql } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import type { z } from "zod"

import {
  bookingAnswers,
  bookingQuestionExtraTriggers,
  bookingQuestionOptions,
  bookingQuestionOptionTriggers,
  bookingQuestionUnitTriggers,
  optionBookingQuestions,
  productBookingQuestions,
  productContactRequirements,
} from "./schema.js"
import type {
  bookingAnswerListQuerySchema,
  bookingQuestionExtraTriggerListQuerySchema,
  bookingQuestionOptionListQuerySchema,
  bookingQuestionOptionTriggerListQuerySchema,
  bookingQuestionUnitTriggerListQuerySchema,
  insertBookingAnswerSchema,
  insertBookingQuestionExtraTriggerSchema,
  insertBookingQuestionOptionSchema,
  insertBookingQuestionOptionTriggerSchema,
  insertBookingQuestionUnitTriggerSchema,
  insertOptionBookingQuestionSchema,
  insertProductBookingQuestionSchema,
  insertProductContactRequirementSchema,
  optionBookingQuestionListQuerySchema,
  productBookingQuestionListQuerySchema,
  productContactRequirementListQuerySchema,
  updateBookingAnswerSchema,
  updateBookingQuestionExtraTriggerSchema,
  updateBookingQuestionOptionSchema,
  updateBookingQuestionOptionTriggerSchema,
  updateBookingQuestionUnitTriggerSchema,
  updateOptionBookingQuestionSchema,
  updateProductBookingQuestionSchema,
  updateProductContactRequirementSchema,
} from "./validation.js"

type ProductContactRequirementListQuery = z.infer<typeof productContactRequirementListQuerySchema>
type ProductBookingQuestionListQuery = z.infer<typeof productBookingQuestionListQuerySchema>
type OptionBookingQuestionListQuery = z.infer<typeof optionBookingQuestionListQuerySchema>
type BookingQuestionOptionListQuery = z.infer<typeof bookingQuestionOptionListQuerySchema>
type BookingQuestionUnitTriggerListQuery = z.infer<typeof bookingQuestionUnitTriggerListQuerySchema>
type BookingQuestionOptionTriggerListQuery = z.infer<
  typeof bookingQuestionOptionTriggerListQuerySchema
>
type BookingQuestionExtraTriggerListQuery = z.infer<
  typeof bookingQuestionExtraTriggerListQuerySchema
>
type BookingAnswerListQuery = z.infer<typeof bookingAnswerListQuerySchema>

type CreateProductContactRequirementInput = z.infer<typeof insertProductContactRequirementSchema>
type UpdateProductContactRequirementInput = z.infer<typeof updateProductContactRequirementSchema>
type CreateProductBookingQuestionInput = z.infer<typeof insertProductBookingQuestionSchema>
type UpdateProductBookingQuestionInput = z.infer<typeof updateProductBookingQuestionSchema>
type CreateOptionBookingQuestionInput = z.infer<typeof insertOptionBookingQuestionSchema>
type UpdateOptionBookingQuestionInput = z.infer<typeof updateOptionBookingQuestionSchema>
type CreateBookingQuestionOptionInput = z.infer<typeof insertBookingQuestionOptionSchema>
type UpdateBookingQuestionOptionInput = z.infer<typeof updateBookingQuestionOptionSchema>
type CreateBookingQuestionUnitTriggerInput = z.infer<typeof insertBookingQuestionUnitTriggerSchema>
type UpdateBookingQuestionUnitTriggerInput = z.infer<typeof updateBookingQuestionUnitTriggerSchema>
type CreateBookingQuestionOptionTriggerInput = z.infer<
  typeof insertBookingQuestionOptionTriggerSchema
>
type UpdateBookingQuestionOptionTriggerInput = z.infer<
  typeof updateBookingQuestionOptionTriggerSchema
>
type CreateBookingQuestionExtraTriggerInput = z.infer<
  typeof insertBookingQuestionExtraTriggerSchema
>
type UpdateBookingQuestionExtraTriggerInput = z.infer<
  typeof updateBookingQuestionExtraTriggerSchema
>
type CreateBookingAnswerInput = z.infer<typeof insertBookingAnswerSchema>
type UpdateBookingAnswerInput = z.infer<typeof updateBookingAnswerSchema>

async function paginate<T extends object>(
  rowsQuery: Promise<T[]>,
  countQuery: Promise<Array<{ count: number }>>,
  limit: number,
  offset: number,
) {
  const [data, countResult] = await Promise.all([rowsQuery, countQuery])
  return { data, total: countResult[0]?.count ?? 0, limit, offset }
}

export const bookingRequirementsService = {
  async listProductContactRequirements(
    db: PostgresJsDatabase,
    query: ProductContactRequirementListQuery,
  ) {
    const conditions = []
    if (query.productId) conditions.push(eq(productContactRequirements.productId, query.productId))
    if (query.optionId) conditions.push(eq(productContactRequirements.optionId, query.optionId))
    if (query.active !== undefined)
      conditions.push(eq(productContactRequirements.active, query.active))
    const where = conditions.length ? and(...conditions) : undefined
    return paginate(
      db
        .select()
        .from(productContactRequirements)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(asc(productContactRequirements.sortOrder)),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(productContactRequirements)
        .where(where),
      query.limit,
      query.offset,
    )
  },

  async getProductContactRequirementById(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .select()
      .from(productContactRequirements)
      .where(eq(productContactRequirements.id, id))
      .limit(1)
    return row ?? null
  },

  async createProductContactRequirement(
    db: PostgresJsDatabase,
    data: CreateProductContactRequirementInput,
  ) {
    const [row] = await db.insert(productContactRequirements).values(data).returning()
    return row ?? null
  },

  async updateProductContactRequirement(
    db: PostgresJsDatabase,
    id: string,
    data: UpdateProductContactRequirementInput,
  ) {
    const [row] = await db
      .update(productContactRequirements)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(productContactRequirements.id, id))
      .returning()
    return row ?? null
  },

  async deleteProductContactRequirement(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(productContactRequirements)
      .where(eq(productContactRequirements.id, id))
      .returning({ id: productContactRequirements.id })
    return row ?? null
  },

  async listProductBookingQuestions(
    db: PostgresJsDatabase,
    query: ProductBookingQuestionListQuery,
  ) {
    const conditions = []
    if (query.productId) conditions.push(eq(productBookingQuestions.productId, query.productId))
    if (query.target) conditions.push(eq(productBookingQuestions.target, query.target))
    if (query.fieldType) conditions.push(eq(productBookingQuestions.fieldType, query.fieldType))
    if (query.active !== undefined)
      conditions.push(eq(productBookingQuestions.active, query.active))
    const where = conditions.length ? and(...conditions) : undefined
    return paginate(
      db
        .select()
        .from(productBookingQuestions)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(asc(productBookingQuestions.sortOrder)),
      db.select({ count: sql<number>`count(*)::int` }).from(productBookingQuestions).where(where),
      query.limit,
      query.offset,
    )
  },

  async getProductBookingQuestionById(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .select()
      .from(productBookingQuestions)
      .where(eq(productBookingQuestions.id, id))
      .limit(1)
    return row ?? null
  },

  async createProductBookingQuestion(
    db: PostgresJsDatabase,
    data: CreateProductBookingQuestionInput,
  ) {
    const [row] = await db.insert(productBookingQuestions).values(data).returning()
    return row ?? null
  },

  async updateProductBookingQuestion(
    db: PostgresJsDatabase,
    id: string,
    data: UpdateProductBookingQuestionInput,
  ) {
    const [row] = await db
      .update(productBookingQuestions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(productBookingQuestions.id, id))
      .returning()
    return row ?? null
  },

  async deleteProductBookingQuestion(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(productBookingQuestions)
      .where(eq(productBookingQuestions.id, id))
      .returning({ id: productBookingQuestions.id })
    return row ?? null
  },

  async listOptionBookingQuestions(db: PostgresJsDatabase, query: OptionBookingQuestionListQuery) {
    const conditions = []
    if (query.optionId) conditions.push(eq(optionBookingQuestions.optionId, query.optionId))
    if (query.productBookingQuestionId)
      conditions.push(
        eq(optionBookingQuestions.productBookingQuestionId, query.productBookingQuestionId),
      )
    if (query.active !== undefined) conditions.push(eq(optionBookingQuestions.active, query.active))
    const where = conditions.length ? and(...conditions) : undefined
    return paginate(
      db
        .select()
        .from(optionBookingQuestions)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(asc(optionBookingQuestions.sortOrder)),
      db.select({ count: sql<number>`count(*)::int` }).from(optionBookingQuestions).where(where),
      query.limit,
      query.offset,
    )
  },

  async getOptionBookingQuestionById(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .select()
      .from(optionBookingQuestions)
      .where(eq(optionBookingQuestions.id, id))
      .limit(1)
    return row ?? null
  },

  async createOptionBookingQuestion(
    db: PostgresJsDatabase,
    data: CreateOptionBookingQuestionInput,
  ) {
    const [row] = await db.insert(optionBookingQuestions).values(data).returning()
    return row ?? null
  },

  async updateOptionBookingQuestion(
    db: PostgresJsDatabase,
    id: string,
    data: UpdateOptionBookingQuestionInput,
  ) {
    const [row] = await db
      .update(optionBookingQuestions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(optionBookingQuestions.id, id))
      .returning()
    return row ?? null
  },

  async deleteOptionBookingQuestion(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(optionBookingQuestions)
      .where(eq(optionBookingQuestions.id, id))
      .returning({ id: optionBookingQuestions.id })
    return row ?? null
  },

  async listBookingQuestionOptions(db: PostgresJsDatabase, query: BookingQuestionOptionListQuery) {
    const conditions = []
    if (query.productBookingQuestionId)
      conditions.push(
        eq(bookingQuestionOptions.productBookingQuestionId, query.productBookingQuestionId),
      )
    if (query.active !== undefined) conditions.push(eq(bookingQuestionOptions.active, query.active))
    const where = conditions.length ? and(...conditions) : undefined
    return paginate(
      db
        .select()
        .from(bookingQuestionOptions)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(asc(bookingQuestionOptions.sortOrder)),
      db.select({ count: sql<number>`count(*)::int` }).from(bookingQuestionOptions).where(where),
      query.limit,
      query.offset,
    )
  },

  async getBookingQuestionOptionById(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .select()
      .from(bookingQuestionOptions)
      .where(eq(bookingQuestionOptions.id, id))
      .limit(1)
    return row ?? null
  },

  async createBookingQuestionOption(
    db: PostgresJsDatabase,
    data: CreateBookingQuestionOptionInput,
  ) {
    const [row] = await db.insert(bookingQuestionOptions).values(data).returning()
    return row ?? null
  },

  async updateBookingQuestionOption(
    db: PostgresJsDatabase,
    id: string,
    data: UpdateBookingQuestionOptionInput,
  ) {
    const [row] = await db
      .update(bookingQuestionOptions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(bookingQuestionOptions.id, id))
      .returning()
    return row ?? null
  },

  async deleteBookingQuestionOption(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(bookingQuestionOptions)
      .where(eq(bookingQuestionOptions.id, id))
      .returning({ id: bookingQuestionOptions.id })
    return row ?? null
  },

  async listBookingQuestionUnitTriggers(
    db: PostgresJsDatabase,
    query: BookingQuestionUnitTriggerListQuery,
  ) {
    const conditions = []
    if (query.productBookingQuestionId)
      conditions.push(
        eq(bookingQuestionUnitTriggers.productBookingQuestionId, query.productBookingQuestionId),
      )
    if (query.unitId) conditions.push(eq(bookingQuestionUnitTriggers.unitId, query.unitId))
    if (query.active !== undefined)
      conditions.push(eq(bookingQuestionUnitTriggers.active, query.active))
    const where = conditions.length ? and(...conditions) : undefined
    return paginate(
      db
        .select()
        .from(bookingQuestionUnitTriggers)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(desc(bookingQuestionUnitTriggers.createdAt)),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(bookingQuestionUnitTriggers)
        .where(where),
      query.limit,
      query.offset,
    )
  },

  async getBookingQuestionUnitTriggerById(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .select()
      .from(bookingQuestionUnitTriggers)
      .where(eq(bookingQuestionUnitTriggers.id, id))
      .limit(1)
    return row ?? null
  },

  async createBookingQuestionUnitTrigger(
    db: PostgresJsDatabase,
    data: CreateBookingQuestionUnitTriggerInput,
  ) {
    const [row] = await db.insert(bookingQuestionUnitTriggers).values(data).returning()
    return row ?? null
  },

  async updateBookingQuestionUnitTrigger(
    db: PostgresJsDatabase,
    id: string,
    data: UpdateBookingQuestionUnitTriggerInput,
  ) {
    const [row] = await db
      .update(bookingQuestionUnitTriggers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(bookingQuestionUnitTriggers.id, id))
      .returning()
    return row ?? null
  },

  async deleteBookingQuestionUnitTrigger(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(bookingQuestionUnitTriggers)
      .where(eq(bookingQuestionUnitTriggers.id, id))
      .returning({ id: bookingQuestionUnitTriggers.id })
    return row ?? null
  },

  async listBookingQuestionOptionTriggers(
    db: PostgresJsDatabase,
    query: BookingQuestionOptionTriggerListQuery,
  ) {
    const conditions = []
    if (query.productBookingQuestionId)
      conditions.push(
        eq(bookingQuestionOptionTriggers.productBookingQuestionId, query.productBookingQuestionId),
      )
    if (query.optionId) conditions.push(eq(bookingQuestionOptionTriggers.optionId, query.optionId))
    if (query.active !== undefined)
      conditions.push(eq(bookingQuestionOptionTriggers.active, query.active))
    const where = conditions.length ? and(...conditions) : undefined
    return paginate(
      db
        .select()
        .from(bookingQuestionOptionTriggers)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(desc(bookingQuestionOptionTriggers.createdAt)),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(bookingQuestionOptionTriggers)
        .where(where),
      query.limit,
      query.offset,
    )
  },

  async getBookingQuestionOptionTriggerById(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .select()
      .from(bookingQuestionOptionTriggers)
      .where(eq(bookingQuestionOptionTriggers.id, id))
      .limit(1)
    return row ?? null
  },

  async createBookingQuestionOptionTrigger(
    db: PostgresJsDatabase,
    data: CreateBookingQuestionOptionTriggerInput,
  ) {
    const [row] = await db.insert(bookingQuestionOptionTriggers).values(data).returning()
    return row ?? null
  },

  async updateBookingQuestionOptionTrigger(
    db: PostgresJsDatabase,
    id: string,
    data: UpdateBookingQuestionOptionTriggerInput,
  ) {
    const [row] = await db
      .update(bookingQuestionOptionTriggers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(bookingQuestionOptionTriggers.id, id))
      .returning()
    return row ?? null
  },

  async deleteBookingQuestionOptionTrigger(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(bookingQuestionOptionTriggers)
      .where(eq(bookingQuestionOptionTriggers.id, id))
      .returning({ id: bookingQuestionOptionTriggers.id })
    return row ?? null
  },

  async listBookingQuestionExtraTriggers(
    db: PostgresJsDatabase,
    query: BookingQuestionExtraTriggerListQuery,
  ) {
    const conditions = []
    if (query.productBookingQuestionId)
      conditions.push(
        eq(bookingQuestionExtraTriggers.productBookingQuestionId, query.productBookingQuestionId),
      )
    if (query.productExtraId)
      conditions.push(eq(bookingQuestionExtraTriggers.productExtraId, query.productExtraId))
    if (query.optionExtraConfigId)
      conditions.push(
        eq(bookingQuestionExtraTriggers.optionExtraConfigId, query.optionExtraConfigId),
      )
    if (query.active !== undefined)
      conditions.push(eq(bookingQuestionExtraTriggers.active, query.active))
    const where = conditions.length ? and(...conditions) : undefined
    return paginate(
      db
        .select()
        .from(bookingQuestionExtraTriggers)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(desc(bookingQuestionExtraTriggers.createdAt)),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(bookingQuestionExtraTriggers)
        .where(where),
      query.limit,
      query.offset,
    )
  },

  async getBookingQuestionExtraTriggerById(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .select()
      .from(bookingQuestionExtraTriggers)
      .where(eq(bookingQuestionExtraTriggers.id, id))
      .limit(1)
    return row ?? null
  },

  async createBookingQuestionExtraTrigger(
    db: PostgresJsDatabase,
    data: CreateBookingQuestionExtraTriggerInput,
  ) {
    const [row] = await db.insert(bookingQuestionExtraTriggers).values(data).returning()
    return row ?? null
  },

  async updateBookingQuestionExtraTrigger(
    db: PostgresJsDatabase,
    id: string,
    data: UpdateBookingQuestionExtraTriggerInput,
  ) {
    const [row] = await db
      .update(bookingQuestionExtraTriggers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(bookingQuestionExtraTriggers.id, id))
      .returning()
    return row ?? null
  },

  async deleteBookingQuestionExtraTrigger(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(bookingQuestionExtraTriggers)
      .where(eq(bookingQuestionExtraTriggers.id, id))
      .returning({ id: bookingQuestionExtraTriggers.id })
    return row ?? null
  },

  async listBookingAnswers(db: PostgresJsDatabase, query: BookingAnswerListQuery) {
    const conditions = []
    if (query.bookingId) conditions.push(eq(bookingAnswers.bookingId, query.bookingId))
    if (query.productBookingQuestionId)
      conditions.push(eq(bookingAnswers.productBookingQuestionId, query.productBookingQuestionId))
    if (query.bookingParticipantId)
      conditions.push(eq(bookingAnswers.bookingParticipantId, query.bookingParticipantId))
    if (query.bookingExtraId)
      conditions.push(eq(bookingAnswers.bookingExtraId, query.bookingExtraId))
    if (query.target) conditions.push(eq(bookingAnswers.target, query.target))
    const where = conditions.length ? and(...conditions) : undefined
    return paginate(
      db
        .select()
        .from(bookingAnswers)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(desc(bookingAnswers.updatedAt)),
      db.select({ count: sql<number>`count(*)::int` }).from(bookingAnswers).where(where),
      query.limit,
      query.offset,
    )
  },

  async getBookingAnswerById(db: PostgresJsDatabase, id: string) {
    const [row] = await db.select().from(bookingAnswers).where(eq(bookingAnswers.id, id)).limit(1)
    return row ?? null
  },

  async createBookingAnswer(db: PostgresJsDatabase, data: CreateBookingAnswerInput) {
    const [row] = await db.insert(bookingAnswers).values(data).returning()
    return row ?? null
  },

  async updateBookingAnswer(db: PostgresJsDatabase, id: string, data: UpdateBookingAnswerInput) {
    const [row] = await db
      .update(bookingAnswers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(bookingAnswers.id, id))
      .returning()
    return row ?? null
  },

  async deleteBookingAnswer(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(bookingAnswers)
      .where(eq(bookingAnswers.id, id))
      .returning({ id: bookingAnswers.id })
    return row ?? null
  },
}
