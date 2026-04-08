import { useMutation, useQuery } from "@tanstack/react-query"
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { Badge, Button } from "@/components/ui"
import { api } from "@/lib/api-client"
import { type RatePlanData, RatePlanDialog } from "./rate-plan-dialog"

type ListResponse<T> = { data: T[]; total: number; limit: number; offset: number }
type NamedEntity = { id: string; name: string; code?: string }

type Props = { propertyId: string }

export function RatePlansTab({ propertyId }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<RatePlanData | undefined>()

  const { data, isPending, refetch } = useQuery({
    queryKey: ["hospitality", "rate-plans", propertyId],
    queryFn: () =>
      api.get<ListResponse<RatePlanData>>(
        `/v1/hospitality/rate-plans?propertyId=${propertyId}&limit=200`,
      ),
    enabled: !!propertyId,
  })

  const { data: catalogsData } = useQuery({
    queryKey: ["pricing", "price-catalogs"],
    queryFn: () => api.get<ListResponse<NamedEntity>>("/v1/pricing/price-catalogs?limit=200"),
  })
  const { data: cancelData } = useQuery({
    queryKey: ["pricing", "cancellation-policies"],
    queryFn: () =>
      api.get<ListResponse<NamedEntity>>("/v1/pricing/cancellation-policies?limit=200"),
  })
  const { data: mealData } = useQuery({
    queryKey: ["hospitality", "meal-plans", propertyId],
    queryFn: () =>
      api.get<ListResponse<NamedEntity>>(
        `/v1/hospitality/meal-plans?propertyId=${propertyId}&limit=200`,
      ),
    enabled: !!propertyId,
  })

  const catalogMap = new Map((catalogsData?.data ?? []).map((c) => [c.id, c.name]))
  const cancelMap = new Map((cancelData?.data ?? []).map((c) => [c.id, c.name]))
  const mealMap = new Map((mealData?.data ?? []).map((m) => [m.id, m.name]))

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/hospitality/rate-plans/${id}`),
    onSuccess: () => {
      void refetch()
    },
  })

  const rows = (data?.data ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Commercial rate plans (Flexible, Non-refundable, Corporate, etc.).
        </p>
        <Button
          size="sm"
          onClick={() => {
            setEditing(undefined)
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Rate Plan
        </Button>
      </div>

      {isPending && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isPending && rows.length === 0 && (
        <div className="rounded-md border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">No rate plans yet.</p>
        </div>
      )}

      {!isPending && rows.length > 0 && (
        <div className="rounded-md border bg-background">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="p-3 text-left font-medium">Code</th>
                <th className="p-3 text-left font-medium">Name</th>
                <th className="p-3 text-left font-medium">Catalog</th>
                <th className="p-3 text-left font-medium">Cancellation</th>
                <th className="p-3 text-left font-medium">Meal Plan</th>
                <th className="p-3 text-left font-medium">Currency</th>
                <th className="p-3 text-left font-medium">Charge</th>
                <th className="p-3 text-left font-medium">Refundable</th>
                <th className="p-3 text-left font-medium">Commission</th>
                <th className="p-3 text-left font-medium">Status</th>
                <th className="w-20 p-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b last:border-b-0">
                  <td className="p-3 font-mono text-xs">{row.code}</td>
                  <td className="p-3 font-medium">{row.name}</td>
                  <td className="p-3 text-muted-foreground">
                    {row.priceCatalogId ? (catalogMap.get(row.priceCatalogId) ?? "-") : "-"}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {row.cancellationPolicyId
                      ? (cancelMap.get(row.cancellationPolicyId) ?? "-")
                      : "-"}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {row.mealPlanId ? (mealMap.get(row.mealPlanId) ?? "-") : "-"}
                  </td>
                  <td className="p-3 font-mono text-xs">{row.currencyCode}</td>
                  <td className="p-3">
                    <Badge variant="outline" className="capitalize">
                      {row.chargeFrequency.replace(/_/g, " ")}
                    </Badge>
                  </td>
                  <td className="p-3">{row.refundable ? "Yes" : "No"}</td>
                  <td className="p-3">{row.commissionable ? "Yes" : "No"}</td>
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
                          if (confirm(`Delete rate plan "${row.name}"?`)) {
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

      <RatePlanDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        propertyId={propertyId}
        ratePlan={editing}
        onSuccess={() => {
          setDialogOpen(false)
          setEditing(undefined)
          void refetch()
        }}
      />
    </div>
  )
}
