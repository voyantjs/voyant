import { inArray } from "drizzle-orm"
import type { z } from "zod"

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

export type PolicyListQuery = z.infer<typeof policyListQuerySchema>
export type CreatePolicyInput = z.infer<typeof insertPolicySchema>
export type UpdatePolicyInput = z.infer<typeof updatePolicySchema>
export type CreatePolicyVersionInput = z.infer<typeof insertPolicyVersionSchema>
export type UpdatePolicyVersionInput = z.infer<typeof updatePolicyVersionSchema>
export type CreatePolicyRuleInput = z.infer<typeof insertPolicyRuleSchema>
export type UpdatePolicyRuleInput = z.infer<typeof updatePolicyRuleSchema>
export type CreatePolicyAssignmentInput = z.infer<typeof insertPolicyAssignmentSchema>
export type UpdatePolicyAssignmentInput = z.infer<typeof updatePolicyAssignmentSchema>
export type PolicyAssignmentListQuery = z.infer<typeof policyAssignmentListQuerySchema>
export type CreatePolicyAcceptanceInput = z.infer<typeof insertPolicyAcceptanceSchema>
export type PolicyAcceptanceListQuery = z.infer<typeof policyAcceptanceListQuerySchema>
export type EvaluateCancellationInput = z.infer<typeof evaluateCancellationInputSchema>
export type ResolvePolicyInput = z.infer<typeof resolvePolicyInputSchema>

export async function paginate<T extends object>(
  rowsQuery: Promise<T[]>,
  countQuery: Promise<Array<{ total: number }>>,
  limit: number,
  offset: number,
) {
  const [data, countResult] = await Promise.all([rowsQuery, countQuery])
  return { data, total: countResult[0]?.total ?? 0, limit, offset }
}

export function toDateString(value?: string | null): string | null {
  return value ?? null
}

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

export function evaluateCancellationPolicy(
  rules: CancellationRule[],
  input: EvaluateCancellationInput,
): CancellationResult {
  if (rules.length === 0) {
    return { refundPercent: 0, refundCents: 0, refundType: "none", appliedRule: null }
  }

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
    sorted[sorted.length - 1] ??
    null

  if (!applied) {
    return { refundPercent: 0, refundCents: 0, refundType: "none", appliedRule: null }
  }

  const refundPercent = applied.refundPercent ?? 0
  const refundType = applied.refundType ?? "none"
  const percentageRefundCents = Math.floor((input.totalCents * refundPercent) / 10000)
  const refundCents = applied.flatAmountCents ?? percentageRefundCents

  return { refundPercent, refundCents, refundType, appliedRule: applied }
}

export const _unused = inArray
