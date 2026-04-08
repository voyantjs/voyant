import { and, desc, eq, ilike, or, sql } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import type { z } from "zod"

import { opportunities, opportunityParticipants, opportunityProducts } from "../schema.js"
import type {
  insertOpportunityParticipantSchema,
  insertOpportunityProductSchema,
  insertOpportunitySchema,
  opportunityListQuerySchema,
  updateOpportunityProductSchema,
  updateOpportunitySchema,
} from "../validation.js"
import { paginate } from "./helpers.js"

type OpportunityListQuery = z.infer<typeof opportunityListQuerySchema>
type CreateOpportunityInput = z.infer<typeof insertOpportunitySchema>
type UpdateOpportunityInput = z.infer<typeof updateOpportunitySchema>
type CreateOpportunityParticipantInput = z.infer<typeof insertOpportunityParticipantSchema>
type CreateOpportunityProductInput = z.infer<typeof insertOpportunityProductSchema>
type UpdateOpportunityProductInput = z.infer<typeof updateOpportunityProductSchema>

export const opportunitiesService = {
  async listOpportunities(db: PostgresJsDatabase, query: OpportunityListQuery) {
    const conditions = []

    if (query.personId) conditions.push(eq(opportunities.personId, query.personId))
    if (query.organizationId)
      conditions.push(eq(opportunities.organizationId, query.organizationId))
    if (query.pipelineId) conditions.push(eq(opportunities.pipelineId, query.pipelineId))
    if (query.stageId) conditions.push(eq(opportunities.stageId, query.stageId))
    if (query.ownerId) conditions.push(eq(opportunities.ownerId, query.ownerId))
    if (query.status) conditions.push(eq(opportunities.status, query.status))
    if (query.search) {
      const term = `%${query.search}%`
      conditions.push(
        or(
          ilike(opportunities.title, term),
          ilike(opportunities.source, term),
          ilike(opportunities.sourceRef, term),
        ),
      )
    }

    const where = conditions.length ? and(...conditions) : undefined
    return paginate(
      db
        .select()
        .from(opportunities)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(desc(opportunities.updatedAt)),
      db.select({ count: sql<number>`count(*)::int` }).from(opportunities).where(where),
      query.limit,
      query.offset,
    )
  },

  async getOpportunityById(db: PostgresJsDatabase, id: string) {
    const [row] = await db.select().from(opportunities).where(eq(opportunities.id, id)).limit(1)
    return row ?? null
  },

  async createOpportunity(db: PostgresJsDatabase, data: CreateOpportunityInput) {
    const [row] = await db.insert(opportunities).values(data).returning()
    return row
  },

  async updateOpportunity(db: PostgresJsDatabase, id: string, data: UpdateOpportunityInput) {
    const patch: UpdateOpportunityInput & {
      updatedAt: Date
      stageChangedAt?: Date
      closedAt?: Date | null
    } = {
      ...data,
      updatedAt: new Date(),
    }

    if (data.stageId) patch.stageChangedAt = new Date()
    if (data.status && data.status !== "open") {
      patch.closedAt = new Date()
    }
    if (data.status === "open") {
      patch.closedAt = null
    }

    const [row] = await db
      .update(opportunities)
      .set(patch)
      .where(eq(opportunities.id, id))
      .returning()
    return row ?? null
  },

  async deleteOpportunity(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(opportunities)
      .where(eq(opportunities.id, id))
      .returning({ id: opportunities.id })
    return row ?? null
  },

  listOpportunityParticipants(db: PostgresJsDatabase, opportunityId: string) {
    return db
      .select()
      .from(opportunityParticipants)
      .where(eq(opportunityParticipants.opportunityId, opportunityId))
      .orderBy(desc(opportunityParticipants.isPrimary), opportunityParticipants.createdAt)
  },

  async createOpportunityParticipant(
    db: PostgresJsDatabase,
    opportunityId: string,
    data: CreateOpportunityParticipantInput,
  ) {
    const [row] = await db
      .insert(opportunityParticipants)
      .values({ ...data, opportunityId })
      .returning()
    return row
  },

  async deleteOpportunityParticipant(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(opportunityParticipants)
      .where(eq(opportunityParticipants.id, id))
      .returning({ id: opportunityParticipants.id })
    return row ?? null
  },

  listOpportunityProducts(db: PostgresJsDatabase, opportunityId: string) {
    return db
      .select()
      .from(opportunityProducts)
      .where(eq(opportunityProducts.opportunityId, opportunityId))
      .orderBy(opportunityProducts.createdAt)
  },

  async createOpportunityProduct(
    db: PostgresJsDatabase,
    opportunityId: string,
    data: CreateOpportunityProductInput,
  ) {
    const [row] = await db
      .insert(opportunityProducts)
      .values({ ...data, opportunityId })
      .returning()
    return row
  },

  async updateOpportunityProduct(
    db: PostgresJsDatabase,
    id: string,
    data: UpdateOpportunityProductInput,
  ) {
    const [row] = await db
      .update(opportunityProducts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(opportunityProducts.id, id))
      .returning()
    return row ?? null
  },

  async deleteOpportunityProduct(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(opportunityProducts)
      .where(eq(opportunityProducts.id, id))
      .returning({ id: opportunityProducts.id })
    return row ?? null
  },
}
