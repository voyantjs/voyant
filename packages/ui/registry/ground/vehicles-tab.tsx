"use client"

import type { ColumnDef } from "@tanstack/react-table"
import {
  type GroundVehicleRecord,
  useGroundVehicleMutation,
  useGroundVehicles,
} from "@voyantjs/ground-react"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { useMemo, useState } from "react"

import { Badge, Button } from "@/components/ui"
import { DataTable } from "@/components/ui/data-table"
import { VehicleDialog } from "./vehicle-dialog"

const PAGE_SIZE = 25

export function VehiclesTab() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<GroundVehicleRecord | undefined>()
  const [pageIndex, setPageIndex] = useState(0)
  const { data, isPending, refetch } = useGroundVehicles({
    limit: PAGE_SIZE,
    offset: pageIndex * PAGE_SIZE,
  })
  const { remove } = useGroundVehicleMutation()

  const columns = useMemo<ColumnDef<GroundVehicleRecord>[]>(
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
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => (
          <Badge variant="outline" className="capitalize">
            {row.original.category.replace(/_/g, " ")}
          </Badge>
        ),
      },
      {
        accessorKey: "vehicleClass",
        header: "Class",
        cell: ({ row }) => (
          <Badge variant="secondary" className="capitalize">
            {row.original.vehicleClass.replace(/_/g, " ")}
          </Badge>
        ),
      },
      {
        accessorKey: "passengerCapacity",
        header: "Pax",
        cell: ({ row }) => row.original.passengerCapacity ?? "-",
      },
      {
        accessorKey: "isAccessible",
        header: "Accessible",
        cell: ({ row }) => (row.original.isAccessible ? "Yes" : "No"),
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
                if (confirm("Delete this vehicle?")) {
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
          Vehicles attached to operators. Each vehicle is backed by a resource.
        </p>
        <Button
          size="sm"
          onClick={() => {
            setEditing(undefined)
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Vehicle
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        emptyMessage={isPending ? "Loading vehicles..." : "No vehicles yet."}
        pagination={{
          pageIndex,
          pageSize: PAGE_SIZE,
          total: data?.total ?? 0,
          onPageIndexChange: setPageIndex,
        }}
      />

      <VehicleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        vehicle={editing}
        onSuccess={() => {
          setDialogOpen(false)
          setEditing(undefined)
          void refetch()
        }}
      />
    </div>
  )
}
