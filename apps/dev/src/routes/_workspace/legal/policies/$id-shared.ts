import { queryOptions } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { queryKeys } from "@/lib/query-keys"
import type { AssignmentData } from "./_components/assignment-dialog"

export type Policy = {
  id: string
  kind: string
  name: string
  slug: string
  description: string | null
  language: string
  createdAt: string
  updatedAt: string
}

export type PolicyVersion = {
  id: string
  policyId: string
  version: number
  status: "draft" | "published" | "retired"
  title: string
  bodyFormat: string
  body: string | null
  publishedAt: string | null
  createdAt: string
}

export type Acceptance = {
  id: string
  policyVersionId: string
  personId: string | null
  bookingId: string | null
  method: string
  acceptedAt: string
}

export function getLegalPolicyQueryOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.legal.policies.detail(id),
    queryFn: () => api.get<{ data: Policy }>(`/v1/admin/legal/policies/${id}`),
  })
}

export function getLegalPolicyVersionsQueryOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.legal.policies.versions(id),
    queryFn: () => api.get<{ data: PolicyVersion[] }>(`/v1/admin/legal/policies/${id}/versions`),
  })
}

export function getLegalPolicyAssignmentsQueryOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.legal.policies.assignments(),
    queryFn: () =>
      api.get<{ data: AssignmentData[] }>(`/v1/admin/legal/policies/assignments?policyId=${id}`),
  })
}

export function getLegalPolicyAcceptancesQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.legal.policies.acceptances(),
    queryFn: () => api.get<{ data: Acceptance[] }>("/v1/admin/legal/policies/acceptances?limit=50"),
  })
}

export const versionStatusVariant: Record<string, "default" | "secondary" | "outline"> = {
  draft: "outline",
  published: "default",
  retired: "secondary",
}
