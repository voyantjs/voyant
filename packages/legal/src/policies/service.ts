import { and, desc, eq, gte, ilike, inArray, lte, or, sql } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import type { z } from "zod"

import {
  policies,
  policyAcceptances,
  policyAssignments,
  policyRules,
  policyVersions,
} from "./schema.js"
import type {
  evaluateCancellationInputSchema,
  insertPolicyAcceptanceSchema,
  insertPolicyAssignmentSchema,
  insertPolicyRuleSchema,
  insertPolicySchema,
  insertPolicyVersionSchema,
  policyAcceptanceListQuerySchema,
  policyAssignmentListQuerySchema,
  policyListQuerySchema,
  resolvePolicyInputSchema,
  updatePolicyAssignmentSchema,
  updatePolicyRuleSchema,
  updatePolicySchema,
  updatePolicyVersionSchema,
} from "./validation.js"

type PolicyListQuery = z.infer<typeof policyListQuerySchema>
type CreatePolicyInput = z.infer<typeof insertPolicySchema>
type UpdatePolicyInput = z.infer<typeof updatePolicySchema>
type CreatePolicyVersionInput = z.infer<typeof insertPolicyVersionSchema>
type UpdatePolicyVersionInput = z.infer<typeof updatePolicyVersionSchema>
type CreatePolicyRuleInput = z.infer<typeof insertPolicyRuleSchema>
type UpdatePolicyRuleInput = z.infer<typeof updatePolicyRuleSchema>
type CreatePolicyAssignmentInput = z.infer<typeof insertPolicyAssignmentSchema>
type UpdatePolicyAssignmentInput = z.infer<typeof updatePolicyAssignmentSchema>
type PolicyAssignmentListQuery = z.infer<typeof policyAssignmentListQuerySchema>
type CreatePolicyAcceptanceInput = z.infer<typeof insertPolicyAcceptanceSchema>
type PolicyAcceptanceListQuery = z.infer<typeof policyAcceptanceListQuerySchema>
type EvaluateCancellationInput = z.infer<typeof evaluateCancellationInputSchema>
type ResolvePolicyInput = z.infer<typeof resolvePolicyInputSchema>

async function paginate<T extends object>(
  rowsQuery: Promise<T[]>,
  countQuery: Promise<Array<{ total: number }>>,
  limit: number,
  offset: number,
) {
  const [data, countResult] = await Promise.all([rowsQuery, countQuery])
  return { data, total: countResult[0]?.total ?? 0, limit, offset }
}

function toDateString(value?: string | null): string | null {
  return value ?? null
}

// ============================================================================
// Cancellation evaluator (pure function)
// ============================================================================

export type CancellationRule = {
  id?: string
  daysBeforeDeparture: number | null
  refundPercent: number | null
  refundType: "cash" | "credit" | "cash_or_credit" | "none" | null
  flatAmountCents: number | null
  label: string | null
}

export type CancellationResult = {
  refundPercent: number
  refundCents: number
  refundType: "cash" | "credit" | "cash_or_credit" | "none"
  appliedRule: CancellationRule | null
}

/**
 * Evaluate a cancellation policy against a context. Rules are sorted descending
 * by `daysBeforeDeparture`; the first rule whose threshold is satisfied by the
 * input's `daysBeforeDeparture` is applied. `refundPercent` is expressed in
 * basis points (0-10000 where 10000 = 100%).
 */
