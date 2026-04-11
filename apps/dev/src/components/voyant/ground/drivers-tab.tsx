import type { ColumnDef } from "@tanstack/react-table"
import {
  type GroundDriverRecord,
  useGroundDriverMutation,
  useGroundDrivers,
} from "@voyantjs/ground-react"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { useMemo, useState } from "react"
import { Badge, Button } from "@/components/ui"
import { DataTable } from "@/components/ui/data-table"
import { DriverDialog } from "./driver-dialog"

const PAGE_SIZE = 25

export function DriversTab() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<GroundDriverRecord | undefined>()
  const [pageIndex, setPageIndex] = useState(0)
  const { data, isPending, refetch } = useGroundDrivers({
    limit: PAGE_SIZE,
    offset: pageIndex * PAGE_SIZE,
  })
  const { remove } = useGroundDriverMutation()

  const columns = useMemo<ColumnDef<GroundDriverRecord>[]>(
    () => [
      {
        accessorKey: "resourceId",
        header: "Resource",
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.resourceId}</span>,
      },
      {
        accessorKey: "operatorId",
        header: "Operator",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.operatorId ?? "-"}
          </span>
        ),
      },
      {
        accessorKey: "licenseNumber",
        header: "License",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.licenseNumber ?? "-"}
          </span>
        ),
      },
      {
        accessorKey: "spokenLanguages",
        header: "Languages",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.spokenLanguages.length > 0
              ? row.original.spokenLanguages.join(", ")
              : "-"}
          </span>
        ),
      },
      {
        accessorKey: "isGuide",
        header: "Guide",
        cell: ({ row }) => (row.original.isGuide ? "Yes" : "No"),
      },
      {
        accessorKey: "isMeetAndGreetCapable",
        header: "M&G",
        cell: ({ row }) => (row.original.isMeetAndGreetCapable ? "Yes" : "No"),
      },
      {
        accessorKey: "active",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={row.original.active ? "default" : "outline"}>
            {row.original.active ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: () => <div className="w-20" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setEditing(row.original)
                setDialogOpen(true)
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm("Delete this driver?")) {
                  remove.mutate(row.original.id, { onSuccess: () => void refetch() })
                }
              }}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ),
      },
    ],
    [refetch, remove],
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Drivers attached to operators. Each driver is backed by a resource.
        </p>
        <Button
          size="sm"
          onClick={() => {
            setEditing(undefined)
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Driver
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        emptyMessage={isPending ? "Loading drivers..." : "No drivers yet."}
        pagination={{
          pageIndex,
          pageSize: PAGE_SIZE,
          total: data?.total ?? 0,
          onPageIndexChange: setPageIndex,
        }}
      />

      <DriverDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        driver={editing}
        onSuccess={() => {
          setDialogOpen(false)
          setEditing(undefined)
          void refetch()
        }}
      />
    </div>
  )
}
