import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { ChevronDown, ChevronRight, Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { Badge, Button } from "@/components/ui"
import { api } from "@/lib/api-client"
import { getApiListQueryOptions } from "../../_lib/api-query-options"
import {
  type CancellationPolicyData,
  CancellationPolicyDialog,
} from "../_components/cancellation-policy-dialog"
import {
  type CancellationPolicyRuleData,
  CancellationPolicyRuleDialog,
} from "../_components/cancellation-policy-rule-dialog"

export const Route = createFileRoute("/_workspace/settings/pricing/cancellation-policies")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(getCancellationPoliciesQueryOptions()),
  component: CancellationPoliciesPage,
})

type RuleListResponse = {
  data: CancellationPolicyRuleData[]
  total: number
  limit: number
  offset: number
}

function CancellationPoliciesPage() {
  const [policyDialogOpen, setPolicyDialogOpen] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<CancellationPolicyData | undefined>()
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const [ruleDialogOpen, setRuleDialogOpen] = useState(false)
  const [ruleDialogPolicyId, setRuleDialogPolicyId] = useState<string | null>(null)
  const [editingRule, setEditingRule] = useState<CancellationPolicyRuleData | undefined>()
  const [nextRuleSortOrder, setNextRuleSortOrder] = useState<number>(0)

  const { data, isPending, refetch } = useQuery(getCancellationPoliciesQueryOptions())

  const deletePolicyMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/pricing/cancellation-policies/${id}`),
    onSuccess: () => {
      void refetch()
    },
  })

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Cancellation Policies</h2>
          <p className="text-sm text-muted-foreground">
            Named policies with cutoff-based fee rules.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditingPolicy(undefined)
            setPolicyDialogOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Policy
        </Button>
      </div>

      {isPending && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isPending && (!data?.data || data.data.length === 0) && (
        <div className="rounded-md border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No cancellation policies yet. Create one to start defining cancellation rules.
          </p>
        </div>
      )}

      {!isPending && data?.data && data.data.length > 0 && (
        <div className="flex flex-col gap-2">
          {data.data.map((policy) => (
            <PolicyRow
              key={policy.id}
              policy={policy}
              expanded={expandedIds.has(policy.id)}
              onToggle={() => toggleExpand(policy.id)}
              onEdit={() => {
                setEditingPolicy(policy)
                setPolicyDialogOpen(true)
              }}
              onDelete={() => {
                if (confirm(`Delete policy "${policy.name}"?`)) {
                  deletePolicyMutation.mutate(policy.id)
                }
              }}
              onAddRule={(nextSort) => {
                setRuleDialogPolicyId(policy.id)
                setEditingRule(undefined)
                setNextRuleSortOrder(nextSort)
                setRuleDialogOpen(true)
              }}
              onEditRule={(rule) => {
                setRuleDialogPolicyId(policy.id)
                setEditingRule(rule)
                setRuleDialogOpen(true)
              }}
            />
          ))}
        </div>
      )}

      <CancellationPolicyDialog
        open={policyDialogOpen}
        onOpenChange={setPolicyDialogOpen}
        policy={editingPolicy}
        onSuccess={() => {
          setPolicyDialogOpen(false)
          setEditingPolicy(undefined)
          void refetch()
        }}
      />

      {ruleDialogPolicyId && (
        <CancellationPolicyRuleDialog
          open={ruleDialogOpen}
          onOpenChange={setRuleDialogOpen}
          policyId={ruleDialogPolicyId}
          rule={editingRule}
          nextSortOrder={nextRuleSortOrder}
          onSuccess={() => {
            setRuleDialogOpen(false)
            setEditingRule(undefined)
            void refetch()
          }}
        />
      )}
    </div>
  )
}

function getCancellationPoliciesQueryOptions() {
  return getApiListQueryOptions<CancellationPolicyData>(
    ["cancellation-policies"],
    "/v1/pricing/cancellation-policies?limit=200",
  )
}

function PolicyRow({
  policy,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  onAddRule,
  onEditRule,
}: {
  policy: CancellationPolicyData
  expanded: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
  onAddRule: (nextSortOrder: number) => void
  onEditRule: (rule: CancellationPolicyRuleData) => void
}) {
  const { data: rulesData, refetch: refetchRules } = useQuery({
    queryKey: ["cancellation-policy-rules", policy.id],
    queryFn: () =>
      api.get<RuleListResponse>(
        `/v1/pricing/cancellation-policy-rules?cancellationPolicyId=${policy.id}&limit=100`,
      ),
    enabled: expanded,
  })

  const deleteRuleMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/pricing/cancellation-policy-rules/${id}`),
    onSuccess: () => {
      void refetchRules()
    },
  })

  const rules = rulesData?.data ?? []
  const nextSort = rules.length > 0 ? Math.max(...rules.map((r) => r.sortOrder)) + 1 : 0

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
            <span className="text-sm font-medium">{policy.name}</span>
            {policy.code && (
              <span className="font-mono text-xs text-muted-foreground">{policy.code}</span>
            )}
            <Badge variant="outline" className="capitalize">
              {policy.policyType.replace("_", " ")}
            </Badge>
            {policy.isDefault && <Badge variant="secondary">Default</Badge>}
            <Badge variant={policy.active ? "default" : "outline"}>
              {policy.active ? "Active" : "Inactive"}
            </Badge>
          </div>
          {policy.policyType === "simple" && policy.simpleCutoffHours != null && (
            <p className="mt-1 text-xs text-muted-foreground">
              Simple cutoff: {policy.simpleCutoffHours}h
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="border-t bg-muted/30 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Rules
            </p>
            <Button variant="outline" size="sm" onClick={() => onAddRule(nextSort)}>
              <Plus className="mr-1 h-3 w-3" />
              Add Rule
            </Button>
          </div>

          {rules.length === 0 && (
            <p className="py-2 text-center text-xs text-muted-foreground">No rules yet.</p>
          )}

          {rules.length > 0 && (
            <div className="rounded border bg-background">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="p-2 text-left font-medium">Sort</th>
                    <th className="p-2 text-left font-medium">Cutoff</th>
                    <th className="p-2 text-left font-medium">Charge</th>
                    <th className="p-2 text-left font-medium">Notes</th>
                    <th className="w-16 p-2" />
                  </tr>
                </thead>
                <tbody>
                  {rules
                    .slice()
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((rule) => (
                      <tr key={rule.id} className="border-b last:border-b-0">
                        <td className="p-2 font-mono">{rule.sortOrder}</td>
                        <td className="p-2">{formatCutoff(rule.cutoffMinutesBefore)}</td>
                        <td className="p-2">{formatCharge(rule)}</td>
                        <td className="p-2 text-muted-foreground">{rule.notes ?? "-"}</td>
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

function formatCutoff(minutes: number | null): string {
  if (minutes == null) return "At start"
  if (minutes === 0) return "At start"
  if (minutes % 1440 === 0) return `${minutes / 1440}d before`
  if (minutes % 60 === 0) return `${minutes / 60}h before`
  return `${minutes}m before`
}

function formatCharge(rule: CancellationPolicyRuleData): string {
  if (rule.chargeType === "none") return "No charge"
  if (rule.chargeType === "amount" && rule.chargeAmountCents != null) {
    return `${(rule.chargeAmountCents / 100).toFixed(2)}`
  }
  if (rule.chargeType === "percentage" && rule.chargePercentBasisPoints != null) {
    return `${(rule.chargePercentBasisPoints / 100).toFixed(2)}%`
  }
  return "-"
}
