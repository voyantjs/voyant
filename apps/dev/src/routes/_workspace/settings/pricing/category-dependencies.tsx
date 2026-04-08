import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { Badge, Button } from "@/components/ui"
import { api } from "@/lib/api-client"
import {
  type PricingCategoryDependencyData,
  PricingCategoryDependencyDialog,
} from "../_components/pricing-category-dependency-dialog"

export const Route = createFileRoute("/_workspace/settings/pricing/category-dependencies")({
  component: CategoryDependenciesPage,
})

type ListResponse<T> = { data: T[]; total: number; limit: number; offset: number }
type PricingCategoryLite = { id: string; name: string; code: string | null }

function CategoryDependenciesPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<PricingCategoryDependencyData | undefined>()

  const { data, isPending, refetch } = useQuery({
    queryKey: ["pricing", "category-dependencies"],
    queryFn: () =>
      api.get<ListResponse<PricingCategoryDependencyData>>(
        "/v1/pricing/pricing-category-dependencies?limit=200",
      ),
  })

  const categoriesQuery = useQuery({
    queryKey: ["pricing", "dep-list", "categories"],
    queryFn: () =>
      api.get<ListResponse<PricingCategoryLite>>("/v1/pricing/pricing-categories?limit=200"),
  })
  const categoryById = new Map((categoriesQuery.data?.data ?? []).map((c) => [c.id, c]))

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/pricing/pricing-category-dependencies/${id}`),
    onSuccess: () => {
      void refetch()
    },
  })

  const rows = data?.data ?? []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Category Dependencies</h2>
          <p className="text-sm text-muted-foreground">
            Rules between pricing categories: requires, limits per master, excludes.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditing(undefined)
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Dependency
        </Button>
      </div>

      {isPending && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isPending && rows.length === 0 && (
        <div className="rounded-md border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">No dependencies yet.</p>
        </div>
      )}

      {!isPending && rows.length > 0 && (
        <div className="rounded-md border bg-background">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="p-3 text-left font-medium">Master</th>
                <th className="p-3 text-left font-medium">Dependent</th>
                <th className="p-3 text-left font-medium">Type</th>
                <th className="p-3 text-left font-medium">Limits</th>
                <th className="p-3 text-left font-medium">Status</th>
                <th className="w-20 p-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const master = categoryById.get(row.masterPricingCategoryId)
                const dep = categoryById.get(row.pricingCategoryId)
                return (
                  <tr key={row.id} className="border-b last:border-b-0">
                    <td className="p-3 text-muted-foreground">
                      {master?.name ?? row.masterPricingCategoryId}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {dep?.name ?? row.pricingCategoryId}
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="capitalize">
                        {row.dependencyType.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="p-3 font-mono text-xs text-muted-foreground">
                      {row.maxPerMaster != null ? `per master: ${row.maxPerMaster}` : ""}
                      {row.maxPerMaster != null && row.maxDependentSum != null ? " · " : ""}
                      {row.maxDependentSum != null ? `sum: ${row.maxDependentSum}` : ""}
                      {row.maxPerMaster == null && row.maxDependentSum == null ? "-" : ""}
                    </td>
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
                            if (confirm("Delete dependency?")) {
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
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <PricingCategoryDependencyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        dependency={editing}
        onSuccess={() => {
          setDialogOpen(false)
          setEditing(undefined)
          void refetch()
        }}
      />
    </div>
  )
}
