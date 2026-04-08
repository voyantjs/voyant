import { useMutation, useQuery } from "@tanstack/react-query"
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { Badge, Button } from "@/components/ui"
import { api } from "@/lib/api-client"
import { type FacilityFeatureData, FacilityFeatureDialog } from "./facility-feature-dialog"

type ListResponse<T> = { data: T[]; total: number; limit: number; offset: number }

type Props = { facilityId: string }

export function FacilityFeaturesTab({ facilityId }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<FacilityFeatureData | undefined>()

  const { data, isPending, refetch } = useQuery({
    queryKey: ["facilities", "features", facilityId],
    queryFn: () =>
      api.get<ListResponse<FacilityFeatureData>>(
        `/v1/facilities/facility-features?facilityId=${facilityId}&limit=200`,
      ),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/facilities/facility-features/${id}`),
    onSuccess: () => {
      void refetch()
    },
  })

  const rows = (data?.data ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Amenities, accessibility, service levels, and policies attached to this facility.
        </p>
        <Button
          size="sm"
          onClick={() => {
            setEditing(undefined)
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Feature
        </Button>
      </div>

      {isPending && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isPending && rows.length === 0 && (
        <div className="rounded-md border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">No features yet.</p>
        </div>
      )}

      {!isPending && rows.length > 0 && (
        <div className="rounded-md border bg-background">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="p-3 text-left font-medium">Name</th>
                <th className="p-3 text-left font-medium">Category</th>
                <th className="p-3 text-left font-medium">Code</th>
                <th className="p-3 text-left font-medium">Value</th>
                <th className="p-3 text-left font-medium">Highlighted</th>
                <th className="w-20 p-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b last:border-b-0">
                  <td className="p-3 font-medium">{row.name}</td>
                  <td className="p-3">
                    <Badge variant="outline" className="capitalize">
                      {row.category}
                    </Badge>
                  </td>
                  <td className="p-3 font-mono text-xs text-muted-foreground">{row.code ?? "-"}</td>
                  <td className="p-3 text-muted-foreground">{row.valueText ?? "-"}</td>
                  <td className="p-3">
                    {row.highlighted && <Badge variant="secondary">Featured</Badge>}
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
                          if (confirm(`Delete feature "${row.name}"?`)) {
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

      <FacilityFeatureDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        facilityId={facilityId}
        feature={editing}
        onSuccess={() => {
          setDialogOpen(false)
          setEditing(undefined)
          void refetch()
        }}
      />
    </div>
  )
}
