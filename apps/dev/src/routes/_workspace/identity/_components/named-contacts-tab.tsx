import { useMutation, useQuery } from "@tanstack/react-query"
import { Loader2, Pencil, Plus, Star, Trash2 } from "lucide-react"
import { useState } from "react"
import { Badge, Button } from "@/components/ui"
import { api } from "@/lib/api-client"
import { type NamedContactData, NamedContactDialog } from "./named-contact-dialog"

type ListResponse<T> = { data: T[]; total: number; limit: number; offset: number }

type Props = { entityType: string; entityId: string }

export function NamedContactsTab({ entityType, entityId }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<NamedContactData | undefined>()

  const { data, isPending, refetch } = useQuery({
    queryKey: ["identity", "named-contacts", entityType, entityId],
    queryFn: () =>
      api.get<ListResponse<NamedContactData>>(
        `/v1/identity/entities/${encodeURIComponent(entityType)}/${encodeURIComponent(entityId)}/named-contacts?limit=200`,
      ),
    enabled: !!entityType && !!entityId,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/identity/named-contacts/${id}`),
    onSuccess: () => {
      void refetch()
    },
  })

  const rows = data?.data ?? []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Named people (concierge, front desk, sales rep) associated with this entity.
        </p>
        <Button
          size="sm"
          onClick={() => {
            setEditing(undefined)
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Named Contact
        </Button>
      </div>

      {isPending && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isPending && rows.length === 0 && (
        <div className="rounded-md border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">No named contacts yet.</p>
        </div>
      )}

      {!isPending && rows.length > 0 && (
        <div className="rounded-md border bg-background">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="p-3 text-left font-medium">Role</th>
                <th className="p-3 text-left font-medium">Name</th>
                <th className="p-3 text-left font-medium">Title</th>
                <th className="p-3 text-left font-medium">Email</th>
                <th className="p-3 text-left font-medium">Phone</th>
                <th className="p-3 text-left font-medium">Primary</th>
                <th className="w-20 p-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b last:border-b-0">
                  <td className="p-3">
                    <Badge variant="outline" className="capitalize">
                      {row.role.replace(/_/g, " ")}
                    </Badge>
                  </td>
                  <td className="p-3 font-medium">{row.name}</td>
                  <td className="p-3 text-muted-foreground">{row.title ?? "-"}</td>
                  <td className="p-3 text-muted-foreground">{row.email ?? "-"}</td>
                  <td className="p-3 text-muted-foreground">{row.phone ?? "-"}</td>
                  <td className="p-3">
                    {row.isPrimary && <Star className="h-3.5 w-3.5 fill-current text-amber-500" />}
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
                          if (confirm(`Delete named contact "${row.name}"?`)) {
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

      <NamedContactDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        entityType={entityType}
        entityId={entityId}
        namedContact={editing}
        onSuccess={() => {
          setDialogOpen(false)
          setEditing(undefined)
          void refetch()
        }}
      />
    </div>
  )
}
