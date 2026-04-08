import { useMutation, useQuery } from "@tanstack/react-query"
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { Badge, Button, Input, Label } from "@/components/ui"
import { api } from "@/lib/api-client"
import { type RoomInventoryData, RoomInventoryDialog } from "./room-inventory-dialog"

type ListResponse<T> = { data: T[]; total: number; limit: number; offset: number }
type RoomTypeLite = { id: string; name: string }

type Props = { propertyId: string }

export function RoomInventoryTab({ propertyId }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<RoomInventoryData | undefined>()
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [roomTypeId, setRoomTypeId] = useState("")

  const params = new URLSearchParams({ propertyId, limit: "200" })
  if (dateFrom) params.set("dateFrom", dateFrom)
  if (dateTo) params.set("dateTo", dateTo)
  if (roomTypeId) params.set("roomTypeId", roomTypeId)

  const { data, isPending, refetch } = useQuery({
    queryKey: ["hospitality", "room-inventory", propertyId, dateFrom, dateTo, roomTypeId],
    queryFn: () =>
      api.get<ListResponse<RoomInventoryData>>(`/v1/hospitality/room-inventory?${params}`),
    enabled: !!propertyId,
  })

  const roomTypesQuery = useQuery({
    queryKey: ["hospitality", "room-inventory", "room-types-list", propertyId],
    queryFn: () =>
      api.get<ListResponse<RoomTypeLite>>(
        `/v1/hospitality/room-types?propertyId=${propertyId}&limit=200`,
      ),
    enabled: !!propertyId,
  })
  const roomTypes = roomTypesQuery.data?.data ?? []
  const roomTypeById = new Map(roomTypes.map((rt) => [rt.id, rt]))

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/hospitality/room-inventory/${id}`),
    onSuccess: () => {
      void refetch()
    },
  })

  const rows = data?.data ?? []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Daily unit availability per room type.</p>
        <Button
          size="sm"
          onClick={() => {
            setEditing(undefined)
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Inventory
        </Button>
      </div>

      <div className="grid max-w-3xl grid-cols-3 gap-3">
        <div className="flex flex-col gap-2">
          <Label>Room type</Label>
          <select
            value={roomTypeId}
            onChange={(e) => setRoomTypeId(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All</option>
            {roomTypes.map((rt) => (
              <option key={rt.id} value={rt.id}>
                {rt.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label>From</Label>
          <Input value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} type="date" />
        </div>
        <div className="flex flex-col gap-2">
          <Label>To</Label>
          <Input value={dateTo} onChange={(e) => setDateTo(e.target.value)} type="date" />
        </div>
      </div>

      {isPending && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isPending && rows.length === 0 && (
        <div className="rounded-md border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">No inventory rows yet.</p>
        </div>
      )}

      {!isPending && rows.length > 0 && (
        <div className="rounded-md border bg-background">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="p-3 text-left font-medium">Date</th>
                <th className="p-3 text-left font-medium">Room type</th>
                <th className="p-3 text-right font-medium">Total</th>
                <th className="p-3 text-right font-medium">Avail</th>
                <th className="p-3 text-right font-medium">Held</th>
                <th className="p-3 text-right font-medium">Sold</th>
                <th className="p-3 text-right font-medium">OOO</th>
                <th className="p-3 text-left font-medium">Stop</th>
                <th className="w-20 p-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b last:border-b-0">
                  <td className="p-3 font-mono text-xs">{row.date}</td>
                  <td className="p-3 text-muted-foreground">
                    {roomTypeById.get(row.roomTypeId)?.name ?? row.roomTypeId}
                  </td>
                  <td className="p-3 text-right font-mono">{row.totalUnits}</td>
                  <td className="p-3 text-right font-mono">{row.availableUnits}</td>
                  <td className="p-3 text-right font-mono">{row.heldUnits}</td>
                  <td className="p-3 text-right font-mono">{row.soldUnits}</td>
                  <td className="p-3 text-right font-mono">{row.outOfOrderUnits}</td>
                  <td className="p-3">
                    {row.stopSell && <Badge variant="destructive">Stop</Badge>}
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
                          if (confirm("Delete inventory row?")) {
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

      <RoomInventoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        propertyId={propertyId}
        inventory={editing}
        onSuccess={() => {
          setDialogOpen(false)
          setEditing(undefined)
          void refetch()
        }}
      />
    </div>
  )
}
