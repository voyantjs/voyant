import { useMutation, useQuery } from "@tanstack/react-query"
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { Badge, Button } from "@/components/ui"
import { api } from "@/lib/api-client"
import { type StayRuleData, StayRuleDialog } from "./stay-rule-dialog"

type ListResponse<T> = { data: T[]; total: number; limit: number; offset: number }
type RoomTypeLite = { id: string; name: string }
type RatePlanLite = { id: string; name: string }

type Props = { propertyId: string }

export function StayRulesTab({ propertyId }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<StayRuleData | undefined>()

  const { data, isPending, refetch } = useQuery({
    queryKey: ["hospitality", "stay-rules", propertyId],
    queryFn: () =>
      api.get<ListResponse<StayRuleData>>(
        `/v1/hospitality/stay-rules?propertyId=${propertyId}&limit=200`,
      ),
    enabled: !!propertyId,
  })

  const roomTypesQuery = useQuery({
    queryKey: ["hospitality", "stay-rules", "room-types-list", propertyId],
    queryFn: () =>
      api.get<ListResponse<RoomTypeLite>>(
        `/v1/hospitality/room-types?propertyId=${propertyId}&limit=200`,
      ),
    enabled: !!propertyId,
  })
  const ratePlansQuery = useQuery({
    queryKey: ["hospitality", "stay-rules", "rate-plans-list", propertyId],
    queryFn: () =>
      api.get<ListResponse<RatePlanLite>>(
        `/v1/hospitality/rate-plans?propertyId=${propertyId}&limit=200`,
      ),
    enabled: !!propertyId,
  })
  const roomTypeById = new Map((roomTypesQuery.data?.data ?? []).map((rt) => [rt.id, rt]))
  const ratePlanById = new Map((ratePlansQuery.data?.data ?? []).map((rp) => [rp.id, rp]))

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/hospitality/stay-rules/${id}`),
    onSuccess: () => {
      void refetch()
    },
  })

  const rows = data?.data ?? []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Min/max nights, advance booking, and weekday restrictions scoped by rate plan or room
          type.
        </p>
        <Button
          size="sm"
          onClick={() => {
            setEditing(undefined)
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Stay Rule
        </Button>
      </div>

      {isPending && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isPending && rows.length === 0 && (
        <div className="rounded-md border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">No stay rules yet.</p>
        </div>
      )}

      {!isPending && rows.length > 0 && (
        <div className="rounded-md border bg-background">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="p-3 text-left font-medium">Rate plan</th>
                <th className="p-3 text-left font-medium">Room type</th>
                <th className="p-3 text-left font-medium">Valid</th>
                <th className="p-3 text-left font-medium">Nights</th>
                <th className="p-3 text-left font-medium">Flags</th>
                <th className="p-3 text-left font-medium">Status</th>
                <th className="w-20 p-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b last:border-b-0">
                  <td className="p-3 text-muted-foreground">
                    {row.ratePlanId
                      ? (ratePlanById.get(row.ratePlanId)?.name ?? row.ratePlanId)
                      : "All"}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {row.roomTypeId
                      ? (roomTypeById.get(row.roomTypeId)?.name ?? row.roomTypeId)
                      : "All"}
                  </td>
                  <td className="p-3 font-mono text-xs text-muted-foreground">
                    {row.validFrom ?? "-"} → {row.validTo ?? "-"}
                  </td>
                  <td className="p-3 font-mono text-xs text-muted-foreground">
                    {row.minNights ?? "-"} / {row.maxNights ?? "-"}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      {row.closedToArrival && <Badge variant="outline">CTA</Badge>}
                      {row.closedToDeparture && <Badge variant="outline">CTD</Badge>}
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
                          if (confirm("Delete stay rule?")) {
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

      <StayRuleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        propertyId={propertyId}
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