export function evaluateCancellationPolicy(
  rules: CancellationRule[],
  input: EvaluateCancellationInput,
): CancellationResult {
  if (rules.length === 0) {
    return { refundPercent: 0, refundCents: 0, refundType: "none", appliedRule: null }
  }

  // Sort by daysBeforeDeparture DESC; nulls float to the bottom
  const sorted = [...rules].sort((a, b) => {
    const ad = a.daysBeforeDeparture ?? Number.NEGATIVE_INFINITY
    const bd = b.daysBeforeDeparture ?? Number.NEGATIVE_INFINITY
    return bd - ad
  })

  const applied =
    sorted.find(
      (rule) =>
        rule.daysBeforeDeparture !== null && input.daysBeforeDeparture >= rule.daysBeforeDeparture,
    ) ??
    // fallback: last rule (lowest threshold) applies when caller is inside
    // the tightest window
    sorted[sorted.length - 1] ??
    null

  if (!applied) {
    return { refundPercent: 0, refundCents: 0, refundType: "none", appliedRule: null }
  }

  const refundPercent = applied.refundPercent ?? 0
  const refundType = applied.refundType ?? "none"
  // basis points → amount
  const percentageRefundCents = Math.floor((input.totalCents * refundPercent) / 10000)
  const refundCents = applied.flatAmountCents ?? percentageRefundCents

  return { refundPercent, refundCents, refundType, appliedRule: applied }
}

// ============================================================================
// Service
// ============================================================================

