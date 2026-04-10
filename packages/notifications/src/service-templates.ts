import { desc, eq, ilike, or, sql } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"

import {
  notificationReminderRules,
  notificationReminderRuns,
  notificationTemplates,
} from "./schema.js"
import type {
  CreateNotificationReminderRuleInput,
  CreateNotificationTemplateInput,
  NotificationReminderRuleListQuery,
  NotificationReminderRunListQuery,
  NotificationTemplateListQuery,
  UpdateNotificationReminderRuleInput,
  UpdateNotificationTemplateInput,
} from "./service-shared.js"
import { buildWhereClause, paginate } from "./service-shared.js"

export async function listTemplates(db: PostgresJsDatabase, query: NotificationTemplateListQuery) {
  const conditions = []
  if (query.channel) conditions.push(eq(notificationTemplates.channel, query.channel))
  if (query.provider) conditions.push(eq(notificationTemplates.provider, query.provider))
  if (query.status) conditions.push(eq(notificationTemplates.status, query.status))
  if (query.search) {
    const term = `%${query.search}%`
    conditions.push(
      or(ilike(notificationTemplates.slug, term), ilike(notificationTemplates.name, term)),
    )
  }

  const where = buildWhereClause(conditions)
  return paginate(
    db
      .select()
      .from(notificationTemplates)
      .where(where)
      .limit(query.limit)
      .offset(query.offset)
      .orderBy(desc(notificationTemplates.updatedAt)),
    db.select({ total: sql<number>`count(*)::int` }).from(notificationTemplates).where(where),
    query.limit,
    query.offset,
  )
}

export async function getTemplateById(db: PostgresJsDatabase, id: string) {
  const [row] = await db
    .select()
    .from(notificationTemplates)
    .where(eq(notificationTemplates.id, id))
    .limit(1)
  return row ?? null
}

export async function getTemplateBySlug(db: PostgresJsDatabase, slug: string) {
  const [row] = await db
    .select()
    .from(notificationTemplates)
    .where(eq(notificationTemplates.slug, slug))
    .limit(1)
  return row ?? null
}

export async function createTemplate(
  db: PostgresJsDatabase,
  data: CreateNotificationTemplateInput,
) {
  const [row] = await db.insert(notificationTemplates).values(data).returning()
  return row ?? null
}

export async function updateTemplate(
  db: PostgresJsDatabase,
  id: string,
  data: UpdateNotificationTemplateInput,
) {
  const [row] = await db
    .update(notificationTemplates)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(notificationTemplates.id, id))
    .returning()
  return row ?? null
}

export async function listReminderRules(
  db: PostgresJsDatabase,
  query: NotificationReminderRuleListQuery,
) {
  const conditions = []
  if (query.status) conditions.push(eq(notificationReminderRules.status, query.status))
  if (query.targetType) conditions.push(eq(notificationReminderRules.targetType, query.targetType))
  if (query.channel) conditions.push(eq(notificationReminderRules.channel, query.channel))
  if (query.search) {
    const term = `%${query.search}%`
    conditions.push(
      or(ilike(notificationReminderRules.slug, term), ilike(notificationReminderRules.name, term)),
    )
  }

  const where = buildWhereClause(conditions)
  return paginate(
    db
      .select()
      .from(notificationReminderRules)
      .where(where)
      .limit(query.limit)
      .offset(query.offset)
      .orderBy(desc(notificationReminderRules.updatedAt)),
    db.select({ total: sql<number>`count(*)::int` }).from(notificationReminderRules).where(where),
    query.limit,
    query.offset,
  )
}

export async function getReminderRuleById(db: PostgresJsDatabase, id: string) {
  const [row] = await db
    .select()
    .from(notificationReminderRules)
    .where(eq(notificationReminderRules.id, id))
    .limit(1)
  return row ?? null
}

export async function createReminderRule(
  db: PostgresJsDatabase,
  data: CreateNotificationReminderRuleInput,
) {
  const [row] = await db.insert(notificationReminderRules).values(data).returning()
  return row ?? null
}

export async function updateReminderRule(
  db: PostgresJsDatabase,
  id: string,
  data: UpdateNotificationReminderRuleInput,
) {
  const [row] = await db
    .update(notificationReminderRules)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(notificationReminderRules.id, id))
    .returning()
  return row ?? null
}

export async function listReminderRuns(
  db: PostgresJsDatabase,
  query: NotificationReminderRunListQuery,
) {
  const conditions = []
  if (query.reminderRuleId) {
    conditions.push(eq(notificationReminderRuns.reminderRuleId, query.reminderRuleId))
  }
  if (query.targetType) conditions.push(eq(notificationReminderRuns.targetType, query.targetType))
  if (query.targetId) conditions.push(eq(notificationReminderRuns.targetId, query.targetId))
  if (query.bookingId) conditions.push(eq(notificationReminderRuns.bookingId, query.bookingId))
  if (query.status) conditions.push(eq(notificationReminderRuns.status, query.status))

  const where = buildWhereClause(conditions)
  return paginate(
    db
      .select()
      .from(notificationReminderRuns)
      .where(where)
      .limit(query.limit)
      .offset(query.offset)
      .orderBy(desc(notificationReminderRuns.createdAt)),
    db.select({ total: sql<number>`count(*)::int` }).from(notificationReminderRuns).where(where),
    query.limit,
    query.offset,
  )
}
