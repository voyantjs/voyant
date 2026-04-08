import { and, desc, eq, ilike, or, sql } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import type { z } from "zod"

import {
  contractAttachments,
  contractNumberSeries,
  contractSignatures,
  contracts,
  contractTemplates,
  contractTemplateVersions,
} from "./schema.js"
import type {
  contractListQuerySchema,
  contractTemplateListQuerySchema,
  insertContractAttachmentSchema,
  insertContractNumberSeriesSchema,
  insertContractSchema,
  insertContractSignatureSchema,
  insertContractTemplateSchema,
  insertContractTemplateVersionSchema,
  renderTemplateInputSchema,
  updateContractAttachmentSchema,
  updateContractNumberSeriesSchema,
  updateContractSchema,
  updateContractTemplateSchema,
} from "./validation.js"

type ContractListQuery = z.infer<typeof contractListQuerySchema>
type ContractTemplateListQuery = z.infer<typeof contractTemplateListQuerySchema>
type CreateContractTemplateInput = z.infer<typeof insertContractTemplateSchema>
type UpdateContractTemplateInput = z.infer<typeof updateContractTemplateSchema>
type CreateContractTemplateVersionInput = z.infer<typeof insertContractTemplateVersionSchema>
type CreateContractNumberSeriesInput = z.infer<typeof insertContractNumberSeriesSchema>
type UpdateContractNumberSeriesInput = z.infer<typeof updateContractNumberSeriesSchema>
type CreateContractInput = z.infer<typeof insertContractSchema>
type UpdateContractInput = z.infer<typeof updateContractSchema>
type CreateContractSignatureInput = z.infer<typeof insertContractSignatureSchema>
type CreateContractAttachmentInput = z.infer<typeof insertContractAttachmentSchema>
type UpdateContractAttachmentInput = z.infer<typeof updateContractAttachmentSchema>
type RenderTemplateInput = z.infer<typeof renderTemplateInputSchema>

function toTimestamp(value?: string | null): Date | null {
  return value ? new Date(value) : null
}

// ============================================================================
// Template rendering
// ============================================================================

/**
 * Resolve a dot-path against an object, supporting array index accessors:
 *   "a.b.c"          → obj.a.b.c
 *   "arr[0].name"    → obj.arr[0].name
 *   "a.b[2].c"       → obj.a.b[2].c
 */
function resolvePath(obj: unknown, path: string): unknown {
  if (obj === null || obj === undefined) return undefined
  const segments: Array<string | number> = []
  const parts = path.split(".")
  for (const part of parts) {
    if (!part) continue
    // Match "name[0]" → ["name", 0]
    const indexMatches = [...part.matchAll(/([^[\]]+)|\[(\d+)\]/g)]
    for (const match of indexMatches) {
      if (match[1] !== undefined) segments.push(match[1])
      else if (match[2] !== undefined) segments.push(Number.parseInt(match[2], 10))
    }
  }
  let current: unknown = obj
  for (const seg of segments) {
    if (current === null || current === undefined) return undefined
    if (typeof seg === "number") {
      if (!Array.isArray(current)) return undefined
      current = current[seg]
    } else {
      if (typeof current !== "object") return undefined
      current = (current as Record<string, unknown>)[seg]
    }
  }
  return current
}

function stringifyValue(value: unknown): string {
  if (value === null || value === undefined) return ""
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  return JSON.stringify(value)
}

const MUSTACHE_RE = /\{\{\s*([^}]+?)\s*\}\}/g

function renderMustache(body: string, variables: Record<string, unknown>): string {
  return body.replace(MUSTACHE_RE, (_, path: string) => {
    const resolved = resolvePath(variables, path.trim())
    return stringifyValue(resolved)
  })
}

type LexicalNode = {
  type?: string
  text?: string
  children?: LexicalNode[]
  [key: string]: unknown
}

function walkLexical(node: LexicalNode, variables: Record<string, unknown>): LexicalNode {
  const next: LexicalNode = { ...node }
  if (typeof next.text === "string") {
    next.text = renderMustache(next.text, variables)
  }
  if (Array.isArray(next.children)) {
    next.children = next.children.map((child) => walkLexical(child, variables))
  }
  return next
}

/**
 * Substitute variables in a template body. Supports:
 * - markdown / html / plain text: mustache replacement `{{path.to.value}}`
 * - lexical_json: walks the AST, rewriting text nodes only
 */
