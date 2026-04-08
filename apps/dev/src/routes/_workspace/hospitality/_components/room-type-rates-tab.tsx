import { useMutation, useQuery } from "@tanstack/react-query"
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { Badge, Button } from "@/components/ui"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { api } from "@/lib/api-client"
import { type RoomTypeRateData, RoomTypeRateDialog } from "./room-type-rate-dialog"

type ListResponse<T> = { data: T[]; total: number; limit: number; offset: number }
type NamedEntity = { id: string; name: string; code?: string }
type RatePlanEntity = NamedEntity & { priceCatalogId: string | null }

type Props = { propertyId: string }

function formatAmount(cents: number | null, currency: string): string {
  if (cents == null) return "-"
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

export function RoomTypeRatesTab({ propertyId }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<RoomTypeRateData | undefined>()
  const [filterRatePlanId, setFilterRatePlanId] = useState("")
  const [filterRoomTypeId, setFilterRoomTypeId] = useState("")

  const queryParams = new URLSearchParams()
  if (filterRatePlanId) queryParams.set("ratePlanId", filterRatePlanId)
  if (filterRoomTypeId) queryParams.set("roomTypeId", filterRoomTypeId)
  queryParams.set("limit", "200")

  const { data, isPending, refetch } = useQuery({
    queryKey: ["hospitality", "room-type-rates", filterRatePlanId, filterRoomTypeId],
    queryFn: () =>
      api.get<ListResponse<RoomTypeRateData>>(
        `/v1/hospitality/room-type-rates?${queryParams.toString()}`,
      ),
  })

  const { data: ratePlansData } = useQuery({
    queryKey: ["hospitality", "rate-plans", propertyId],
    queryFn: () =>
      api.get<ListResponse<RatePlanEntity>>(
        `/v1/hospitality/rate-plans?propertyId=${propertyId}&limit=200`,
      ),
    enabled: !!propertyId,
  })

  const { data: roomTypesData } = useQuery({
    queryKey: ["hospitality", "room-types", propertyId],
    queryFn: () =>
      api.get<ListResponse<NamedEntity>>(
        `/v1/hospitality/room-types?propertyId=${propertyId}&limit=200`,
      ),
    enabled: !!propertyId,
  })

  const { data: schedulesData } = useQuery({
    queryKey: ["pricing", "price-schedules-all"],
    queryFn: () => api.get<ListResponse<NamedEntity>>("/v1/pricing/price-schedules?limit=200"),
  })

  const ratePlanMap = new Map((ratePlansData?.data ?? []).map((rp) => [rp.id, rp]))
  const roomTypeMap = new Map((roomTypesData?.data ?? []).map((rt) => [rt.id, rt.name]))
  const scheduleMap = new Map((schedulesData?.data ?? []).map((s) => [s.id, s.name]))

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/hospitality/room-type-rates/${id}`),
    onSuccess: () => {
      void refetch()
    },
  })

  const rows = data?.data ?? []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Base rate pricing per rate plan, room type, and season.
        </p>
        <Button
          size="sm"
          onClick={() => {
            setEditing(undefined)
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Rate
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="w-56">
          <Select
            value={filterRatePlanId}
            onValueChange={(v) => setFilterRatePlanId(v === "__all__" ? "" : (v ?? ""))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All rate plans" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All rate plans</SelectItem>
              {(ratePlansData?.data ?? []).map((rp) => (
                <SelectItem key={rp.id} value={rp.id}>
                  {rp.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-56">
          <Select
            value={filterRoomTypeId}
            onValueChange={(v) => setFilterRoomTypeId(v === "__all__" ? "" : (v ?? ""))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All room types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All room types</SelectItem>
              {(roomTypesData?.data ?? []).map((rt) => (
                <SelectItem key={rt.id} value={rt.id}>
                  {rt.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isPending && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isPending && rows.length === 0 && (
        <div className="rounded-md border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">No room type rates yet.</p>
        </div>
      )}

      {!isPending && rows.length > 0 && (
        <div className="rounded-md border bg-background">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="p-3 text-left font-medium">Rate Plan</th>
                <th className="p-3 text-left font-medium">Room Type</th>
                <th className="p-3 text-left font-medium">Season</th>
                <th className="p-3 text-left font-medium">Currency</th>
                <th className="p-3 text-right font-medium">Base Rate</th>
                <th className="p-3 text-right font-medium">Extra Adult</th>
                <th className="p-3 text-right font-medium">Extra Child</th>
                <th className="p-3 text-left font-medium">Status</th>
                <th className="w-20 p-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const rpName = ratePlanMap.get(row.ratePlanId)?.name ?? row.ratePlanId
                const rtName = roomTypeMap.get(row.roomTypeId) ?? row.roomTypeId
                const seasonName = row.priceScheduleId
                  ? (scheduleMap.get(row.priceScheduleId) ?? "Unknown")
                  : "Base"
                return (
                  <tr key={row.id} className="border-b last:border-b-0">
                    <td className="p-3 font-medium">{rpName}</td>
                    <td className="p-3">{rtName}</td>
                    <td className="p-3 text-muted-foreground">{seasonName}</td>
                    <td className="p-3 font-mono text-xs">{row.currencyCode}</td>
                    <td className="p-3 text-right font-mono text-xs">
                      {formatAmount(row.baseAmountCents, row.currencyCode)}
                    </td>
                    <td className="p-3 text-right font-mono text-xs">
                      {formatAmount(row.extraAdultAmountCents, row.currencyCode)}
                    </td>
                    <td className="p-3 text-right font-mono text-xs">
                      {formatAmount(row.extraChildAmountCents, row.currencyCode)}
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
                            if (confirm("Delete this rate?")) {
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

      <RoomTypeRateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        propertyId={propertyId}
        roomTypeRate={editing}
        onSuccess={() => {
          setDialogOpen(false)
          setEditing(undefined)
          void refetch()
        }}
      />
    </div>
  )
}
