import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import { Loader2, Plus, Search } from "lucide-react"
import { useState } from "react"
import {
  Badge,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui"
import { DataTable } from "@/components/ui/data-table"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import { api } from "@/lib/api-client"
import { queryKeys } from "@/lib/query-keys"
import { ContractDialog } from "./_components/contract-dialog"

type ContractRow = {
  id: string
  contractNumber: string | null
  title: string
  scope: "customer" | "supplier" | "partner" | "channel" | "other"
  status: "draft" | "issued" | "sent" | "signed" | "executed" | "expired" | "void"
  personId: string | null
  organizationId: string | null
  createdAt: string
}

type ContractListResponse = {
  data: ContractRow[]
  total: number
  limit: number
  offset: number
}

export const Route = createFileRoute("/_workspace/legal/contracts/")({
  component: ContractsPage,
})

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "outline",
  issued: "secondary",
  sent: "secondary",
  signed: "default",
  executed: "default",
  expired: "destructive",
  void: "destructive",
}

const SCOPES = ["customer", "supplier", "partner", "channel", "other"] as const
const STATUSES = ["draft", "issued", "sent", "signed", "executed", "expired", "void"] as const

const columns: ColumnDef<ContractRow>[] = [
  {
    accessorKey: "contractNumber",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Number" />,
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.contractNumber ?? "-"}</span>
    ),
  },
  {
    accessorKey: "title",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
  },
  {
    accessorKey: "scope",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Scope" />,
    cell: ({ row }) => (
      <Badge variant="outline" className="capitalize">
        {row.original.scope}
      </Badge>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => (
      <Badge variant={statusVariant[row.original.status] ?? "secondary"} className="capitalize">
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "personId",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Person" />,
    cell: ({ row }) => <span className="font-mono text-xs">{row.original.personId ?? "-"}</span>,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
  },
]

function ContractsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [scope, setScope] = useState<string>("all")
  const [status, setStatus] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data, isPending, refetch } = useQuery({
    queryKey: queryKeys.legal.contracts.list(search),
    queryFn: () => {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (scope !== "all") params.set("scope", scope)
      if (status !== "all") params.set("status", status)
      const qs = params.toString()
      return api.get<ContractListResponse>(`/v1/admin/legal/contracts${qs ? `?${qs}` : ""}`)
    },
  })

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contracts</h1>
          <p className="text-sm text-muted-foreground">
            Manage legal contracts across customers, suppliers, and partners.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Contract
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search contracts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={scope} onValueChange={(v) => setScope(v ?? "all")}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Scope" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All scopes</SelectItem>
            {SCOPES.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => setStatus(v ?? "all")}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
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

      {isPending ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={data?.data ?? []}
          onRowClick={(row) => {
            void navigate({ to: "/legal/contracts/$id", params: { id: row.original.id } })
          }}
        />
      )}

      {data && (
        <p className="text-sm text-muted-foreground">
          Showing {data.data.length} of {data.total} contracts
        </p>
      )}

      <ContractDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => {
          setDialogOpen(false)
          void refetch()
        }}
      />
    </div>
  )
}
