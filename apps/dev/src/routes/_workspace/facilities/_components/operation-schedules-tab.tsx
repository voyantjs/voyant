import { useMutation, useQuery } from "@tanstack/react-query"
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { Badge, Button } from "@/components/ui"
import { api } from "@/lib/api-client"
import { type OperationScheduleData, OperationScheduleDialog } from "./operation-schedule-dialog"

type ListResponse<T> = { data: T[]; total: number; limit: number; offset: number }

type Props = { facilityId: string }

export function OperationSchedulesTab({ facilityId }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<OperationScheduleData | undefined>()

  const { data, isPending, refetch } = useQuery({
    queryKey: ["facilities", "operation-schedules", facilityId],
    queryFn: () =>
      api.get<ListResponse<OperationScheduleData>>(
        `/v1/facilities/facility-operation-schedules?facilityId=${facilityId}&limit=200`,
      ),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/facilities/facility-operation-schedules/${id}`),
    onSuccess: () => {
      void refetch()
    },
  })

  const rows = data?.data ?? []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Operating hours per weekday or date range.</p>
        <Button
          size="sm"
          onClick={() => {
            setEditing(undefined)
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Schedule
        </Button>
      </div>

      {isPending && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isPending && rows.length === 0 && (
        <div className="rounded-md border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">No schedules yet.</p>
        </div>
      )}

      {!isPending && rows.length > 0 && (
        <div className="rounded-md border bg-background">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="p-3 text-left font-medium">Day</th>
                <th className="p-3 text-left font-medium">Valid from</th>
                <th className="p-3 text-left font-medium">Valid to</th>
                <th className="p-3 text-left font-medium">Opens</th>
                <th className="p-3 text-left font-medium">Closes</th>
                <th className="p-3 text-left font-medium">Closed</th>
                <th className="w-20 p-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b last:border-b-0">
                  <td className="p-3 capitalize">{row.dayOfWeek ?? "any"}</td>
                  <td className="p-3 font-mono text-xs text-muted-foreground">
                    {row.validFrom ?? "-"}
                  </td>
                  <td className="p-3 font-mono text-xs text-muted-foreground">
                    {row.validTo ?? "-"}
                  </td>
                  <td className="p-3 font-mono text-xs">{row.opensAt ?? "-"}</td>
                  <td className="p-3 font-mono text-xs">{row.closesAt ?? "-"}</td>
                  <td className="p-3">
                    {row.closed && <Badge variant="destructive">Closed</Badge>}
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
                          if (confirm("Delete schedule?")) {
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

      <OperationScheduleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        facilityId={facilityId}
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
