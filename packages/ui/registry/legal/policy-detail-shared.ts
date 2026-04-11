import type { QueryClient } from "@tanstack/react-query"
import {
  defaultFetcher,
  getLegalPolicyAcceptancesQueryOptions as getLegalPolicyAcceptancesQueryOptionsFromPackage,
  getLegalPolicyAssignmentsQueryOptions as getLegalPolicyAssignmentsQueryOptionsFromPackage,
  getLegalPolicyQueryOptions as getLegalPolicyQueryOptionsFromPackage,
  getLegalPolicyVersionsQueryOptions as getLegalPolicyVersionsQueryOptionsFromPackage,
  type LegalPolicyAcceptanceRecord,
  type LegalPolicyRecord,
  type LegalPolicyVersionRecord,
} from "@voyantjs/legal-react"

export type Policy = LegalPolicyRecord
export type PolicyVersion = LegalPolicyVersionRecord
export type Acceptance = LegalPolicyAcceptanceRecord

export type EnsureQueryData = QueryClient["ensureQueryData"]

export function getLegalPolicyQueryOptions(id: string) {
  return getLegalPolicyQueryOptionsBase(id)
}

export function getLegalPolicyVersionsQueryOptions(id: string) {
  return getLegalPolicyVersionsQueryOptionsBase(id)
}

export function getLegalPolicyAssignmentsQueryOptions(id: string) {
  return getLegalPolicyAssignmentsQueryOptionsBase(id)
}

export function getLegalPolicyAcceptancesQueryOptions() {
  return getLegalPolicyAcceptancesQueryOptionsBase()
}

function getLegalPolicyQueryOptionsBase(id: string) {
  return getLegalPolicyQueryOptionsFromPackage({ baseUrl: "", fetcher: defaultFetcher }, id)
}

function getLegalPolicyVersionsQueryOptionsBase(id: string) {
  return getLegalPolicyVersionsQueryOptionsFromPackage(
    { baseUrl: "", fetcher: defaultFetcher },
    { policyId: id },
  )
}

function getLegalPolicyAssignmentsQueryOptionsBase(id: string) {
  return getLegalPolicyAssignmentsQueryOptionsFromPackage(
    { baseUrl: "", fetcher: defaultFetcher },
    { policyId: id },
  )
}

function getLegalPolicyAcceptancesQueryOptionsBase() {
  return getLegalPolicyAcceptancesQueryOptionsFromPackage(
    { baseUrl: "", fetcher: defaultFetcher },
    { limit: 50, offset: 0 },
  )
}

export const versionStatusVariant: Record<string, "default" | "secondary" | "outline"> = {
  draft: "outline",
  published: "default",
  retired: "secondary",
}
