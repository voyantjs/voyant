import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { ArrowLeft, Loader2, Pencil, Trash2 } from "lucide-react"
import { useState } from "react"
import { Badge, Button } from "@/components/ui"
import { api } from "@/lib/api-client"
import { CreditNoteDialog } from "../_components/credit-note-dialog"
import { InvoiceDialog } from "../_components/invoice-dialog"
import { LineItemDialog } from "../_components/line-item-dialog"
import { PaymentDialog } from "../_components/payment-dialog"
import {
  InvoiceCreditNotesCard,
  InvoiceInfoCards,
  InvoiceLineItemsCard,
  InvoiceNotesCard,
  InvoicePaymentsCard,
} from "./$id-sections"
import {
  formatStatus,
  getInvoiceCreditNotesQueryOptions,
  getInvoiceLineItemsQueryOptions,
  getInvoiceNotesQueryOptions,
  getInvoicePaymentsQueryOptions,
  getInvoiceQueryOptions,
  type LineItem,
  statusVariant,
} from "./$id-shared"

export function InvoiceDetailPage({ id }: { id: string }) {
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => void navigate({ to: "/finance" })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{invoice.invoiceNumber}</h1>
          <div className="mt-1 flex items-center gap-2">
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

      <InvoiceInfoCards
        invoice={invoice}
        onOpenBooking={() =>
          void navigate({
            to: "/bookings/$id",
            params: { id: invoice.bookingId },
          })
        }
      />

      <InvoiceLineItemsCard
        lineItems={lineItemsData?.data ?? []}
        onCreate={() => {
          setEditingLineItem(undefined)
          setLineItemDialogOpen(true)
        }}
        onEdit={(lineItem) => {
          setEditingLineItem(lineItem)
          setLineItemDialogOpen(true)
        }}
        onDelete={(lineId) => {
          if (confirm("Delete this line item?")) {
            deleteLineItemMutation.mutate(lineId)
          }
        }}
      />

      <InvoicePaymentsCard
        payments={paymentsData?.data ?? []}
        onCreate={() => setPaymentDialogOpen(true)}
      />

      <InvoiceCreditNotesCard
        creditNotes={creditNotesData?.data ?? []}
        onCreate={() => setCreditNoteDialogOpen(true)}
      />

      <InvoiceNotesCard
        noteContent={noteContent}
        isAdding={addNoteMutation.isPending}
        notes={notesData?.data ?? []}
        onNoteChange={setNoteContent}
        onAddNote={() => addNoteMutation.mutate(noteContent.trim())}
      />

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
