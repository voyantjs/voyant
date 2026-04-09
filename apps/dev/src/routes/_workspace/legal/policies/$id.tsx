import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { ArrowLeft, ChevronDown, ChevronRight, Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui"
import { api } from "@/lib/api-client"
import { queryKeys } from "@/lib/query-keys"
import { type AssignmentData, AssignmentDialog } from "./_components/assignment-dialog"
import { PolicyDialog } from "./_components/policy-dialog"
import { type RuleData, RuleDialog } from "./_components/rule-dialog"
import { VersionDialog } from "./_components/version-dialog"

type Policy = {
  id: string
  kind: string
  name: string
  slug: string
  description: string | null
  language: string
  createdAt: string
  updatedAt: string
}

type PolicyVersion = {
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

type Acceptance = {
  id: string
  policyVersionId: string
  personId: string | null
  bookingId: string | null
  method: string
  acceptedAt: string
}

export const Route = createFileRoute("/_workspace/legal/policies/$id")({
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(getLegalPolicyQueryOptions(params.id)),
      context.queryClient.ensureQueryData(getLegalPolicyVersionsQueryOptions(params.id)),
      context.queryClient.ensureQueryData(getLegalPolicyAssignmentsQueryOptions(params.id)),
      context.queryClient.ensureQueryData(getLegalPolicyAcceptancesQueryOptions()),
    ]),
  component: PolicyDetailPage,
})

function getLegalPolicyQueryOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.legal.policies.detail(id),
    queryFn: () => api.get<{ data: Policy }>(`/v1/admin/legal/policies/${id}`),
  })
}

function getLegalPolicyVersionsQueryOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.legal.policies.versions(id),
    queryFn: () => api.get<{ data: PolicyVersion[] }>(`/v1/admin/legal/policies/${id}/versions`),
  })
}

function getLegalPolicyAssignmentsQueryOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.legal.policies.assignments(),
    queryFn: () =>
      api.get<{ data: AssignmentData[] }>(`/v1/admin/legal/policies/assignments?policyId=${id}`),
  })
}

function getLegalPolicyAcceptancesQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.legal.policies.acceptances(),
    queryFn: () => api.get<{ data: Acceptance[] }>("/v1/admin/legal/policies/acceptances?limit=50"),
  })
}

function PolicyDetailPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [editOpen, setEditOpen] = useState(false)
  const [versionDialogOpen, setVersionDialogOpen] = useState(false)
  const [editingVersion, setEditingVersion] = useState<PolicyVersion | undefined>()
  const [expandedVersionId, setExpandedVersionId] = useState<string | null>(null)
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false)
  const [ruleDialogVersionId, setRuleDialogVersionId] = useState<string>("")
  const [editingRule, setEditingRule] = useState<RuleData | undefined>()
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<AssignmentData | undefined>()

  const { data: policyData, isPending } = useQuery(getLegalPolicyQueryOptions(id))

  const { data: versionsData, refetch: refetchVersions } = useQuery(
    getLegalPolicyVersionsQueryOptions(id),
  )

  const { data: assignmentsData, refetch: refetchAssignments } = useQuery(
    getLegalPolicyAssignmentsQueryOptions(id),
  )

  const { data: acceptancesData } = useQuery(getLegalPolicyAcceptancesQueryOptions())

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/v1/admin/legal/policies/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.legal.policies.all })
      void navigate({ to: "/legal/policies" })
    },
  })

  const publishVersionMutation = useMutation({
    mutationFn: (versionId: string) =>
      api.post(`/v1/admin/legal/policies/versions/${versionId}/publish`),
    onSuccess: () => {
      void refetchVersions()
    },
  })

  const retireVersionMutation = useMutation({
    mutationFn: (versionId: string) =>
      api.post(`/v1/admin/legal/policies/versions/${versionId}/retire`),
    onSuccess: () => {
      void refetchVersions()
    },
  })

  const deleteAssignmentMutation = useMutation({
    mutationFn: (assignmentId: string) =>
      api.delete(`/v1/admin/legal/policies/assignments/${assignmentId}`),
    onSuccess: () => {
      void refetchAssignments()
    },
  })

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const policy = policyData?.data
  if (!policy) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <p className="text-muted-foreground">Policy not found</p>
        <Button variant="outline" onClick={() => void navigate({ to: "/legal/policies" })}>
          Back to Policies
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => void navigate({ to: "/legal/policies" })}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{policy.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="capitalize">
              {policy.kind.replace(/_/g, " ")}
            </Badge>
            <span className="font-mono text-xs text-muted-foreground">{policy.slug}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (confirm("Delete this policy?")) {
                deleteMutation.mutate()
              }
            }}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Description */}
      {policy.description && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm">{policy.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Versions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Versions</CardTitle>
          <Button
            size="sm"
            onClick={() => {
              setEditingVersion(undefined)
              setVersionDialogOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Version
          </Button>
        </CardHeader>
        <CardContent>
          {(!versionsData?.data || versionsData.data.length === 0) && (
            <p className="text-sm text-muted-foreground py-4 text-center">No versions yet.</p>
          )}
          <div className="flex flex-col gap-2">
            {versionsData?.data.map((version) => (
              <VersionRow
                key={version.id}
                version={version}
                expanded={expandedVersionId === version.id}
                onToggle={() =>
                  setExpandedVersionId(expandedVersionId === version.id ? null : version.id)
                }
                onEdit={() => {
                  setEditingVersion(version)
                  setVersionDialogOpen(true)
                }}
                onPublish={() => publishVersionMutation.mutate(version.id)}
                onRetire={() => retireVersionMutation.mutate(version.id)}
                onAddRule={() => {
                  setRuleDialogVersionId(version.id)
                  setEditingRule(undefined)
                  setRuleDialogOpen(true)
                }}
                onEditRule={(rule) => {
                  setRuleDialogVersionId(version.id)
                  setEditingRule(rule)
                  setRuleDialogOpen(true)
                }}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Assignments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Assignments</CardTitle>
          <Button
            size="sm"
            onClick={() => {
              setEditingAssignment(undefined)
              setAssignmentDialogOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Assignment
          </Button>
        </CardHeader>
        <CardContent>
          {(!assignmentsData?.data || assignmentsData.data.length === 0) && (
            <p className="text-sm text-muted-foreground py-4 text-center">No assignments yet.</p>
          )}
          {assignmentsData?.data && assignmentsData.data.length > 0 && (
            <div className="rounded border bg-background">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left p-2 font-medium">Scope</th>
                    <th className="text-left p-2 font-medium">Target ID</th>
                    <th className="text-left p-2 font-medium">Priority</th>
                    <th className="text-left p-2 font-medium">Valid</th>
                    <th className="p-2 w-16" />
                  </tr>
                </thead>
                <tbody>
                  {assignmentsData.data.map((a) => (
                    <tr key={a.id} className="border-b last:border-b-0">
                      <td className="p-2 capitalize">{a.scope}</td>
                      <td className="p-2 font-mono text-xs">
                        {a.productId ||
                          a.channelId ||
                          a.supplierId ||
                          a.marketId ||
                          a.organizationId ||
                          "-"}
                      </td>
                      <td className="p-2">{a.priority}</td>
                      <td className="p-2 text-xs">
                        {a.validFrom || a.validTo
                          ? `${a.validFrom ?? "..."} — ${a.validTo ?? "..."}`
                          : "Always"}
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingAssignment(a)
                              setAssignmentDialogOpen(true)
                            }}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm("Delete this assignment?")) {
                                deleteAssignmentMutation.mutate(a.id)
                              }
                            }}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Acceptances (read-only) */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Acceptances</CardTitle>
        </CardHeader>
        <CardContent>
          {(!acceptancesData?.data || acceptancesData.data.length === 0) && (
            <p className="text-sm text-muted-foreground py-4 text-center">No acceptances yet.</p>
          )}
          {acceptancesData?.data && acceptancesData.data.length > 0 && (
            <div className="rounded border bg-background">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left p-2 font-medium">Version ID</th>
                    <th className="text-left p-2 font-medium">Person ID</th>
                    <th className="text-left p-2 font-medium">Booking ID</th>
                    <th className="text-left p-2 font-medium">Method</th>
                    <th className="text-left p-2 font-medium">Accepted At</th>
                  </tr>
                </thead>
                <tbody>
                  {acceptancesData.data.map((acc) => (
                    <tr key={acc.id} className="border-b last:border-b-0">
                      <td className="p-2 font-mono text-xs">{acc.policyVersionId}</td>
                      <td className="p-2 font-mono text-xs">{acc.personId ?? "-"}</td>
                      <td className="p-2 font-mono text-xs">{acc.bookingId ?? "-"}</td>
                      <td className="p-2 capitalize">{acc.method.replace(/_/g, " ")}</td>
                      <td className="p-2">{new Date(acc.acceptedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <PolicyDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        policy={policy}
        onSuccess={() => {
          setEditOpen(false)
          void queryClient.invalidateQueries({ queryKey: queryKeys.legal.policies.detail(id) })
          void queryClient.invalidateQueries({ queryKey: queryKeys.legal.policies.all })
        }}
      />

      <VersionDialog
        open={versionDialogOpen}
        onOpenChange={setVersionDialogOpen}
        policyId={id}
        version={editingVersion}
        onSuccess={() => {
          setVersionDialogOpen(false)
          setEditingVersion(undefined)
          void refetchVersions()
        }}
      />

      {ruleDialogVersionId && (
        <RuleDialog
          open={ruleDialogOpen}
          onOpenChange={setRuleDialogOpen}
          versionId={ruleDialogVersionId}
          rule={editingRule}
          onSuccess={() => {
            setRuleDialogOpen(false)
            setEditingRule(undefined)
            void queryClient.invalidateQueries({
              queryKey: queryKeys.legal.policies.rules(ruleDialogVersionId),
            })
          }}
        />
      )}

      <AssignmentDialog
        open={assignmentDialogOpen}
        onOpenChange={setAssignmentDialogOpen}
        policyId={id}
        assignment={editingAssignment}
        onSuccess={() => {
          setAssignmentDialogOpen(false)
          setEditingAssignment(undefined)
          void refetchAssignments()
        }}
      />
    </div>
  )
}

// ---------- Version row with expandable rules ----------

const versionStatusVariant: Record<string, "default" | "secondary" | "outline"> = {
  draft: "outline",
  published: "default",
  retired: "secondary",
}

function VersionRow({
  version,
  expanded,
  onToggle,
  onEdit,
  onPublish,
  onRetire,
  onAddRule,
  onEditRule,
}: {
  version: PolicyVersion
  expanded: boolean
  onToggle: () => void
  onEdit: () => void
  onPublish: () => void
  onRetire: () => void
  onAddRule: () => void
  onEditRule: (rule: RuleData) => void
}) {
  const { data: rulesData, refetch: refetchRules } = useQuery({
    queryKey: queryKeys.legal.policies.rules(version.id),
    queryFn: () =>
      api.get<{ data: RuleData[] }>(`/v1/admin/legal/policies/versions/${version.id}/rules`),
    enabled: expanded,
  })

  const deleteRuleMutation = useMutation({
    mutationFn: (ruleId: string) => api.delete(`/v1/admin/legal/policies/rules/${ruleId}`),
    onSuccess: () => {
      void refetchRules()
    },
  })

  return (
    <div className="rounded-md border">
      <div className="flex items-center gap-3 p-3">
        <button
          type="button"
          onClick={onToggle}
          className="text-muted-foreground hover:text-foreground"
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">v{version.version}</span>
            <Badge
              variant={versionStatusVariant[version.status] ?? "secondary"}
              className="capitalize"
            >
              {version.status}
            </Badge>
            <span className="text-sm text-muted-foreground">{version.title}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {version.status === "draft" && (
            <Button variant="outline" size="sm" onClick={onPublish}>
              Publish
            </Button>
          )}
          {version.status === "published" && (
            <Button variant="outline" size="sm" onClick={onRetire}>
              Retire
            </Button>
          )}
          {version.status === "draft" && (
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="border-t bg-muted/30 p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Rules
            </p>
            <Button variant="outline" size="sm" onClick={onAddRule}>
              <Plus className="mr-1 h-3 w-3" />
              Add Rule
            </Button>
          </div>

          {(!rulesData?.data || rulesData.data.length === 0) && (
            <p className="text-xs text-muted-foreground text-center py-2">No rules yet.</p>
          )}

          {rulesData?.data && rulesData.data.length > 0 && (
            <div className="rounded border bg-background">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left p-2 font-medium">Sort</th>
                    <th className="text-left p-2 font-medium">Type</th>
                    <th className="text-left p-2 font-medium">Label</th>
                    <th className="text-left p-2 font-medium">Days</th>
                    <th className="text-left p-2 font-medium">Refund</th>
                    <th className="text-left p-2 font-medium">Type</th>
                    <th className="p-2 w-16" />
                  </tr>
                </thead>
                <tbody>
                  {rulesData.data
                    .slice()
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((rule) => (
                      <tr key={rule.id} className="border-b last:border-b-0">
                        <td className="p-2 font-mono">{rule.sortOrder}</td>
                        <td className="p-2 capitalize">{rule.ruleType.replace(/_/g, " ")}</td>
                        <td className="p-2">{rule.label ?? "-"}</td>
                        <td className="p-2">{rule.daysBeforeDeparture ?? "-"}</td>
                        <td className="p-2">
                          {rule.refundPercent != null
                            ? `${(rule.refundPercent / 100).toFixed(2)}%`
                            : rule.flatAmountCents != null
                              ? `${(rule.flatAmountCents / 100).toFixed(2)} ${rule.currency ?? ""}`
                              : "-"}
                        </td>
                        <td className="p-2 capitalize">
                          {rule.refundType?.replace(/_/g, " ") ?? "-"}
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => onEditRule(rule)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm("Delete this rule?")) {
                                  deleteRuleMutation.mutate(rule.id)
                                }
                              }}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
