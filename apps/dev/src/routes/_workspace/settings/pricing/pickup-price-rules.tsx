import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { Badge, Button } from "@/components/ui"
import { api } from "@/lib/api-client"
import {
  type PickupPriceRuleData,
  PickupPriceRuleDialog,
} from "../_components/pickup-price-rule-dialog"
import { getPricingSettingsListQueryOptions } from "../_lib/pricing-query-options"

export const Route = createFileRoute("/_workspace/settings/pricing/pickup-price-rules")({
  loader: ({ context }) => context.queryClient.ensureQueryData(getPickupPriceRulesQueryOptions()),
  component: PickupPriceRulesPage,
})

function PickupPriceRulesPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<PickupPriceRuleData | undefined>()

  const { data, isPending, refetch } = useQuery(getPickupPriceRulesQueryOptions())

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/pricing/pickup-price-rules/${id}`),
    onSuccess: () => {
      void refetch()
    },
  })

  const rows = data?.data ?? []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Pickup Price Rules</h2>
          <p className="text-sm text-muted-foreground">
            Per-pickup-point pricing for option price rules.
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
          New Rule
        </Button>
      </div>

      {isPending && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isPending && rows.length === 0 && (
        <div className="rounded-md border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">No pickup price rules yet.</p>
        </div>
      )}

      {!isPending && rows.length > 0 && (
        <div className="rounded-md border bg-background">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="p-3 text-left font-medium">Option price rule</th>
                <th className="p-3 text-left font-medium">Pickup point</th>
                <th className="p-3 text-left font-medium">Mode</th>
                <th className="p-3 text-left font-medium">Sell</th>
                <th className="p-3 text-left font-medium">Cost</th>
                <th className="p-3 text-left font-medium">Status</th>
                <th className="w-20 p-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b last:border-b-0">
                  <td className="p-3 font-mono text-xs">{row.optionPriceRuleId}</td>
                  <td className="p-3 font-mono text-xs">{row.pickupPointId}</td>
                  <td className="p-3">
                    <Badge variant="outline" className="capitalize">
                      {row.pricingMode.replace(/_/g, " ")}
                    </Badge>
                  </td>
                  <td className="p-3 font-mono text-xs">
                    {row.sellAmountCents != null ? (row.sellAmountCents / 100).toFixed(2) : "-"}
                  </td>
                  <td className="p-3 font-mono text-xs">
                    {row.costAmountCents != null ? (row.costAmountCents / 100).toFixed(2) : "-"}
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
                          if (confirm("Delete rule?")) {
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

      <PickupPriceRuleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        rule={editing}
        onSuccess={() => {
          setDialogOpen(false)
          setEditing(undefined)
          void refetch()
        }}
      />
    </div>
  )
}

function getPickupPriceRulesQueryOptions() {
  return getPricingSettingsListQueryOptions<PickupPriceRuleData>(
    ["pricing", "pickup-price-rules"],
    "/v1/pricing/pickup-price-rules?limit=200",
  )
}
