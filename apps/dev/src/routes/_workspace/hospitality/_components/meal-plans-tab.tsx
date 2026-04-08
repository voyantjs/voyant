import { useMutation, useQuery } from "@tanstack/react-query"
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { Badge, Button } from "@/components/ui"
import { api } from "@/lib/api-client"
import { type MealPlanData, MealPlanDialog } from "./meal-plan-dialog"

type ListResponse<T> = { data: T[]; total: number; limit: number; offset: number }

type Props = { propertyId: string }

export function MealPlansTab({ propertyId }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<MealPlanData | undefined>()

  const { data, isPending, refetch } = useQuery({
    queryKey: ["hospitality", "meal-plans", propertyId],
    queryFn: () =>
      api.get<ListResponse<MealPlanData>>(
        `/v1/hospitality/meal-plans?propertyId=${propertyId}&limit=200`,
      ),
    enabled: !!propertyId,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/hospitality/meal-plans/${id}`),
    onSuccess: () => {
      void refetch()
    },
  })

  const rows = (data?.data ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Meal inclusions (BB, HB, FB, All-Inclusive, Room Only, etc.).
        </p>
        <Button
          size="sm"
          onClick={() => {
            setEditing(undefined)
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Meal Plan
        </Button>
      </div>

      {isPending && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isPending && rows.length === 0 && (
        <div className="rounded-md border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">No meal plans yet.</p>
        </div>
      )}

      {!isPending && rows.length > 0 && (
        <div className="rounded-md border bg-background">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="p-3 text-left font-medium">Code</th>
                <th className="p-3 text-left font-medium">Name</th>
                <th className="p-3 text-left font-medium">Includes</th>
                <th className="p-3 text-left font-medium">Status</th>
                <th className="w-20 p-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const includes: string[] = []
                if (row.includesBreakfast) includes.push("Breakfast")
                if (row.includesLunch) includes.push("Lunch")
                if (row.includesDinner) includes.push("Dinner")
                if (row.includesDrinks) includes.push("Drinks")
                return (
                  <tr key={row.id} className="border-b last:border-b-0">
                    <td className="p-3 font-mono text-xs">{row.code}</td>
                    <td className="p-3 font-medium">{row.name}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {includes.length === 0 && (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                        {includes.map((i) => (
                          <Badge key={i} variant="secondary">
                            {i}
                          </Badge>
                        ))}
                      </div>
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
                            if (confirm(`Delete meal plan "${row.name}"?`)) {
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

      <MealPlanDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        propertyId={propertyId}
        mealPlan={editing}
        onSuccess={() => {
          setDialogOpen(false)
          setEditing(undefined)
          void refetch()
        }}
      />
    </div>
  )
}
