import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { Badge, Button } from "@/components/ui"
import { api } from "@/lib/api-client"
import {
  type PricingCategoryData,
  PricingCategoryDialog,
} from "../_components/pricing-category-dialog"

export const Route = createFileRoute("/_workspace/settings/pricing/categories")({
  component: PricingCategoriesPage,
})

type PricingCategoryListResponse = {
  data: PricingCategoryData[]
  total: number
  limit: number
  offset: number
}

function PricingCategoriesPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<PricingCategoryData | undefined>()

  const { data, isPending, refetch } = useQuery({
    queryKey: ["pricing-categories"],
    queryFn: () => api.get<PricingCategoryListResponse>("/v1/pricing/pricing-categories?limit=200"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/pricing/pricing-categories/${id}`),
    onSuccess: () => {
      void refetch()
    },
  })

  // Only show global categories (no product/option/unit scope) for v1
  const globalCategories = (data?.data ?? []).filter(
    (c) => !c.productId && !c.optionId && !c.unitId,
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Pricing Categories</h2>
          <p className="text-sm text-muted-foreground">
            Global categories (adult, child, room, etc.) reusable across products.
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
          New Category
        </Button>
      </div>

      {isPending && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isPending && globalCategories.length === 0 && (
        <div className="rounded-md border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No global pricing categories yet. Create one to use in option price rules.
          </p>
        </div>
      )}

      {!isPending && globalCategories.length > 0 && (
        <div className="rounded-md border bg-background">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="p-3 text-left font-medium">Name</th>
                <th className="p-3 text-left font-medium">Code</th>
                <th className="p-3 text-left font-medium">Type</th>
                <th className="p-3 text-left font-medium">Age</th>
                <th className="p-3 text-left font-medium">Seat</th>
                <th className="p-3 text-left font-medium">Sort</th>
                <th className="p-3 text-left font-medium">Status</th>
                <th className="w-20 p-3" />
              </tr>
            </thead>
            <tbody>
              {globalCategories.map((row) => (
                <tr key={row.id} className="border-b last:border-b-0">
                  <td className="p-3">{row.name}</td>
                  <td className="p-3 font-mono text-xs text-muted-foreground">{row.code ?? "-"}</td>
                  <td className="p-3">
                    <Badge variant="outline" className="capitalize">
                      {row.categoryType}
                    </Badge>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {row.isAgeQualified ? `${row.minAge ?? 0}–${row.maxAge ?? "∞"}` : "-"}
                  </td>
                  <td className="p-3 font-mono">{row.seatOccupancy}</td>
                  <td className="p-3 font-mono">{row.sortOrder}</td>
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
                          if (confirm(`Delete category "${row.name}"?`)) {
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

      <PricingCategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editing}
        onSuccess={() => {
          setDialogOpen(false)
          setEditing(undefined)
          void refetch()
        }}
      />
    </div>
  )
}
