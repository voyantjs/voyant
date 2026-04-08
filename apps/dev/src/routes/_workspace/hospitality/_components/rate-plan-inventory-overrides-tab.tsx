import { useMutation, useQuery } from "@tanstack/react-query"
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { Badge, Button } from "@/components/ui"
import { api } from "@/lib/api-client"
import {
  type RatePlanInventoryOverrideData,
  RatePlanInventoryOverrideDialog,
} from "./rate-plan-inventory-override-dialog"

type ListResponse<T> = { data: T[]; total: number; limit: number; offset: number }
type RoomTypeLite = { id: string; name: string }
type RatePlanLite = { id: string; name: string }

type Props = { propertyId: string }

export function RatePlanInventoryOverridesTab({ propertyId }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<RatePlanInventoryOverrideData | undefined>()

  const ratePlansQuery = useQuery({
    queryKey: ["hospitality", "rp-overrides", "rate-plans", propertyId],
    queryFn: () =>
      api.get<ListResponse<RatePlanLite>>(
        `/v1/hospitality/rate-plans?propertyId=${propertyId}&limit=200`,
      ),
    enabled: !!propertyId,
  })
  const roomTypesQuery = useQuery({
    queryKey: ["hospitality", "rp-overrides", "room-types", propertyId],
    queryFn: () =>
      api.get<ListResponse<RoomTypeLite>>(
        `/v1/hospitality/room-types?propertyId=${propertyId}&limit=200`,
      ),
    enabled: !!propertyId,
  })
  const ratePlans = ratePlansQuery.data?.data ?? []
  const ratePlanById = new Map(ratePlans.map((rp) => [rp.id, rp]))
  const roomTypeById = new Map((roomTypesQuery.data?.data ?? []).map((rt) => [rt.id, rt]))

  const ratePlanIds = ratePlans.map((rp) => rp.id)

  const { data, isPending, refetch } = useQuery({
    queryKey: ["hospitality", "rp-overrides", propertyId, ratePlanIds.join(",")],
    queryFn: async () => {
      if (ratePlanIds.length === 0) {
        return { data: [], total: 0, limit: 0, offset: 0 }
      }
      const lists = await Promise.all(
        ratePlanIds.map((id) =>
          api.get<ListResponse<RatePlanInventoryOverrideData>>(
            `/v1/hospitality/rate-plan-inventory-overrides?ratePlanId=${id}&limit=200`,
          ),
        ),
      )
      const all = lists.flatMap((l) => l.data)
      return { data: all, total: all.length, limit: all.length, offset: 0 }
    },
    enabled: !!propertyId && ratePlans.length > 0,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/hospitality/rate-plan-inventory-overrides/${id}`),
    onSuccess: () => {
      void refetch()
    },
  })

  const rows = data?.data ?? []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Daily overrides on stop-sell, CTA/CTD, and min/max nights per rate plan × room type.
        </p>
        <Button
          size="sm"
          onClick={() => {
            setEditing(undefined)
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Override
        </Button>
      </div>

      {isPending && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isPending && rows.length === 0 && (
        <div className="rounded-md border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">No overrides yet.</p>
        </div>
      )}

      {!isPending && rows.length > 0 && (
        <div className="rounded-md border bg-background">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="p-3 text-left font-medium">Date</th>
                <th className="p-3 text-left font-medium">Rate plan</th>
                <th className="p-3 text-left font-medium">Room type</th>
                <th className="p-3 text-left font-medium">Flags</th>
                <th className="p-3 text-left font-medium">Nights</th>
                <th className="w-20 p-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b last:border-b-0">
                  <td className="p-3 font-mono text-xs">{row.date}</td>
                  <td className="p-3 text-muted-foreground">
                    {ratePlanById.get(row.ratePlanId)?.name ?? row.ratePlanId}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {roomTypeById.get(row.roomTypeId)?.name ?? row.roomTypeId}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      {row.stopSell && <Badge variant="destructive">Stop</Badge>}
                      {row.closedToArrival && <Badge variant="outline">CTA</Badge>}
                      {row.closedToDeparture && <Badge variant="outline">CTD</Badge>}
                    </div>
                  </td>
                  <td className="p-3 font-mono text-xs text-muted-foreground">
                    {row.minNightsOverride ?? "-"} / {row.maxNightsOverride ?? "-"}
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
                          if (confirm("Delete override?")) {
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

      <RatePlanInventoryOverrideDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        propertyId={propertyId}
        override={editing}
        onSuccess={() => {
          setDialogOpen(false)
          setEditing(undefined)
          void refetch()
        }}
      />
    </div>
  )
}
