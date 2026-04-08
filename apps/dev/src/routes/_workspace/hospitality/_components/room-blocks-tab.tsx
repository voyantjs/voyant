import { useMutation, useQuery } from "@tanstack/react-query"
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { Badge, Button } from "@/components/ui"
import { api } from "@/lib/api-client"
import { type RoomBlockData, RoomBlockDialog } from "./room-block-dialog"

type ListResponse<T> = { data: T[]; total: number; limit: number; offset: number }
type RoomTypeLite = { id: string; name: string }
type RoomUnitLite = { id: string; roomNumber: string | null }

type Props = { propertyId: string }

export function RoomBlocksTab({ propertyId }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<RoomBlockData | undefined>()

  const { data, isPending, refetch } = useQuery({
    queryKey: ["hospitality", "room-blocks", propertyId],
    queryFn: () =>
      api.get<ListResponse<RoomBlockData>>(
        `/v1/hospitality/room-blocks?propertyId=${propertyId}&limit=200`,
      ),
    enabled: !!propertyId,
  })

  const roomTypesQuery = useQuery({
    queryKey: ["hospitality", "room-blocks", "rt", propertyId],
    queryFn: () =>
      api.get<ListResponse<RoomTypeLite>>(
        `/v1/hospitality/room-types?propertyId=${propertyId}&limit=200`,
      ),
    enabled: !!propertyId,
  })
  const roomUnitsQuery = useQuery({
    queryKey: ["hospitality", "room-blocks", "ru", propertyId],
    queryFn: () =>
      api.get<ListResponse<RoomUnitLite>>(
        `/v1/hospitality/room-units?propertyId=${propertyId}&limit=200`,
      ),
    enabled: !!propertyId,
  })
  const roomTypeById = new Map((roomTypesQuery.data?.data ?? []).map((rt) => [rt.id, rt]))
  const roomUnitById = new Map((roomUnitsQuery.data?.data ?? []).map((ru) => [ru.id, ru]))

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/hospitality/room-blocks/${id}`),
    onSuccess: () => {
      void refetch()
    },
  })

  const rows = data?.data ?? []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Hold rooms for group bookings, allotments, or other commitments.
        </p>
        <Button
          size="sm"
          onClick={() => {
            setEditing(undefined)
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Block
        </Button>
      </div>

      {isPending && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isPending && rows.length === 0 && (
        <div className="rounded-md border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">No room blocks yet.</p>
        </div>
      )}

      {!isPending && rows.length > 0 && (
        <div className="rounded-md border bg-background">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="p-3 text-left font-medium">Dates</th>
                <th className="p-3 text-left font-medium">Room type / unit</th>
                <th className="p-3 text-left font-medium">Qty</th>
                <th className="p-3 text-left font-medium">Reason</th>
                <th className="p-3 text-left font-medium">Status</th>
                <th className="w-20 p-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const rt = row.roomTypeId ? roomTypeById.get(row.roomTypeId)?.name : null
                const ru = row.roomUnitId ? roomUnitById.get(row.roomUnitId)?.roomNumber : null
                return (
                  <tr key={row.id} className="border-b last:border-b-0">
                    <td className="p-3 font-mono text-xs">
                      {row.startsOn} → {row.endsOn}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {rt ?? ru ?? row.roomTypeId ?? row.roomUnitId ?? "-"}
                    </td>
                    <td className="p-3 font-mono">{row.quantity}</td>
                    <td className="p-3 text-muted-foreground">{row.blockReason ?? "-"}</td>
                    <td className="p-3">
                      <Badge variant="outline" className="capitalize">
                        {row.status}
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
                            if (confirm("Delete block?")) {
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

      <RoomBlockDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        propertyId={propertyId}
        block={editing}
        onSuccess={() => {
          setDialogOpen(false)
          setEditing(undefined)
          void refetch()
        }}
      />
    </div>
  )
}
