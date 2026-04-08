import { useMutation, useQuery } from "@tanstack/react-query"
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { Badge, Button } from "@/components/ui"
import { api } from "@/lib/api-client"
import {
  type PropertyGroupMemberData,
  PropertyGroupMemberDialog,
} from "./property-group-member-dialog"

type ListResponse<T> = { data: T[]; total: number; limit: number; offset: number }
type PropertyLite = { id: string; facilityId: string; brandName: string | null }
type FacilityLite = { id: string; name: string }

type Props = { groupId: string }

export function MembersTab({ groupId }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<PropertyGroupMemberData | undefined>()

  const { data, isPending, refetch } = useQuery({
    queryKey: ["property-group-members", groupId],
    queryFn: () =>
      api.get<ListResponse<PropertyGroupMemberData>>(
        `/v1/facilities/property-group-members?groupId=${groupId}&limit=200`,
      ),
  })

  const propertiesQuery = useQuery({
    queryKey: ["property-group-members", "properties-list"],
    queryFn: () => api.get<ListResponse<PropertyLite>>("/v1/facilities/properties?limit=200"),
  })
  const facilitiesQuery = useQuery({
    queryKey: ["property-group-members", "facilities-list"],
    queryFn: () => api.get<ListResponse<FacilityLite>>("/v1/facilities/facilities?limit=200"),
  })
  const propertyById = new Map((propertiesQuery.data?.data ?? []).map((p) => [p.id, p]))
  const facilityById = new Map((facilitiesQuery.data?.data ?? []).map((f) => [f.id, f]))

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/facilities/property-group-members/${id}`),
    onSuccess: () => {
      void refetch()
    },
  })

  const rows = data?.data ?? []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Properties that belong to this group.</p>
        <Button
          size="sm"
          onClick={() => {
            setEditing(undefined)
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Member
        </Button>
      </div>

      {isPending && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isPending && rows.length === 0 && (
        <div className="rounded-md border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">No members yet.</p>
        </div>
      )}

      {!isPending && rows.length > 0 && (
        <div className="rounded-md border bg-background">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="p-3 text-left font-medium">Property</th>
                <th className="p-3 text-left font-medium">Role</th>
                <th className="p-3 text-left font-medium">Primary</th>
                <th className="p-3 text-left font-medium">Valid from</th>
                <th className="p-3 text-left font-medium">Valid to</th>
                <th className="w-20 p-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const property = propertyById.get(row.propertyId)
                const facility = property ? facilityById.get(property.facilityId) : undefined
                return (
                  <tr key={row.id} className="border-b last:border-b-0">
                    <td className="p-3 font-medium">{facility?.name ?? row.propertyId}</td>
                    <td className="p-3">
                      <Badge variant="outline" className="capitalize">
                        {row.membershipRole}
                      </Badge>
                    </td>
                    <td className="p-3">
                      {row.isPrimary && <Badge variant="secondary">Primary</Badge>}
                    </td>
                    <td className="p-3 font-mono text-xs text-muted-foreground">
                      {row.validFrom ?? "-"}
                    </td>
                    <td className="p-3 font-mono text-xs text-muted-foreground">
                      {row.validTo ?? "-"}
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
                            if (confirm("Remove member?")) {
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

      <PropertyGroupMemberDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        groupId={groupId}
        member={editing}
        onSuccess={() => {
          setDialogOpen(false)
          setEditing(undefined)
          void refetch()
        }}
      />
    </div>
  )
}
