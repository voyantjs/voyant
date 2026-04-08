import { useMutation, useQuery } from "@tanstack/react-query"
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { Badge, Button } from "@/components/ui"
import { api } from "@/lib/api-client"
import { type HousekeepingTaskData, HousekeepingTaskDialog } from "./housekeeping-task-dialog"

type ListResponse<T> = { data: T[]; total: number; limit: number; offset: number }
type RoomUnitLite = { id: string; roomNumber: string | null; code: string | null }

type Props = { propertyId: string }

const formatDateTime = (iso: string | null): string => {
  if (!iso) return "-"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "-"
  return d.toLocaleString()
}

export function HousekeepingTasksTab({ propertyId }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<HousekeepingTaskData | undefined>()

  const { data, isPending, refetch } = useQuery({
    queryKey: ["hospitality", "housekeeping-tasks", propertyId],
    queryFn: () =>
      api.get<ListResponse<HousekeepingTaskData>>(
        `/v1/hospitality/housekeeping-tasks?propertyId=${propertyId}&limit=200`,
      ),
    enabled: !!propertyId,
  })

  const roomUnitsQuery = useQuery({
    queryKey: ["hospitality", "hk-list", "ru", propertyId],
    queryFn: () =>
      api.get<ListResponse<RoomUnitLite>>(
        `/v1/hospitality/room-units?propertyId=${propertyId}&limit=200`,
      ),
    enabled: !!propertyId,
  })
  const roomUnitById = new Map((roomUnitsQuery.data?.data ?? []).map((ru) => [ru.id, ru]))

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/hospitality/housekeeping-tasks/${id}`),
    onSuccess: () => {
      void refetch()
    },
  })

  const rows = data?.data ?? []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Housekeeping & maintenance tasks scoped to a room unit.
        </p>
        <Button
          size="sm"
          onClick={() => {
            setEditing(undefined)
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </div>

      {isPending && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isPending && rows.length === 0 && (
        <div className="rounded-md border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">No housekeeping tasks yet.</p>
        </div>
      )}

      {!isPending && rows.length > 0 && (
        <div className="rounded-md border bg-background">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="p-3 text-left font-medium">Room</th>
                <th className="p-3 text-left font-medium">Type</th>
                <th className="p-3 text-left font-medium">Status</th>
                <th className="p-3 text-left font-medium">Priority</th>
                <th className="p-3 text-left font-medium">Due</th>
                <th className="p-3 text-left font-medium">Assigned</th>
                <th className="w-20 p-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const ru = roomUnitById.get(row.roomUnitId)
                return (
                  <tr key={row.id} className="border-b last:border-b-0">
                    <td className="p-3 text-muted-foreground">
                      {ru ? (ru.roomNumber ?? ru.code ?? ru.id) : row.roomUnitId}
                    </td>
                    <td className="p-3 font-mono text-xs">{row.taskType}</td>
                    <td className="p-3">
                      <Badge variant="outline" className="capitalize">
                        {row.status.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="p-3 font-mono text-xs text-muted-foreground">{row.priority}</td>
                    <td className="p-3 font-mono text-xs text-muted-foreground">
                      {formatDateTime(row.dueAt)}
                    </td>
                    <td className="p-3 text-muted-foreground">{row.assignedTo ?? "-"}</td>
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
                            if (confirm("Delete task?")) {
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

      <HousekeepingTaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        propertyId={propertyId}
        task={editing}
        onSuccess={() => {
          setDialogOpen(false)
          setEditing(undefined)
          void refetch()
        }}
      />
    </div>
  )
}
