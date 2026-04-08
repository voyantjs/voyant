import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Loader2, Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react"
import { useState } from "react"
import { Badge, Button } from "@/components/ui"
import { api } from "@/lib/api-client"
import { type PolicyData, PolicyDialog } from "./_components/policy-dialog"

export const Route = createFileRoute("/_workspace/sellability/")({
  component: SellabilityPage,
})

type ListResponse<T> = { data: T[]; total: number; limit: number; offset: number }

function SellabilityPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<PolicyData | undefined>()

  const { data, isPending, refetch } = useQuery({
    queryKey: ["sellability", "policies"],
    queryFn: () => api.get<ListResponse<PolicyData>>("/v1/sellability/policies?limit=200"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/sellability/policies/${id}`),
    onSuccess: () => {
      void refetch()
    },
  })

  const rows = (data?.data ?? []).slice().sort((a, b) => a.priority - b.priority)

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-2xl font-bold tracking-tight">Sellability</h1>
      </div>

      <div className="flex items-center justify-between">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Declarative policies that decide when offers can be sold — scoped globally or to specific
          products, options, markets and channels. Policies are evaluated in priority order.
        </p>
        <Button
          size="sm"
          onClick={() => {
            setEditing(undefined)
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Policy
        </Button>
      </div>

      {isPending && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isPending && rows.length === 0 && (
        <div className="rounded-md border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">No policies yet.</p>
        </div>
      )}

      {!isPending && rows.length > 0 && (
        <div className="rounded-md border bg-background">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="p-3 text-left font-medium">Name</th>
                <th className="p-3 text-left font-medium">Scope</th>
                <th className="p-3 text-left font-medium">Type</th>
                <th className="p-3 text-left font-medium">Priority</th>
                <th className="p-3 text-left font-medium">Status</th>
                <th className="w-20 p-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b last:border-b-0">
                  <td className="p-3 font-medium">{row.name}</td>
                  <td className="p-3">
                    <Badge variant="outline" className="capitalize">
                      {row.scope}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <Badge variant="outline" className="capitalize">
                      {row.policyType.replace(/_/g, " ")}
                    </Badge>
                  </td>
                  <td className="p-3 font-mono text-xs text-muted-foreground">{row.priority}</td>
                  <td className="p-3">
                    <Badge variant={row.active ? "default" : "outline"}>
                      {row.active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(row)
                          setDialogOpen(true)
                        }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete policy "${row.name}"?`)) {
                            deleteMutation.mutate(row.id)
                          }
                        }}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <PolicyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        policy={editing}
        onSuccess={() => {
          setDialogOpen(false)
          setEditing(undefined)
          void refetch()
        }}
      />
    </div>
  )
}
