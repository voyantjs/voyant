import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import { Loader2, Plus, Search } from "lucide-react"
import { useState } from "react"
import { Badge, Button, Input } from "@/components/ui"

import { DataTable } from "@/components/ui/data-table"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import { api } from "@/lib/api-client"

import { InvoiceDialog } from "./_components/invoice-dialog"
import { SupplierPaymentDialog } from "./_components/supplier-payment-dialog"

type InvoiceRow = {
  id: string
  invoiceNumber: string
  bookingId: string
  personId: string | null
  organizationId: string | null
  status: "draft" | "sent" | "partially_paid" | "paid" | "overdue" | "void"
  currency: string
  totalCents: number
  paidCents: number
  balanceDueCents: number
  dueDate: string
  createdAt: string
}

type InvoiceListResponse = {
  data: InvoiceRow[]
  total: number
  limit: number
  offset: number
}

type SupplierPaymentRow = {
  id: string
  bookingId: string
  supplierId: string | null
  amountCents: number
  currency: string
  paymentMethod: string
  status: "pending" | "completed" | "failed" | "refunded"
  referenceNumber: string | null
  paymentDate: string
  createdAt: string
}

type SupplierPaymentListResponse = {
  data: SupplierPaymentRow[]
  total: number
  limit: number
  offset: number
}

export const Route = createFileRoute("/_workspace/finance/")({
  component: FinancePage,
})

const invoiceStatusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "outline",
  sent: "secondary",
  partially_paid: "secondary",
  paid: "default",
  overdue: "destructive",
  void: "destructive",
}

const paymentStatusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  pending: "outline",
  completed: "default",
  failed: "destructive",
  refunded: "secondary",
}

function formatAmount(cents: number, currency: string): string {
  return `${(cents / 100).toFixed(2)} ${currency}`
}

function formatStatus(status: string): string {
  return status.replace(/_/g, " ")
}

const invoiceColumns: ColumnDef<InvoiceRow>[] = [
  {
    accessorKey: "invoiceNumber",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Invoice #" />,
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => (
      <Badge
        variant={invoiceStatusVariant[row.original.status] ?? "secondary"}
        className="capitalize"
      >
        {formatStatus(row.original.status)}
      </Badge>
    ),
  },
  {
    accessorKey: "totalCents",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Total" />,
    cell: ({ row }) => (
      <span className="font-mono">
        {formatAmount(row.original.totalCents, row.original.currency)}
      </span>
    ),
  },
  {
    accessorKey: "paidCents",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Paid" />,
    cell: ({ row }) => (
      <span className="font-mono">
        {formatAmount(row.original.paidCents, row.original.currency)}
      </span>
    ),
  },
  {
    accessorKey: "balanceDueCents",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Balance Due" />,
    cell: ({ row }) => (
      <span className="font-mono">
        {formatAmount(row.original.balanceDueCents, row.original.currency)}
      </span>
    ),
  },
  {
    accessorKey: "dueDate",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Due Date" />,
  },
]

const supplierPaymentColumns: ColumnDef<SupplierPaymentRow>[] = [
  {
    accessorKey: "bookingId",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Booking" />,
    cell: ({ row }) => <span className="font-mono text-xs">{row.original.bookingId}</span>,
  },
  {
    accessorKey: "supplierId",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Supplier" />,
    cell: ({ row }) =>
      row.original.supplierId ? (
        <span className="font-mono text-xs">{row.original.supplierId}</span>
      ) : (
        "-"
      ),
  },
  {
    accessorKey: "amountCents",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
    cell: ({ row }) => (
      <span className="font-mono">
        {formatAmount(row.original.amountCents, row.original.currency)}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => (
      <Badge
        variant={paymentStatusVariant[row.original.status] ?? "secondary"}
        className="capitalize"
      >
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "paymentDate",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
  },
  {
    accessorKey: "referenceNumber",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Reference" />,
    cell: ({ row }) => row.original.referenceNumber ?? "-",
  },
]

function FinancePage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<"invoices" | "supplier-payments">("invoices")
  const [search, setSearch] = useState("")
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false)
  const [supplierPaymentDialogOpen, setSupplierPaymentDialogOpen] = useState(false)

  const {
    data: invoiceData,
    isPending: invoicesPending,
    refetch: refetchInvoices,
  } = useQuery({
    queryKey: ["invoices", search],
    queryFn: () => {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      const qs = params.toString()
      return api.get<InvoiceListResponse>(`/v1/finance/invoices${qs ? `?${qs}` : ""}`)
    },
    enabled: tab === "invoices",
  })

  const {
    data: supplierPaymentData,
    isPending: supplierPaymentsPending,
    refetch: refetchSupplierPayments,
  } = useQuery({
    queryKey: ["supplier-payments"],
    queryFn: () => api.get<SupplierPaymentListResponse>("/v1/finance/supplier-payments"),
    enabled: tab === "supplier-payments",
  })

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Finance</h1>
          <p className="text-sm text-muted-foreground">
            Manage invoices, payments, and supplier finances.
          </p>
        </div>
        {tab === "invoices" && (
          <Button onClick={() => setInvoiceDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Invoice
          </Button>
        )}
        {tab === "supplier-payments" && (
          <Button onClick={() => setSupplierPaymentDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Record Supplier Payment
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        <button
          type="button"
          onClick={() => setTab("invoices")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "invoices"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Invoices
        </button>
        <button
          type="button"
          onClick={() => setTab("supplier-payments")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "supplier-payments"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Supplier Payments
        </button>
      </div>

      {/* Invoices tab */}
      {tab === "invoices" && (
        <>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search invoices..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {invoicesPending ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <DataTable
              columns={invoiceColumns}
              data={invoiceData?.data ?? []}
              onRowClick={(row) => {
                void navigate({ to: "/finance/invoices/$id", params: { id: row.original.id } })
              }}
            />
          )}

          {invoiceData && (
            <p className="text-sm text-muted-foreground">
              Showing {invoiceData.data.length} of {invoiceData.total} invoices
            </p>
          )}
        </>
      )}

      {/* Supplier Payments tab */}
      {tab === "supplier-payments" && (
        <>
          {supplierPaymentsPending ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <DataTable columns={supplierPaymentColumns} data={supplierPaymentData?.data ?? []} />
          )}

          {supplierPaymentData && (
            <p className="text-sm text-muted-foreground">
              Showing {supplierPaymentData.data.length} of {supplierPaymentData.total} supplier
              payments
            </p>
          )}
        </>
      )}

      <InvoiceDialog
        open={invoiceDialogOpen}
        onOpenChange={setInvoiceDialogOpen}
        onSuccess={() => {
          setInvoiceDialogOpen(false)
          void refetchInvoices()
        }}
      />

      <SupplierPaymentDialog
        open={supplierPaymentDialogOpen}
        onOpenChange={setSupplierPaymentDialogOpen}
        onSuccess={() => {
          setSupplierPaymentDialogOpen(false)
          void refetchSupplierPayments()
        }}
      />
    </div>
  )
}
