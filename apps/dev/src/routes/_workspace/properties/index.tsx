import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Building2, Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { Badge, Button, Label } from "@/components/ui"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { api } from "@/lib/api-client"
import { type PropertyData, PropertyDialog } from "./_components/property-dialog"

export const Route = createFileRoute("/_workspace/properties/")({
  component: PropertiesPage,
})

type ListResponse<T> = { data: T[]; total: number; limit: number; offset: number }
type FacilityLite = { id: string; name: string }

const PROPERTY_TYPES = [
  "hotel",
  "resort",
  "villa",
  "apartment",
  "hostel",
  "lodge",
  "camp",
  "other",
] as const

function PropertiesPage() {
  const navigate = useNavigate()
  const [propertyType, setPropertyType] = useState<string>("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<PropertyData | undefined>()

  const params = new URLSearchParams({ limit: "200" })
  if (propertyType) params.set("propertyType", propertyType)

  const { data, isPending, refetch } = useQuery({
    queryKey: ["properties", propertyType],
    queryFn: () => api.get<ListResponse<PropertyData>>(`/v1/facilities/properties?${params}`),
  })

  const facilitiesQuery = useQuery({
    queryKey: ["properties", "facilities"],
    queryFn: () => api.get<ListResponse<FacilityLite>>("/v1/facilities/facilities?limit=200"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/facilities/properties/${id}`),
    onSuccess: () => {
      void refetch()
    },
  })

  const facilities = facilitiesQuery.data?.data ?? []
  const facilityById = new Map(facilities.map((f) => [f.id, f]))
  const rows = data?.data ?? []

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-2xl font-bold tracking-tight">Properties</h1>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditing(undefined)
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Property
        </Button>
      </div>

      <div className="grid max-w-sm grid-cols-1 gap-4">
        <div className="flex flex-col gap-2">
          <Label>Property type</Label>
          <Select
            value={propertyType || "all"}
            onValueChange={(v) => setPropertyType(v === "all" ? "" : (v ?? ""))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {PROPERTY_TYPES.map((t) => (
                <SelectItem key={t} value={t} className="capitalize">
                  {t}
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
          <p className="text-sm text-muted-foreground">
            No properties yet. Create a facility with kind=property, then add a property row.
          </p>
        </div>
      )}

      {!isPending && rows.length > 0 && (
        <div className="rounded-md border bg-background">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="p-3 text-left font-medium">Facility</th>
                <th className="p-3 text-left font-medium">Type</th>
                <th className="p-3 text-left font-medium">Brand</th>
                <th className="p-3 text-left font-medium">Rating</th>
                <th className="p-3 text-left font-medium">Check-in</th>
                <th className="p-3 text-left font-medium">Check-out</th>
                <th className="w-20 p-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const facility = facilityById.get(row.facilityId)
                return (
                  <tr
                    key={row.id}
                    className="cursor-pointer border-b last:border-b-0 hover:bg-muted/50"
                    onClick={() => navigate({ to: "/properties/$id", params: { id: row.id } })}
                  >
                    <td className="p-3 font-medium">
                      {facility ? (
                        facility.name
                      ) : (
                        <span className="font-mono text-xs">{row.facilityId}</span>
                      )}
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="capitalize">
                        {row.propertyType}
                      </Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">{row.brandName ?? "-"}</td>
                    <td className="p-3 font-mono text-xs">
                      {row.rating != null
                        ? `${row.rating}${row.ratingScale ? ` / ${row.ratingScale}` : ""}`
                        : "-"}
                    </td>
                    <td className="p-3 font-mono text-xs">{row.checkInTime ?? "-"}</td>
                    <td className="p-3 font-mono text-xs">{row.checkOutTime ?? "-"}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditing(row)
                            setDialogOpen(true)
                          }}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (confirm("Delete property?")) {
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

      <PropertyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        property={editing}
        onSuccess={() => {
          setDialogOpen(false)
          setEditing(undefined)
          void refetch()
        }}
      />
    </div>
  )
}
