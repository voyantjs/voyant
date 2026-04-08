import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { Building, Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { Badge, Button, Input, Label } from "@/components/ui"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { api } from "@/lib/api-client"
import { type PropertyGroupData, PropertyGroupDialog } from "./_components/property-group-dialog"

export const Route = createFileRoute("/_workspace/property-groups/")({
  component: PropertyGroupsPage,
})

type ListResponse<T> = { data: T[]; total: number; limit: number; offset: number }

const GROUP_TYPES = [
  "chain",
  "brand",
  "management_company",
  "collection",
  "portfolio",
  "cluster",
  "other",
] as const
const STATUSES = ["active", "inactive", "archived"] as const

function PropertyGroupsPage() {
  const [search, setSearch] = useState("")
  const [groupType, setGroupType] = useState<string>("")
  const [status, setStatus] = useState<string>("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<PropertyGroupData | undefined>()

  const params = new URLSearchParams({ limit: "200" })
  if (search.trim()) params.set("search", search.trim())
  if (groupType) params.set("groupType", groupType)
  if (status) params.set("status", status)

  const { data, isPending, refetch } = useQuery({
    queryKey: ["property-groups", search, groupType, status],
    queryFn: () =>
      api.get<ListResponse<PropertyGroupData>>(`/v1/facilities/property-groups?${params}`),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/facilities/property-groups/${id}`),
    onSuccess: () => {
      void refetch()
    },
  })

  const rows = data?.data ?? []

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Building className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-2xl font-bold tracking-tight">Property Groups</h1>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditing(undefined)
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Group
        </Button>
      </div>

      <div className="grid max-w-4xl grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <Label>Search</Label>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name or code…"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Type</Label>
          <Select
            value={groupType || "all"}
            onValueChange={(v) => setGroupType(v === "all" ? "" : (v ?? ""))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {GROUP_TYPES.map((t) => (
                <SelectItem key={t} value={t} className="capitalize">
                  {t.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Status</Label>
          <Select
            value={status || "all"}
            onValueChange={(v) => setStatus(v === "all" ? "" : (v ?? ""))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s}
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
          <p className="text-sm text-muted-foreground">No property groups yet.</p>
        </div>
      )}

      {!isPending && rows.length > 0 && (
        <div className="rounded-md border bg-background">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="p-3 text-left font-medium">Name</th>
                <th className="p-3 text-left font-medium">Code</th>
                <th className="p-3 text-left font-medium">Type</th>
                <th className="p-3 text-left font-medium">Brand</th>
                <th className="p-3 text-left font-medium">Status</th>
                <th className="w-20 p-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b last:border-b-0">
                  <td className="p-3 font-medium">
                    <Link
                      to="/property-groups/$id"
                      params={{ id: row.id }}
                      className="hover:underline"
                    >
                      {row.name}
                    </Link>
                  </td>
                  <td className="p-3 font-mono text-xs text-muted-foreground">{row.code ?? "-"}</td>
                  <td className="p-3">
                    <Badge variant="outline" className="capitalize">
                      {row.groupType.replace(/_/g, " ")}
                    </Badge>
                  </td>
                  <td className="p-3 text-muted-foreground">{row.brandName ?? "-"}</td>
                  <td className="p-3">
                    <Badge variant={row.status === "active" ? "default" : "outline"}>
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
                          if (confirm(`Delete group "${row.name}"?`)) {
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

      <PropertyGroupDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        group={editing}
        onSuccess={() => {
          setDialogOpen(false)
          setEditing(undefined)
          void refetch()
        }}
      />
    </div>
  )
}