export function renderTemplate(
  body: string,
  bodyFormat: "markdown" | "html" | "lexical_json",
  variables: Record<string, unknown>,
): string {
  if (bodyFormat === "lexical_json") {
    try {
      const parsed: unknown = JSON.parse(body)
      if (parsed && typeof parsed === "object") {
        const obj = parsed as { root?: unknown } & Record<string, unknown>
        if (obj.root && typeof obj.root === "object") {
          const result = { ...obj, root: walkLexical(obj.root as LexicalNode, variables) }
          return JSON.stringify(result)
        }
        return JSON.stringify(walkLexical(obj as LexicalNode, variables))
      }
      return body
    } catch {
      // Fall through to mustache on parse error (treat as string template)
      return renderMustache(body, variables)
    }
  }
  return renderMustache(body, variables)
}

/**
 * Validate variable values against a template's variableSchema (JSON object
 * shape describing required fields). Returns a list of issues; empty array
 * means valid.
 */
export function validateTemplateVariables(
  variableSchema: unknown,
  values: Record<string, unknown>,
): string[] {
  const issues: string[] = []
  if (!variableSchema || typeof variableSchema !== "object") return issues
  const schema = variableSchema as Record<string, unknown>
  const requiredList = Array.isArray(schema.required) ? (schema.required as string[]) : []
  for (const key of requiredList) {
    const resolved = resolvePath(values, key)
    if (resolved === undefined || resolved === null || resolved === "") {
      issues.push(`missing required variable: ${key}`)
    }
  }
  return issues
}

// ============================================================================
// Number allocation
// ============================================================================

function currentPeriodBoundary(strategy: "never" | "annual" | "monthly", now: Date): Date | null {
  if (strategy === "never") return null
  if (strategy === "annual") {
    return new Date(Date.UTC(now.getUTCFullYear(), 0, 1))
  }
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
}

function formatNumber(
  prefix: string,
  separator: string,
  sequence: number,
  padLength: number,
): string {
  const padded = String(sequence).padStart(padLength, "0")
  return `${prefix}${separator}${padded}`
}

/**
 * Transactionally allocate the next sequence number for a series. Honors the
 * reset strategy (never/annual/monthly). Uses SELECT ... FOR UPDATE to avoid
 * concurrent-increment races.
 */
export async function allocateContractNumber(
  db: PostgresJsDatabase,
  seriesId: string,
): Promise<{ number: string; sequence: number } | null> {
  return db.transaction(async (tx) => {
    const rows = await tx.execute(
      sql`SELECT * FROM ${contractNumberSeries}
          WHERE ${contractNumberSeries.id} = ${seriesId}
          FOR UPDATE`,
    )
    const row = (rows as unknown as Array<Record<string, unknown>>)[0]
    if (!row) return null

    const strategy = row.reset_strategy as "never" | "annual" | "monthly"
    const prefix = (row.prefix as string) ?? ""
    const separator = (row.separator as string) ?? ""
    const padLength = (row.pad_length as number) ?? 4
    const currentSequence = (row.current_sequence as number) ?? 0
    const resetAt = row.reset_at ? new Date(row.reset_at as string | Date) : null

    const now = new Date()
    const boundary = currentPeriodBoundary(strategy, now)
    const shouldReset =
      boundary !== null && (resetAt === null || resetAt.getTime() < boundary.getTime())

    const nextSequence = shouldReset ? 1 : currentSequence + 1
    const nextResetAt = strategy === "never" ? resetAt : boundary

    await tx
      .update(contractNumberSeries)
      .set({
        currentSequence: nextSequence,
        resetAt: nextResetAt,
        updatedAt: new Date(),
      })
      .where(eq(contractNumberSeries.id, seriesId))

    return {
      number: formatNumber(prefix, separator, nextSequence, padLength),
      sequence: nextSequence,
    }
  })
}

// ============================================================================
// Service
// ============================================================================

async function paginate<T extends object>(
  rowsQuery: Promise<T[]>,
  countQuery: Promise<Array<{ total: number }>>,
  limit: number,
  offset: number,
) {
  const [data, countResult] = await Promise.all([rowsQuery, countQuery])
  return { data, total: countResult[0]?.total ?? 0, limit, offset }
}

