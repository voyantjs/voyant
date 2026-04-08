import { Loader2 } from "lucide-react"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod/v4"
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@/components/ui"
import { DatePicker } from "@/components/ui/date-picker"
import { api } from "@/lib/api-client"
import { zodResolver } from "@/lib/zod-resolver"

const invoiceFormSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  bookingId: z.string().min(1, "Booking ID is required"),
  personId: z.string().optional().nullable(),
  organizationId: z.string().optional().nullable(),
  status: z.enum(["draft", "sent", "partially_paid", "paid", "overdue", "void"]),
  currency: z.string().min(3).max(3, "Use 3-letter ISO code"),
  subtotalCents: z.coerce.number().int().min(0).default(0),
  taxCents: z.coerce.number().int().min(0).default(0),
  totalCents: z.coerce.number().int().min(0).default(0),
  issueDate: z.string().min(1, "Issue date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  notes: z.string().optional().nullable(),
})

type InvoiceFormValues = z.input<typeof invoiceFormSchema>
type InvoiceFormOutput = z.output<typeof invoiceFormSchema>

type InvoiceData = {
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
  issueDate: string
  dueDate: string
  notes: string | null
}

type InvoiceDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoice?: InvoiceData
  onSuccess: () => void
}

const INVOICE_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "partially_paid", label: "Partially Paid" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
  { value: "void", label: "Void" },
] as const

function generateInvoiceNumber(): string {
  const now = new Date()
  const y = now.getFullYear()
  const seq = String(Math.floor(Math.random() * 9000) + 1000)
  return `INV-${y}-${seq}`
}

export function InvoiceDialog({ open, onOpenChange, invoice, onSuccess }: InvoiceDialogProps) {
  const isEditing = !!invoice

  const form = useForm<InvoiceFormValues, unknown, InvoiceFormOutput>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      invoiceNumber: "",
      bookingId: "",
      personId: "",
      organizationId: "",
      status: "draft",
      currency: "EUR",
      subtotalCents: 0,
      taxCents: 0,
      totalCents: 0,
      issueDate: "",
      dueDate: "",
      notes: "",
    },
  })

  useEffect(() => {
    if (open && invoice) {
      form.reset({
        invoiceNumber: invoice.invoiceNumber,
        bookingId: invoice.bookingId,
        personId: invoice.personId ?? "",
        organizationId: invoice.organizationId ?? "",
        status: invoice.status,
        currency: invoice.currency,
        subtotalCents: invoice.subtotalCents,
        taxCents: invoice.taxCents,
        totalCents: invoice.totalCents,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        notes: invoice.notes ?? "",
      })
    } else if (open) {
      const today = new Date().toISOString().split("T")[0]!
      form.reset({
        invoiceNumber: generateInvoiceNumber(),
        bookingId: "",
        personId: "",
        organizationId: "",
        status: "draft",
        currency: "EUR",
        subtotalCents: 0,
        taxCents: 0,
        totalCents: 0,
        issueDate: today,
        dueDate: "",
        notes: "",
      })
    }
  }, [open, invoice, form])

  const onSubmit = async (values: InvoiceFormOutput) => {
    const payload = {
      invoiceNumber: values.invoiceNumber,
      bookingId: values.bookingId,
      personId: values.personId || null,
      organizationId: values.organizationId || null,
      status: values.status,
      currency: values.currency,
      subtotalCents: values.subtotalCents,
      taxCents: values.taxCents,
      totalCents: values.totalCents,
      paidCents: 0,
      balanceDueCents: values.totalCents,
      issueDate: values.issueDate,
      dueDate: values.dueDate,
      notes: values.notes || null,
    }

    if (isEditing) {
      await api.patch(`/v1/finance/invoices/${invoice.id}`, payload)
    } else {
      await api.post("/v1/finance/invoices", payload)
    }
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Invoice" : "New Invoice"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-hidden">
          <DialogBody className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Invoice Number</Label>
                <Input {...form.register("invoiceNumber")} placeholder="INV-2025-1234" />
                {form.formState.errors.invoiceNumber && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.invoiceNumber.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label>Status</Label>
                <Select
                  value={form.watch("status")}
                  onValueChange={(v) => form.setValue("status", v as InvoiceFormValues["status"])}
                  items={INVOICE_STATUSES}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INVOICE_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Booking ID</Label>
                <Input {...form.register("bookingId")} placeholder="book_..." />
                {form.formState.errors.bookingId && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.bookingId.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label>Currency</Label>
                <Input
                  {...form.register("currency")}
                  placeholder="EUR"
                  maxLength={3}
                  className="uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Subtotal (cents)</Label>
                <Input {...form.register("subtotalCents")} type="number" min="0" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Tax (cents)</Label>
                <Input {...form.register("taxCents")} type="number" min="0" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Total (cents)</Label>
                <Input {...form.register("totalCents")} type="number" min="0" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Issue Date</Label>
                <DatePicker
                  value={form.watch("issueDate") || null}
                  onChange={(nextValue) =>
                    form.setValue("issueDate", nextValue ?? "", {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  placeholder="Pick issue date"
                  className="w-full"
                />
                {form.formState.errors.issueDate && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.issueDate.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label>Due Date</Label>
                <DatePicker
                  value={form.watch("dueDate") || null}
                  onChange={(nextValue) =>
                    form.setValue("dueDate", nextValue ?? "", {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  placeholder="Pick due date"
                  className="w-full"
                />
                {form.formState.errors.dueDate && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.dueDate.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Notes</Label>
              <Textarea {...form.register("notes")} placeholder="Invoice notes..." />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" size="sm" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Invoice"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
