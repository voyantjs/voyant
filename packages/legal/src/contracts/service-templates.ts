import { and, desc, eq, ilike, or, sql } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"

import { contractTemplates, contractTemplateVersions } from "./schema.js"
import {
  type ContractTemplateListQuery,
  type CreateContractTemplateInput,
  type CreateContractTemplateVersionInput,
  paginate,
  type RenderTemplateInput,
  renderTemplate,
  type UpdateContractTemplateInput,
} from "./service-shared.js"

export const contractTemplatesService = {
  async listTemplates(db: PostgresJsDatabase, query: ContractTemplateListQuery) {
    const conditions = []
    if (query.scope) conditions.push(eq(contractTemplates.scope, query.scope))
    if (query.language) conditions.push(eq(contractTemplates.language, query.language))
    if (query.active !== undefined) conditions.push(eq(contractTemplates.active, query.active))
    if (query.search) {
      const term = `%${query.search}%`
      conditions.push(
        or(
          ilike(contractTemplates.name, term),
          ilike(contractTemplates.slug, term),
          ilike(contractTemplates.description, term),
        ),
      )
    }
    const where = conditions.length ? and(...conditions) : undefined
    return paginate(
      db
        .select()
        .from(contractTemplates)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(desc(contractTemplates.updatedAt)),
      db.select({ total: sql<number>`count(*)::int` }).from(contractTemplates).where(where),
      query.limit,
      query.offset,
    )
  },
  async getTemplateById(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .select()
      .from(contractTemplates)
      .where(eq(contractTemplates.id, id))
      .limit(1)
    return row ?? null
  },
  /**
   * Slug lookup, used by the auto-generate subscriber. Slug is unique so the
   * result is either the row or null — no disambiguation needed.
   */
  async findTemplateBySlug(db: PostgresJsDatabase, slug: string) {
    const [row] = await db
      .select()
      .from(contractTemplates)
      .where(eq(contractTemplates.slug, slug))
      .limit(1)
    return row ?? null
  },
  async getDefaultTemplate(
    db: PostgresJsDatabase,
    query: {
      scope: "customer" | "supplier" | "partner" | "channel" | "other"
      language?: string
      fallbackLanguages?: string[]
    },
  ) {
    const rows = await db
      .select()
      .from(contractTemplates)
      .where(and(eq(contractTemplates.scope, query.scope), eq(contractTemplates.active, true)))
      .orderBy(desc(contractTemplates.updatedAt))

    if (rows.length === 0) {
      return null
    }

    const preferredLanguages = [
      query.language?.trim().toLowerCase(),
      ...(query.fallbackLanguages ?? []).map((value) => value.trim().toLowerCase()),
    ].filter(
      (value, index, values): value is string => Boolean(value) && values.indexOf(value) === index,
    )

    if (preferredLanguages.length === 0) {
      return rows[0] ?? null
    }

    for (const language of preferredLanguages) {
      const match = rows.find((row) => row.language.trim().toLowerCase() === language)
      if (match) {
        return match
      }
    }

    return rows[0] ?? null
  },
  async createTemplate(db: PostgresJsDatabase, data: CreateContractTemplateInput) {
    const [row] = await db.insert(contractTemplates).values(data).returning()
    return row ?? null
  },
  async updateTemplate(db: PostgresJsDatabase, id: string, data: UpdateContractTemplateInput) {
    const [row] = await db
      .update(contractTemplates)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(contractTemplates.id, id))
      .returning()
    return row ?? null
  },
  async deleteTemplate(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(contractTemplates)
      .where(eq(contractTemplates.id, id))
      .returning({ id: contractTemplates.id })
    return row ?? null
  },
  listTemplateVersions(db: PostgresJsDatabase, templateId: string) {
    return db
      .select()
      .from(contractTemplateVersions)
      .where(eq(contractTemplateVersions.templateId, templateId))
      .orderBy(desc(contractTemplateVersions.version))
  },
  async getTemplateVersionById(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .select()
      .from(contractTemplateVersions)
      .where(eq(contractTemplateVersions.id, id))
      .limit(1)
    return row ?? null
  },
  async createTemplateVersion(
    db: PostgresJsDatabase,
    templateId: string,
    data: CreateContractTemplateVersionInput,
  ) {
    return db.transaction(async (tx) => {
      const [template] = await tx
        .select({ id: contractTemplates.id })
        .from(contractTemplates)
        .where(eq(contractTemplates.id, templateId))
        .limit(1)
      if (!template) return null
      const [maxRow] = await tx
        .select({ max: sql<number>`coalesce(max(${contractTemplateVersions.version}), 0)::int` })
        .from(contractTemplateVersions)
        .where(eq(contractTemplateVersions.templateId, templateId))
      const nextVersion = (maxRow?.max ?? 0) + 1
      const [version] = await tx
        .insert(contractTemplateVersions)
        .values({
          templateId,
          version: nextVersion,
          body: data.body,
          variableSchema: data.variableSchema ?? null,
          changelog: data.changelog ?? null,
          createdBy: data.createdBy ?? null,
        })
        .returning()
      if (version) {
        await tx
          .update(contractTemplates)
          .set({ currentVersionId: version.id, updatedAt: new Date() })
          .where(eq(contractTemplates.id, templateId))
      }
      return version ?? null
    })
  },
  renderPreview(input: RenderTemplateInput): string {
    const body = input.body ?? ""
    return renderTemplate(body, "html", input.variables)
  },
}
