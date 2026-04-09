import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { Badge, Button } from "@/components/ui"
import { api } from "@/lib/api-client"
import { getApiListQueryOptions } from "../../_lib/api-query-options"
import { type PriceScheduleData, PriceScheduleDialog } from "../_components/price-schedule-dialog"

export const Route = createFileRoute("/_workspace/settings/pricing/schedules")({
  loader: ({ context }) => context.queryClient.ensureQueryData(getPriceSchedulesQueryOptions()),
  component: PriceSchedulesPage,
})

function PriceSchedulesPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<PriceScheduleData | undefined>()

  const { data, isPending, refetch } = useQuery(getPriceSchedulesQueryOptions())

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/pricing/price-schedules/${id}`),
    onSuccess: () => {
      void refetch()
    },
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Price Schedules</h2>
          <p className="text-sm text-muted-foreground">
            RRULE-based seasonal windows for price adjustments.
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
          New Schedule
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
            No schedules yet. Create one to define seasonal pricing windows.
          </p>
        </div>
      )}

      {!isPending && data?.data && data.data.length > 0 && (
        <div className="rounded-md border bg-background">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="p-3 text-left font-medium">Name</th>
                <th className="p-3 text-left font-medium">Code</th>
                <th className="p-3 text-left font-medium">Recurrence</th>
                <th className="p-3 text-left font-medium">Valid</th>
                <th className="p-3 text-left font-medium">Priority</th>
                <th className="p-3 text-left font-medium">Status</th>
                <th className="w-20 p-3" />
              </tr>
            </thead>
            <tbody>
              {data.data.map((row) => (
                <tr key={row.id} className="border-b last:border-b-0">
                  <td className="p-3">{row.name}</td>
                  <td className="p-3 font-mono text-xs text-muted-foreground">{row.code ?? "-"}</td>
                  <td className="p-3 font-mono text-xs">{row.recurrenceRule}</td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {row.validFrom ?? "—"} → {row.validTo ?? "∞"}
                  </td>
                  <td className="p-3 font-mono">{row.priority}</td>
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
                          if (confirm(`Delete schedule "${row.name}"?`)) {
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

      <PriceScheduleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        schedule={editing}
        onSuccess={() => {
          setDialogOpen(false)
          setEditing(undefined)
          void refetch()
        }}
      />
    </div>
  )
}

function getPriceSchedulesQueryOptions() {
  return getApiListQueryOptions<PriceScheduleData>(
    ["price-schedules"],
    "/v1/pricing/price-schedules?limit=200",
  )
}