export const contractsService = {
  // ---------- contract templates ----------

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

  // ---------- contract template versions ----------

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
          bodyFormat: data.bodyFormat,
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

  // ---------- contract number series ----------

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

  // ---------- contracts ----------

  async listContracts(db: PostgresJsDatabase, query: ContractListQuery) {
    const conditions = []
    if (query.scope) conditions.push(eq(contracts.scope, query.scope))
    if (query.status) conditions.push(eq(contracts.status, query.status))
    if (query.personId) conditions.push(eq(contracts.personId, query.personId))
    if (query.organizationId) conditions.push(eq(contracts.organizationId, query.organizationId))
    if (query.supplierId) conditions.push(eq(contracts.supplierId, query.supplierId))
    if (query.bookingId) conditions.push(eq(contracts.bookingId, query.bookingId))
    if (query.orderId) conditions.push(eq(contracts.orderId, query.orderId))
    if (query.search) {
      const term = `%${query.search}%`
      conditions.push(or(ilike(contracts.title, term), ilike(contracts.contractNumber, term)))
    }
    const where = conditions.length ? and(...conditions) : undefined
    return paginate(
      db
        .select()
        .from(contracts)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(desc(contracts.createdAt)),
      db.select({ total: sql<number>`count(*)::int` }).from(contracts).where(where),
      query.limit,
      query.offset,
    )
  },

  async getContractById(db: PostgresJsDatabase, id: string) {
    const [row] = await db.select().from(contracts).where(eq(contracts.id, id)).limit(1)
    return row ?? null
  },

  async createContract(db: PostgresJsDatabase, data: CreateContractInput) {
    const [row] = await db
      .insert(contracts)
      .values({
        ...data,
        expiresAt: toTimestamp(data.expiresAt),
      })
      .returning()
    return row ?? null
  },

  async updateContract(db: PostgresJsDatabase, id: string, data: UpdateContractInput) {
    const [row] = await db
      .update(contracts)
      .set({
        ...data,
        expiresAt: data.expiresAt === undefined ? undefined : toTimestamp(data.expiresAt),
        updatedAt: new Date(),
      })
      .where(eq(contracts.id, id))
      .returning()
    return row ?? null
  },

  async deleteContract(db: PostgresJsDatabase, id: string) {
    const [existing] = await db
      .select({ id: contracts.id, status: contracts.status })
      .from(contracts)
      .where(eq(contracts.id, id))
      .limit(1)
    if (!existing) return { status: "not_found" as const }
    if (existing.status !== "draft") return { status: "not_draft" as const }
    await db.delete(contracts).where(eq(contracts.id, id))
    return { status: "deleted" as const }
  },

  // ---------- lifecycle actions ----------

  /**
   * Transition a draft contract to `issued`: renders body from the template
   * version, allocates a contract number if a series is set, timestamps
   * `issuedAt`. Returns null if contract is missing or not in `draft`.
   */
  async issueContract(db: PostgresJsDatabase, contractId: string) {
    return db.transaction(async (tx) => {
      const [contract] = await tx
        .select()
        .from(contracts)
        .where(eq(contracts.id, contractId))
        .limit(1)
      if (!contract) return { status: "not_found" as const }
      if (contract.status !== "draft") return { status: "not_draft" as const }

      // Render body from template version if referenced
      let renderedBody = contract.renderedBody
      let renderedBodyFormat = contract.renderedBodyFormat
      if (contract.templateVersionId) {
        const [version] = await tx
          .select()
          .from(contractTemplateVersions)
          .where(eq(contractTemplateVersions.id, contract.templateVersionId))
          .limit(1)
        if (version) {
          const vars = (contract.variables as Record<string, unknown>) ?? {}
          renderedBody = renderTemplate(version.body, version.bodyFormat, vars)
          renderedBodyFormat = version.bodyFormat
        }
      }

      // Allocate contract number if not already set and a series is linked
      let contractNumber = contract.contractNumber
      if (!contractNumber && contract.seriesId) {
        const allocated = await allocateContractNumber(tx as PostgresJsDatabase, contract.seriesId)
        if (allocated) contractNumber = allocated.number
      }

      const [updated] = await tx
        .update(contracts)
        .set({
          status: "issued",
          issuedAt: new Date(),
          renderedBody,
          renderedBodyFormat,
          contractNumber,
          updatedAt: new Date(),
        })
        .where(eq(contracts.id, contractId))
        .returning()

      return { status: "issued" as const, contract: updated ?? null }
    })
  },

  async sendContract(db: PostgresJsDatabase, contractId: string) {
    const [contract] = await db
      .select({ id: contracts.id, status: contracts.status })
      .from(contracts)
      .where(eq(contracts.id, contractId))
      .limit(1)
    if (!contract) return { status: "not_found" as const }
    if (contract.status !== "issued" && contract.status !== "sent") {
      return { status: "not_issued" as const }
    }
    const [updated] = await db
      .update(contracts)
      .set({ status: "sent", sentAt: new Date(), updatedAt: new Date() })
      .where(eq(contracts.id, contractId))
      .returning()
    return { status: "sent" as const, contract: updated ?? null }
  },

  async voidContract(db: PostgresJsDatabase, contractId: string) {
    const [contract] = await db
      .select({ id: contracts.id, status: contracts.status })
      .from(contracts)
      .where(eq(contracts.id, contractId))
      .limit(1)
    if (!contract) return { status: "not_found" as const }
    if (contract.status === "void") return { status: "already_void" as const }
    const [updated] = await db
      .update(contracts)
      .set({ status: "void", voidedAt: new Date(), updatedAt: new Date() })
      .where(eq(contracts.id, contractId))
      .returning()
    return { status: "voided" as const, contract: updated ?? null }
  },

  // ---------- signatures ----------

  listSignatures(db: PostgresJsDatabase, contractId: string) {
    return db
      .select()
      .from(contractSignatures)
      .where(eq(contractSignatures.contractId, contractId))
      .orderBy(desc(contractSignatures.signedAt))
  },

  async signContract(
    db: PostgresJsDatabase,
    contractId: string,
    data: CreateContractSignatureInput,
  ) {
    return db.transaction(async (tx) => {
      const [contract] = await tx
        .select()
        .from(contracts)
        .where(eq(contracts.id, contractId))
        .limit(1)
      if (!contract) return { status: "not_found" as const }
      if (contract.status !== "issued" && contract.status !== "sent") {
        return { status: "not_signable" as const }
      }

      const [signature] = await tx
        .insert(contractSignatures)
        .values({ ...data, contractId })
        .returning()

      // Transition: first signature → signed; two-party → executed if both sides signed.
      // MVP: single-signer flow → mark as "signed". Callers that need multi-party
      // workflows should issue additional signatures and explicitly call execute.
      const [updated] = await tx
        .update(contracts)
        .set({ status: "signed", updatedAt: new Date() })
        .where(eq(contracts.id, contractId))
        .returning()

      return { status: "signed" as const, contract: updated ?? null, signature: signature ?? null }
    })
  },

  async executeContract(db: PostgresJsDatabase, contractId: string) {
    const [contract] = await db
      .select({ id: contracts.id, status: contracts.status })
      .from(contracts)
      .where(eq(contracts.id, contractId))
      .limit(1)
    if (!contract) return { status: "not_found" as const }
    if (contract.status !== "signed") return { status: "not_signed" as const }
    const [updated] = await db
      .update(contracts)
      .set({ status: "executed", executedAt: new Date(), updatedAt: new Date() })
      .where(eq(contracts.id, contractId))
      .returning()
    return { status: "executed" as const, contract: updated ?? null }
  },

  // ---------- attachments ----------

  listAttachments(db: PostgresJsDatabase, contractId: string) {
    return db
      .select()
      .from(contractAttachments)
      .where(eq(contractAttachments.contractId, contractId))
      .orderBy(desc(contractAttachments.createdAt))
  },

  async createAttachment(
    db: PostgresJsDatabase,
    contractId: string,
    data: CreateContractAttachmentInput,
  ) {
    const [contract] = await db
      .select({ id: contracts.id })
      .from(contracts)
      .where(eq(contracts.id, contractId))
      .limit(1)
    if (!contract) return null
    const [row] = await db
      .insert(contractAttachments)
      .values({ ...data, contractId })
      .returning()
    return row ?? null
  },

  async updateAttachment(
    db: PostgresJsDatabase,
    attachmentId: string,
    data: UpdateContractAttachmentInput,
  ) {
    const [row] = await db
      .update(contractAttachments)
      .set(data)
      .where(eq(contractAttachments.id, attachmentId))
      .returning()
    return row ?? null
  },

  async deleteAttachment(db: PostgresJsDatabase, attachmentId: string) {
    const [row] = await db
      .delete(contractAttachments)
      .where(eq(contractAttachments.id, attachmentId))
      .returning({ id: contractAttachments.id })
    return row ?? null
  },

  // ---------- preview ----------

  /**
   * Preview render: substitute variables against an arbitrary body without
   * touching the database. Used by `/v1/admin/contracts/:id/render` and
   * `/v1/admin/contracts/templates/:id/preview`.
   */
  renderPreview(input: RenderTemplateInput): string {
    const body = input.body ?? ""
    const format = input.bodyFormat ?? "markdown"
    return renderTemplate(body, format, input.variables)
  },
}
