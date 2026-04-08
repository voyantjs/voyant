import { useMutation, useQuery } from "@tanstack/react-query"
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { Badge, Button } from "@/components/ui"
import { api } from "@/lib/api-client"
import { type StayFolioData, StayFolioDialog } from "./stay-folio-dialog"
import type { StayOperationData } from "./stay-operation-dialog"

type ListResponse<T> = { data: T[]; total: number; limit: number; offset: number }

type Props = { propertyId: string }

const formatDateTime = (iso: string | null): string => {
  if (!iso) return "-"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "-"
  return d.toLocaleString()
}

export function StayFoliosTab({ propertyId }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<StayFolioData | undefined>()

  // Folios don't filter by property directly; filter via operations tied to this property.
  const operationsQuery = useQuery({
    queryKey: ["hospitality", "folios-list", "sop", propertyId],
    queryFn: () =>
      api.get<ListResponse<StayOperationData>>(
        `/v1/hospitality/stay-operations?propertyId=${propertyId}&limit=200`,
      ),
    enabled: !!propertyId,
  })
  const operationIds = (operationsQuery.data?.data ?? []).map((o) => o.id)

  const { data, isPending, refetch } = useQuery({
    queryKey: ["hospitality", "stay-folios", propertyId, operationIds.join(",")],
    queryFn: async () => {
      if (operationIds.length === 0) return []
      const lists = await Promise.all(
        operationIds.map((id) =>
          api.get<ListResponse<StayFolioData>>(
            `/v1/hospitality/stay-folios?stayOperationId=${id}&limit=200`,
          ),
        ),
      )
      return lists.flatMap((l) => l.data)
    },
    enabled: !!propertyId && !operationsQuery.isPending,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/hospitality/stay-folios/${id}`),
    onSuccess: () => {
      void refetch()
    },
  })

  const rows = data ?? []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Guest folios — running ledger of postings per stay operation.
        </p>
        <Button
          size="sm"
          onClick={() => {
            setEditing(undefined)
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Folio
        </Button>
      </div>

      {(isPending || operationsQuery.isPending) && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isPending && !operationsQuery.isPending && rows.length === 0 && (
        <div className="rounded-md border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">No stay folios yet.</p>
        </div>
      )}

      {!isPending && rows.length > 0 && (
        <div className="rounded-md border bg-background">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="p-3 text-left font-medium">Stay operation</th>
                <th className="p-3 text-left font-medium">Currency</th>
                <th className="p-3 text-left font-medium">Status</th>
                <th className="p-3 text-left font-medium">Opened</th>
                <th className="p-3 text-left font-medium">Closed</th>
                <th className="w-20 p-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b last:border-b-0">
                  <td className="p-3 font-mono text-xs">{row.stayOperationId}</td>
                  <td className="p-3 font-mono text-xs text-muted-foreground">
                    {row.currencyCode}
                  </td>
                  <td className="p-3">
                    <Badge variant="outline" className="capitalize">
                      {row.status}
                    </Badge>
                  </td>
                  <td className="p-3 font-mono text-xs text-muted-foreground">
                    {formatDateTime(row.openedAt)}
                  </td>
                  <td className="p-3 font-mono text-xs text-muted-foreground">
                    {formatDateTime(row.closedAt)}
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
                          if (confirm("Delete folio?")) {
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

      <StayFolioDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        folio={editing}
        onSuccess={() => {
          setDialogOpen(false)
          setEditing(undefined)
          void refetch()
        }}
      />
    </div>
  )
}