export const policiesService = {
  // ---------- policies ----------

  async listPolicies(db: PostgresJsDatabase, query: PolicyListQuery) {
    const conditions = []
    if (query.kind) conditions.push(eq(policies.kind, query.kind))
    if (query.language) conditions.push(eq(policies.language, query.language))
    if (query.search) {
      const term = `%${query.search}%`
      conditions.push(
        or(
          ilike(policies.name, term),
          ilike(policies.slug, term),
          ilike(policies.description, term),
        ),
      )
    }
    const where = conditions.length ? and(...conditions) : undefined
    return paginate(
      db
        .select()
        .from(policies)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(desc(policies.updatedAt)),
      db.select({ total: sql<number>`count(*)::int` }).from(policies).where(where),
      query.limit,
      query.offset,
    )
  },

  async getPolicyById(db: PostgresJsDatabase, id: string) {
    const [row] = await db.select().from(policies).where(eq(policies.id, id)).limit(1)
    return row ?? null
  },

  async getPolicyBySlug(db: PostgresJsDatabase, slug: string) {
    const [row] = await db.select().from(policies).where(eq(policies.slug, slug)).limit(1)
    return row ?? null
  },

  async createPolicy(db: PostgresJsDatabase, data: CreatePolicyInput) {
    const [row] = await db.insert(policies).values(data).returning()
    return row ?? null
  },

  async updatePolicy(db: PostgresJsDatabase, id: string, data: UpdatePolicyInput) {
    const [row] = await db
      .update(policies)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(policies.id, id))
      .returning()
    return row ?? null
  },

  async deletePolicy(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(policies)
      .where(eq(policies.id, id))
      .returning({ id: policies.id })
    return row ?? null
  },

  // ---------- versions ----------

  listPolicyVersions(db: PostgresJsDatabase, policyId: string) {
    return db
      .select()
      .from(policyVersions)
      .where(eq(policyVersions.policyId, policyId))
      .orderBy(desc(policyVersions.version))
  },

  async getPolicyVersionById(db: PostgresJsDatabase, id: string) {
    const [row] = await db.select().from(policyVersions).where(eq(policyVersions.id, id)).limit(1)
    return row ?? null
  },

  async createPolicyVersion(
    db: PostgresJsDatabase,
    policyId: string,
    data: CreatePolicyVersionInput,
  ) {
    return db.transaction(async (tx) => {
      const [policy] = await tx
        .select({ id: policies.id })
        .from(policies)
        .where(eq(policies.id, policyId))
        .limit(1)
      if (!policy) return null

      const [maxRow] = await tx
        .select({ max: sql<number>`coalesce(max(${policyVersions.version}), 0)::int` })
        .from(policyVersions)
        .where(eq(policyVersions.policyId, policyId))
      const nextVersion = (maxRow?.max ?? 0) + 1

      const [row] = await tx
        .insert(policyVersions)
        .values({
          policyId,
          version: nextVersion,
          status: "draft",
          title: data.title,
          bodyFormat: data.bodyFormat,
          body: data.body ?? null,
          publishedBy: data.publishedBy ?? null,
          metadata: data.metadata ?? null,
        })
        .returning()
      return row ?? null
    })
  },

  async updatePolicyVersion(
    db: PostgresJsDatabase,
    versionId: string,
    data: UpdatePolicyVersionInput,
  ) {
    // Only draft versions are editable
    const [row] = await db
      .update(policyVersions)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(policyVersions.id, versionId), eq(policyVersions.status, "draft")))
      .returning()
    return row ?? null
  },

  /**
   * Publish a draft version: retires any currently-published version of the
   * same policy, marks the target as published, updates `policies.currentVersionId`.
   */
  async publishPolicyVersion(db: PostgresJsDatabase, versionId: string) {
    return db.transaction(async (tx) => {
      const [version] = await tx
        .select()
        .from(policyVersions)
        .where(eq(policyVersions.id, versionId))
        .limit(1)
      if (!version) return { status: "not_found" as const }
      if (version.status !== "draft") return { status: "not_draft" as const }

      const now = new Date()

      // Retire existing published version(s) for the same policy
      await tx
        .update(policyVersions)
        .set({ status: "retired", retiredAt: now, updatedAt: now })
        .where(
          and(
            eq(policyVersions.policyId, version.policyId),
            eq(policyVersions.status, "published"),
          ),
        )

      const [published] = await tx
        .update(policyVersions)
        .set({ status: "published", publishedAt: now, updatedAt: now })
        .where(eq(policyVersions.id, versionId))
        .returning()

      await tx
        .update(policies)
        .set({ currentVersionId: versionId, updatedAt: now })
        .where(eq(policies.id, version.policyId))

      return { status: "published" as const, version: published ?? null }
    })
  },

  async retirePolicyVersion(db: PostgresJsDatabase, versionId: string) {
    const [row] = await db
      .update(policyVersions)
      .set({ status: "retired", retiredAt: new Date(), updatedAt: new Date() })
      .where(eq(policyVersions.id, versionId))
      .returning()
    return row ?? null
  },

  // ---------- rules ----------

  listPolicyRules(db: PostgresJsDatabase, versionId: string) {
    return db
      .select()
      .from(policyRules)
      .where(eq(policyRules.policyVersionId, versionId))
      .orderBy(policyRules.sortOrder, policyRules.createdAt)
  },

  async createPolicyRule(db: PostgresJsDatabase, versionId: string, data: CreatePolicyRuleInput) {
    const [version] = await db
      .select({ id: policyVersions.id })
      .from(policyVersions)
      .where(eq(policyVersions.id, versionId))
      .limit(1)
    if (!version) return null

    const [row] = await db
      .insert(policyRules)
      .values({
        policyVersionId: versionId,
        ruleType: data.ruleType,
        label: data.label ?? null,
        daysBeforeDeparture: data.daysBeforeDeparture ?? null,
        refundPercent: data.refundPercent ?? null,
        refundType: data.refundType ?? null,
        flatAmountCents: data.flatAmountCents ?? null,
        currency: data.currency ?? null,
        validFrom: toDateString(data.validFrom),
        validTo: toDateString(data.validTo),
        conditions: data.conditions ?? null,
        sortOrder: data.sortOrder,
      })
      .returning()
    return row ?? null
  },

  async updatePolicyRule(db: PostgresJsDatabase, ruleId: string, data: UpdatePolicyRuleInput) {
    const [row] = await db
      .update(policyRules)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(policyRules.id, ruleId))
      .returning()
    return row ?? null
  },

  async deletePolicyRule(db: PostgresJsDatabase, ruleId: string) {
    const [row] = await db
      .delete(policyRules)
      .where(eq(policyRules.id, ruleId))
      .returning({ id: policyRules.id })
    return row ?? null
  },

  // ---------- assignments ----------

  async listPolicyAssignments(db: PostgresJsDatabase, query: PolicyAssignmentListQuery) {
    const conditions = []
    if (query.policyId) conditions.push(eq(policyAssignments.policyId, query.policyId))
    if (query.scope) conditions.push(eq(policyAssignments.scope, query.scope))
    if (query.productId) conditions.push(eq(policyAssignments.productId, query.productId))
    if (query.channelId) conditions.push(eq(policyAssignments.channelId, query.channelId))
    if (query.supplierId) conditions.push(eq(policyAssignments.supplierId, query.supplierId))
    if (query.marketId) conditions.push(eq(policyAssignments.marketId, query.marketId))
    if (query.organizationId)
      conditions.push(eq(policyAssignments.organizationId, query.organizationId))
    const where = conditions.length ? and(...conditions) : undefined
    return paginate(
      db
        .select()
        .from(policyAssignments)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(desc(policyAssignments.priority), desc(policyAssignments.createdAt)),
      db.select({ total: sql<number>`count(*)::int` }).from(policyAssignments).where(where),
      query.limit,
      query.offset,
    )
  },

  async createPolicyAssignment(db: PostgresJsDatabase, data: CreatePolicyAssignmentInput) {
    const [row] = await db
      .insert(policyAssignments)
      .values({
        policyId: data.policyId,
        scope: data.scope,
        productId: data.productId ?? null,
        channelId: data.channelId ?? null,
        supplierId: data.supplierId ?? null,
        marketId: data.marketId ?? null,
        organizationId: data.organizationId ?? null,
        validFrom: toDateString(data.validFrom),
        validTo: toDateString(data.validTo),
        priority: data.priority,
        metadata: data.metadata ?? null,
      })
      .returning()
    return row ?? null
  },

  async updatePolicyAssignment(
    db: PostgresJsDatabase,
    id: string,
    data: UpdatePolicyAssignmentInput,
  ) {
    const [row] = await db
      .update(policyAssignments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(policyAssignments.id, id))
      .returning()
    return row ?? null
  },

  async deletePolicyAssignment(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .delete(policyAssignments)
      .where(eq(policyAssignments.id, id))
      .returning({ id: policyAssignments.id })
    return row ?? null
  },

  // ---------- resolution ----------

  /**
   * Resolve the best-matching policy for a context. Matches candidate
   * assignments on scope column values and (optional) validity window, then
   * picks the highest-priority one for the requested policy kind.
   */
  async resolvePolicy(db: PostgresJsDatabase, input: ResolvePolicyInput) {
    const conditions: ReturnType<typeof eq>[] = []
    const atDate = input.at ?? new Date().toISOString().slice(0, 10)

    // Scope conditions: collect all provided target IDs; an assignment
    // matches if its column equals the provided ID OR the column is null
    // (global within that dimension).
    const scopeConditions: ReturnType<typeof or>[] = []
    if (input.productId) {
      scopeConditions.push(
        or(
          eq(policyAssignments.productId, input.productId),
          sql`${policyAssignments.productId} IS NULL`,
        ),
      )
    }
    if (input.channelId) {
      scopeConditions.push(
        or(
          eq(policyAssignments.channelId, input.channelId),
          sql`${policyAssignments.channelId} IS NULL`,
        ),
      )
    }
    if (input.supplierId) {
      scopeConditions.push(
        or(
          eq(policyAssignments.supplierId, input.supplierId),
          sql`${policyAssignments.supplierId} IS NULL`,
        ),
      )
    }
    if (input.marketId) {
      scopeConditions.push(
        or(
          eq(policyAssignments.marketId, input.marketId),
          sql`${policyAssignments.marketId} IS NULL`,
        ),
      )
    }
    if (input.organizationId) {
      scopeConditions.push(
        or(
          eq(policyAssignments.organizationId, input.organizationId),
          sql`${policyAssignments.organizationId} IS NULL`,
        ),
      )
    }

    // Validity filter
    const validity = and(
      or(sql`${policyAssignments.validFrom} IS NULL`, lte(policyAssignments.validFrom, atDate)),
      or(sql`${policyAssignments.validTo} IS NULL`, gte(policyAssignments.validTo, atDate)),
    )

    const candidates = await db
      .select({
        assignment: policyAssignments,
        policy: policies,
      })
      .from(policyAssignments)
      .innerJoin(policies, eq(policyAssignments.policyId, policies.id))
      .where(
        and(
          eq(policies.kind, input.kind),
          validity,
          ...conditions,
          ...(scopeConditions.length ? [and(...scopeConditions)] : []),
        ),
      )
      .orderBy(desc(policyAssignments.priority), desc(policyAssignments.createdAt))

    if (candidates.length === 0) return null

    // Specificity ranking: count non-null scope columns (more specific = higher score)
    const scored = candidates.map((c) => {
      const a = c.assignment
      const specificity =
        (a.productId ? 1 : 0) +
        (a.channelId ? 1 : 0) +
        (a.supplierId ? 1 : 0) +
        (a.marketId ? 1 : 0) +
        (a.organizationId ? 1 : 0)
      return { ...c, specificity }
    })

    scored.sort((a, b) => {
      if (b.assignment.priority !== a.assignment.priority) {
        return b.assignment.priority - a.assignment.priority
      }
      if (b.specificity !== a.specificity) return b.specificity - a.specificity
      return b.assignment.createdAt.getTime() - a.assignment.createdAt.getTime()
    })

    const winner = scored[0]
    if (!winner) return null

    // Load current published version + rules
    if (!winner.policy.currentVersionId) {
      return { policy: winner.policy, assignment: winner.assignment, version: null, rules: [] }
    }

    const [version] = await db
      .select()
      .from(policyVersions)
      .where(eq(policyVersions.id, winner.policy.currentVersionId))
      .limit(1)

    const rules = version
      ? await db
          .select()
          .from(policyRules)
          .where(eq(policyRules.policyVersionId, version.id))
          .orderBy(policyRules.sortOrder)
      : []

    return {
      policy: winner.policy,
      assignment: winner.assignment,
      version: version ?? null,
      rules,
    }
  },

  async evaluateCancellation(
    db: PostgresJsDatabase,
    policyId: string,
    input: EvaluateCancellationInput,
  ) {
    const [policy] = await db.select().from(policies).where(eq(policies.id, policyId)).limit(1)
    if (!policy?.currentVersionId) return null

    const rules = await db
      .select()
      .from(policyRules)
      .where(eq(policyRules.policyVersionId, policy.currentVersionId))

    const mapped: CancellationRule[] = rules.map((r) => ({
      id: r.id,
      daysBeforeDeparture: r.daysBeforeDeparture,
      refundPercent: r.refundPercent,
      refundType: r.refundType,
      flatAmountCents: r.flatAmountCents,
      label: r.label,
    }))

    return evaluateCancellationPolicy(mapped, input)
  },

  // ---------- acceptances ----------

  async listPolicyAcceptances(db: PostgresJsDatabase, query: PolicyAcceptanceListQuery) {
    const conditions = []
    if (query.policyVersionId)
      conditions.push(eq(policyAcceptances.policyVersionId, query.policyVersionId))
    if (query.personId) conditions.push(eq(policyAcceptances.personId, query.personId))
    if (query.bookingId) conditions.push(eq(policyAcceptances.bookingId, query.bookingId))
    if (query.orderId) conditions.push(eq(policyAcceptances.orderId, query.orderId))
    const where = conditions.length ? and(...conditions) : undefined
    return paginate(
      db
        .select()
        .from(policyAcceptances)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(desc(policyAcceptances.acceptedAt)),
      db.select({ total: sql<number>`count(*)::int` }).from(policyAcceptances).where(where),
      query.limit,
      query.offset,
    )
  },

  async recordPolicyAcceptance(db: PostgresJsDatabase, data: CreatePolicyAcceptanceInput) {
    const [row] = await db
      .insert(policyAcceptances)
      .values({
        policyVersionId: data.policyVersionId,
        personId: data.personId ?? null,
        bookingId: data.bookingId ?? null,
        orderId: data.orderId ?? null,
        offerId: data.offerId ?? null,
        acceptedBy: data.acceptedBy ?? null,
        method: data.method,
        ipAddress: data.ipAddress ?? null,
        userAgent: data.userAgent ?? null,
        metadata: data.metadata ?? null,
      })
      .returning()
    return row ?? null
  },
}

// Remove unused imports placeholder — `inArray` is referenced to allow callers
// to use it via re-export if needed but not used internally. Kept minimal.
export const _unused = inArray
