import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { ArrowLeft, Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Textarea } from "@/components/ui"

import { api } from "@/lib/api-client"

import { CreditNoteDialog } from "../_components/credit-note-dialog"
import { InvoiceDialog } from "../_components/invoice-dialog"
import { LineItemDialog } from "../_components/line-item-dialog"
import { PaymentDialog } from "../_components/payment-dialog"

type InvoiceDetail = {
  id: string
  invoiceNumber: string
  bookingId: string
  personId: string | null
  organizationId: string | null
  status: "draft" | "sent" | "partially_paid" | "paid" | "overdue" | "void"
  currency: string
  subtotalCents: number
  taxCents: number
  totalCents: number
  paidCents: number
  balanceDueCents: number
  issueDate: string
  dueDate: string
  notes: string | null
  createdAt: string
  updatedAt: string
}

type LineItem = {
  id: string
  invoiceId: string
  description: string
  quantity: number
  unitPriceCents: number
  totalCents: number
  taxRate: number | null
  sortOrder: number
  createdAt: string
}

type PaymentRow = {
  id: string
  invoiceId: string
  amountCents: number
  currency: string
  paymentMethod: string
  status: "pending" | "completed" | "failed" | "refunded"
  referenceNumber: string | null
  paymentDate: string
  notes: string | null
  createdAt: string
}

type CreditNoteRow = {
  id: string
  creditNoteNumber: string
  invoiceId: string
  status: "draft" | "issued" | "applied"
  amountCents: number
  currency: string
  reason: string
  notes: string | null
  createdAt: string
}

type FinanceNote = {
  id: string
  invoiceId: string
  authorId: string
  content: string
  createdAt: string
}

function getInvoiceQueryOptions(id: string) {
  return queryOptions({
    queryKey: ["invoice", id],
    queryFn: () => api.get<{ data: InvoiceDetail }>(`/v1/finance/invoices/${id}`),
  })
}

function getInvoiceLineItemsQueryOptions(id: string) {
  return queryOptions({
    queryKey: ["invoice-line-items", id],
    queryFn: () => api.get<{ data: LineItem[] }>(`/v1/finance/invoices/${id}/line-items`),
  })
}

function getInvoicePaymentsQueryOptions(id: string) {
  return queryOptions({
    queryKey: ["invoice-payments", id],
    queryFn: () => api.get<{ data: PaymentRow[] }>(`/v1/finance/invoices/${id}/payments`),
  })
}

function getInvoiceCreditNotesQueryOptions(id: string) {
  return queryOptions({
    queryKey: ["invoice-credit-notes", id],
    queryFn: () => api.get<{ data: CreditNoteRow[] }>(`/v1/finance/invoices/${id}/credit-notes`),
  })
}

function getInvoiceNotesQueryOptions(id: string) {
  return queryOptions({
    queryKey: ["invoice-notes", id],
    queryFn: () => api.get<{ data: FinanceNote[] }>(`/v1/finance/invoices/${id}/notes`),
  })
}

export const Route = createFileRoute("/_workspace/finance/invoices/$id")({
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(getInvoiceQueryOptions(params.id)),
      context.queryClient.ensureQueryData(getInvoiceLineItemsQueryOptions(params.id)),
      context.queryClient.ensureQueryData(getInvoicePaymentsQueryOptions(params.id)),
      context.queryClient.ensureQueryData(getInvoiceCreditNotesQueryOptions(params.id)),
      context.queryClient.ensureQueryData(getInvoiceNotesQueryOptions(params.id)),
    ]),
  component: InvoiceDetailPage,
})

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
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

const creditNoteStatusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> =
  {
    draft: "outline",
    issued: "default",
    applied: "secondary",
  }

function formatAmount(cents: number, currency: string): string {
  return `${(cents / 100).toFixed(2)} ${currency}`
}

function formatStatus(status: string): string {
  return status.replace(/_/g, " ")
}

function formatMethod(method: string): string {
  return method.replace(/_/g, " ")
}

function InvoiceDetailPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [editOpen, setEditOpen] = useState(false)
  const [lineItemDialogOpen, setLineItemDialogOpen] = useState(false)
  const [editingLineItem, setEditingLineItem] = useState<LineItem | undefined>()
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [creditNoteDialogOpen, setCreditNoteDialogOpen] = useState(false)
  const [noteContent, setNoteContent] = useState("")

  const { data: invoiceData, isPending } = useQuery(getInvoiceQueryOptions(id))

  const { data: lineItemsData, refetch: refetchLineItems } = useQuery(
    getInvoiceLineItemsQueryOptions(id),
  )

  const { data: paymentsData, refetch: refetchPayments } = useQuery(
    getInvoicePaymentsQueryOptions(id),
  )

  const { data: creditNotesData, refetch: refetchCreditNotes } = useQuery(
    getInvoiceCreditNotesQueryOptions(id),
  )

  const { data: notesData, refetch: refetchNotes } = useQuery(getInvoiceNotesQueryOptions(id))

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/v1/finance/invoices/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["invoices"] })
      void navigate({ to: "/finance" })
    },
  })

  const deleteLineItemMutation = useMutation({
    mutationFn: (lineId: string) => api.delete(`/v1/finance/invoices/${id}/line-items/${lineId}`),
    onSuccess: () => {
      void refetchLineItems()
    },
  })

  const addNoteMutation = useMutation({
    mutationFn: (content: string) => api.post(`/v1/finance/invoices/${id}/notes`, { content }),
    onSuccess: () => {
      setNoteContent("")
      void refetchNotes()
    },
  })

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const invoice = invoiceData?.data
  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <p className="text-muted-foreground">Invoice not found</p>
        <Button variant="outline" onClick={() => void navigate({ to: "/finance" })}>
          Back to Finance
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => void navigate({ to: "/finance" })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{invoice.invoiceNumber}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={statusVariant[invoice.status] ?? "secondary"} className="capitalize">
              {formatStatus(invoice.status)}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (invoice.status !== "draft") {
                alert("Only draft invoices can be deleted")
                return
              }
              if (confirm("Are you sure you want to delete this invoice?")) {
                deleteMutation.mutate()
              }
            }}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Currency:</span>{" "}
              <span>{invoice.currency}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Subtotal:</span>{" "}
              <span className="font-mono">
                {formatAmount(invoice.subtotalCents, invoice.currency)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Tax:</span>{" "}
              <span className="font-mono">{formatAmount(invoice.taxCents, invoice.currency)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Total:</span>{" "}
              <span className="font-mono font-semibold">
                {formatAmount(invoice.totalCents, invoice.currency)}
              </span>
            </div>
            <div className="border-t pt-3 mt-2">
              <span className="text-muted-foreground">Paid:</span>{" "}
              <span className="font-mono">{formatAmount(invoice.paidCents, invoice.currency)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Balance Due:</span>{" "}
              <span className="font-mono font-semibold">
                {formatAmount(invoice.balanceDueCents, invoice.currency)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dates & Links</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Issue Date:</span>{" "}
              <span>{invoice.issueDate}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Due Date:</span>{" "}
              <span>{invoice.dueDate}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Booking:</span>{" "}
              <button
                type="button"
                className="text-primary underline"
                onClick={() =>
                  void navigate({
                    to: "/bookings/$id",
                    params: { id: invoice.bookingId },
                  })
                }
              >
                View Booking
              </button>
            </div>
            {invoice.personId && (
              <div>
                <span className="text-muted-foreground">Person:</span>{" "}
                <span className="font-mono text-xs">{invoice.personId}</span>
              </div>
            )}
            {invoice.organizationId && (
              <div>
                <span className="text-muted-foreground">Organization:</span>{" "}
                <span className="font-mono text-xs">{invoice.organizationId}</span>
              </div>
            )}
            {invoice.notes && (
              <div className="border-t pt-3 mt-2">
                <span className="text-muted-foreground">Notes:</span>
                <p className="mt-1 whitespace-pre-wrap">{invoice.notes}</p>
              </div>
            )}
            <div className="border-t pt-3 mt-2">
              <div>
                <span className="text-muted-foreground">Created:</span>{" "}
                <span>{new Date(invoice.createdAt).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Updated:</span>{" "}
                <span>{new Date(invoice.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Line Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Line Items</CardTitle>
          <Button
            size="sm"
            onClick={() => {
              setEditingLineItem(undefined)
              setLineItemDialogOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Line Item
          </Button>
        </CardHeader>
        <CardContent>
          {(!lineItemsData?.data || lineItemsData.data.length === 0) && (
            <p className="text-sm text-muted-foreground py-4 text-center">No line items yet.</p>
          )}

          {lineItemsData?.data && lineItemsData.data.length > 0 && (
            <div className="rounded border bg-background">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left p-2 font-medium">Description</th>
                    <th className="text-right p-2 font-medium">Qty</th>
                    <th className="text-right p-2 font-medium">Unit Price</th>
                    <th className="text-right p-2 font-medium">Total</th>
                    <th className="text-right p-2 font-medium">Tax Rate</th>
                    <th className="p-2 w-20" />
                  </tr>
                </thead>
                <tbody>
                  {lineItemsData.data.map((li) => (
                    <tr key={li.id} className="border-b last:border-b-0">
                      <td className="p-2">{li.description}</td>
                      <td className="p-2 text-right">{li.quantity}</td>
                      <td className="p-2 text-right font-mono">
                        {(li.unitPriceCents / 100).toFixed(2)}
                      </td>
                      <td className="p-2 text-right font-mono">
                        {(li.totalCents / 100).toFixed(2)}
                      </td>
                      <td className="p-2 text-right">
                        {li.taxRate != null ? `${(li.taxRate / 100).toFixed(2)}%` : "-"}
                      </td>
                      <td className="p-2">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingLineItem(li)
                              setLineItemDialogOpen(true)
                            }}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm("Delete this line item?")) {
                                deleteLineItemMutation.mutate(li.id)
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
        </CardContent>
      </Card>

      {/* Payments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Payments</CardTitle>
          <Button size="sm" onClick={() => setPaymentDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Record Payment
          </Button>
        </CardHeader>
        <CardContent>
          {(!paymentsData?.data || paymentsData.data.length === 0) && (
            <p className="text-sm text-muted-foreground py-4 text-center">No payments yet.</p>
          )}

          {paymentsData?.data && paymentsData.data.length > 0 && (
            <div className="rounded border bg-background">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left p-2 font-medium">Date</th>
                    <th className="text-left p-2 font-medium">Method</th>
                    <th className="text-right p-2 font-medium">Amount</th>
                    <th className="text-left p-2 font-medium">Status</th>
                    <th className="text-left p-2 font-medium">Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentsData.data.map((p) => (
                    <tr key={p.id} className="border-b last:border-b-0">
                      <td className="p-2">{p.paymentDate}</td>
                      <td className="p-2 capitalize">{formatMethod(p.paymentMethod)}</td>
                      <td className="p-2 text-right font-mono">
                        {formatAmount(p.amountCents, p.currency)}
                      </td>
                      <td className="p-2">
                        <Badge
                          variant={paymentStatusVariant[p.status] ?? "secondary"}
                          className="capitalize text-xs"
                        >
                          {p.status}
                        </Badge>
                      </td>
                      <td className="p-2">{p.referenceNumber ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Credit Notes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Credit Notes</CardTitle>
          <Button size="sm" onClick={() => setCreditNoteDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Credit Note
          </Button>
        </CardHeader>
        <CardContent>
          {(!creditNotesData?.data || creditNotesData.data.length === 0) && (
            <p className="text-sm text-muted-foreground py-4 text-center">No credit notes yet.</p>
          )}

          {creditNotesData?.data && creditNotesData.data.length > 0 && (
            <div className="rounded border bg-background">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left p-2 font-medium">CN #</th>
                    <th className="text-right p-2 font-medium">Amount</th>
                    <th className="text-left p-2 font-medium">Reason</th>
                    <th className="text-left p-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {creditNotesData.data.map((cn) => (
                    <tr key={cn.id} className="border-b last:border-b-0">
                      <td className="p-2">{cn.creditNoteNumber}</td>
                      <td className="p-2 text-right font-mono">
                        {formatAmount(cn.amountCents, cn.currency)}
                      </td>
                      <td className="p-2">{cn.reason}</td>
                      <td className="p-2">
                        <Badge
                          variant={creditNoteStatusVariant[cn.status] ?? "secondary"}
                          className="capitalize text-xs"
                        >
                          {cn.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Textarea
              placeholder="Add a note..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              className="min-h-[80px]"
            />
            <Button
              className="self-end"
              disabled={!noteContent.trim() || addNoteMutation.isPending}
              onClick={() => addNoteMutation.mutate(noteContent.trim())}
            >
              {addNoteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
            </Button>
          </div>

          {notesData?.data.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">No notes yet.</p>
          )}

          {notesData?.data.map((note) => (
            <div key={note.id} className="rounded-md border p-3">
              <p className="text-sm whitespace-pre-wrap">{note.content}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {new Date(note.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <InvoiceDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        invoice={invoice}
        onSuccess={() => {
          setEditOpen(false)
          void queryClient.invalidateQueries({ queryKey: ["invoice", id] })
          void queryClient.invalidateQueries({ queryKey: ["invoices"] })
        }}
      />

      <LineItemDialog
        open={lineItemDialogOpen}
        onOpenChange={setLineItemDialogOpen}
        invoiceId={id}
        lineItem={editingLineItem}
        onSuccess={() => {
          setLineItemDialogOpen(false)
          setEditingLineItem(undefined)
          void refetchLineItems()
        }}
      />

      <PaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        invoiceId={id}
        invoiceCurrency={invoice.currency}
        onSuccess={() => {
          setPaymentDialogOpen(false)
          void refetchPayments()
          void queryClient.invalidateQueries({ queryKey: ["invoice", id] })
        }}
      />

      <CreditNoteDialog
        open={creditNoteDialogOpen}
        onOpenChange={setCreditNoteDialogOpen}
        invoiceId={id}
        invoiceCurrency={invoice.currency}
        onSuccess={() => {
          setCreditNoteDialogOpen(false)
          void refetchCreditNotes()
        }}
      />
    </div>
  )
}
