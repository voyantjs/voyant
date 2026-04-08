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
import { EntityCombobox } from "@/components/ui/entity-combobox"
import { api } from "@/lib/api-client"
import { zodResolver } from "@/lib/zod-resolver"

type PersonRef = {
  id: string
  displayName?: string | null
  firstName?: string | null
  lastName?: string | null
  email?: string | null
}
type OrganizationRef = { id: string; name: string; domain?: string | null }
type MarketRef = { id: string; name: string; code?: string | null; defaultCurrency?: string | null }
type OfferRef = { id: string; offerNumber: string; title: string; status?: string | null }

function personLabel(p: PersonRef): string {
  if (p.displayName) return p.displayName
  const full = [p.firstName, p.lastName].filter(Boolean).join(" ")
  return full || p.email || p.id
}

const ORDER_STATUSES = [
  "draft",
  "pending",
  "confirmed",
  "fulfilled",
  "cancelled",
  "expired",
] as const

type OrderStatus = (typeof ORDER_STATUSES)[number]

const moneyEuros = z.coerce.number().min(0)

const formSchema = z.object({
  orderNumber: z.string().min(1, "Order number is required").max(50),
  offerId: z.string().optional().nullable(),
  title: z.string().min(1, "Title is required").max(255),
  status: z.enum(ORDER_STATUSES),
  currency: z.string().length(3, "Currency must be 3 chars"),
  personId: z.string().optional().nullable(),
  organizationId: z.string().optional().nullable(),
  marketId: z.string().optional().nullable(),
  subtotalEuros: moneyEuros,
  taxEuros: moneyEuros,
  feeEuros: moneyEuros,
  totalEuros: moneyEuros,
  orderedAt: z.string().optional().nullable(),
  confirmedAt: z.string().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

type FormValues = z.input<typeof formSchema>
type FormOutput = z.output<typeof formSchema>

export type OrderData = {
  id: string
  orderNumber: string
  offerId: string | null
  title: string
  status: OrderStatus
  currency: string
  personId: string | null
  organizationId: string | null
  marketId: string | null
  subtotalAmountCents: number
  taxAmountCents: number
  feeAmountCents: number
  totalAmountCents: number
  orderedAt: string | null
  confirmedAt: string | null
  expiresAt: string | null
  notes: string | null
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  order?: OrderData
  onSuccess: () => void
}

export function OrderDialog({ open, onOpenChange, order, onSuccess }: Props) {
  const isEditing = !!order

  const form = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      orderNumber: "",
      offerId: "",
      title: "",
      status: "draft",
      currency: "EUR",
      personId: "",
      organizationId: "",
      marketId: "",
      subtotalEuros: 0,
      taxEuros: 0,
      feeEuros: 0,
      totalEuros: 0,
      orderedAt: "",
      confirmedAt: "",
      expiresAt: "",
      notes: "",
    },
  })

  useEffect(() => {
    if (open && order) {
      form.reset({
        orderNumber: order.orderNumber,
        offerId: order.offerId ?? "",
        title: order.title,
        status: order.status,
        currency: order.currency,
        personId: order.personId ?? "",
        organizationId: order.organizationId ?? "",
        marketId: order.marketId ?? "",
        subtotalEuros: order.subtotalAmountCents / 100,
        taxEuros: order.taxAmountCents / 100,
        feeEuros: order.feeAmountCents / 100,
        totalEuros: order.totalAmountCents / 100,
        orderedAt: order.orderedAt ? order.orderedAt.slice(0, 10) : "",
        confirmedAt: order.confirmedAt ? order.confirmedAt.slice(0, 10) : "",
        expiresAt: order.expiresAt ? order.expiresAt.slice(0, 10) : "",
        notes: order.notes ?? "",
      })
    } else if (open) {
      form.reset({
        orderNumber: "",
        offerId: "",
        title: "",
        status: "draft",
        currency: "EUR",
        personId: "",
        organizationId: "",
        marketId: "",
        subtotalEuros: 0,
        taxEuros: 0,
        feeEuros: 0,
        totalEuros: 0,
        orderedAt: "",
        confirmedAt: "",
        expiresAt: "",
        notes: "",
      })
    }
  }, [open, order, form])

  const onSubmit = async (values: FormOutput) => {
    const payload = {
      orderNumber: values.orderNumber,
      offerId: values.offerId || null,
      title: values.title,
      status: values.status,
      currency: values.currency.toUpperCase(),
      personId: values.personId || null,
      organizationId: values.organizationId || null,
      marketId: values.marketId || null,
      subtotalAmountCents: Math.round(values.subtotalEuros * 100),
      taxAmountCents: Math.round(values.taxEuros * 100),
      feeAmountCents: Math.round(values.feeEuros * 100),
      totalAmountCents: Math.round(values.totalEuros * 100),
      orderedAt: values.orderedAt || null,
      confirmedAt: values.confirmedAt || null,
      expiresAt: values.expiresAt || null,
      notes: values.notes || null,
    }
    if (isEditing) {
      await api.patch(`/v1/transactions/orders/${order.id}`, payload)
    } else {
      await api.post("/v1/transactions/orders", payload)
    }
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Order" : "Add Order"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogBody className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Order number</Label>
                <Input {...form.register("orderNumber")} placeholder="ORD-2026-0001" />
                {form.formState.errors.orderNumber && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.orderNumber.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label>Title</Label>
                <Input {...form.register("title")} placeholder="Istanbul 5-day tour" />
                {form.formState.errors.title && (
                  <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-2">
                <Label>Status</Label>
                <Select
                  value={form.watch("status")}
                  onValueChange={(v) => form.setValue("status", v as OrderStatus)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Currency</Label>
                <Input {...form.register("currency")} placeholder="EUR" maxLength={3} />
                {form.formState.errors.currency && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.currency.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label>Market (optional)</Label>
                <EntityCombobox<MarketRef>
                  value={form.watch("marketId") ?? null}
                  onChange={(id) => form.setValue("marketId", id)}
                  endpoint="/v1/markets/markets?limit=200"
                  queryKey={["markets", "picker"]}
                  getLabel={(m) => m.name}
                  getSecondary={(m) =>
                    [m.code, m.defaultCurrency].filter(Boolean).join(" · ") || undefined
                  }
                  placeholder="Search markets…"
                  emptyText="No markets found."
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Source offer (optional)</Label>
              <EntityCombobox<OfferRef>
                value={form.watch("offerId") ?? null}
                onChange={(id) => form.setValue("offerId", id)}
                endpoint="/v1/transactions/offers?limit=200"
                queryKey={["transactions", "offers", "picker"]}
                getLabel={(o) => `${o.offerNumber} — ${o.title}`}
                getSecondary={(o) => o.status ?? undefined}
                placeholder="Search offers…"
                emptyText="No offers found."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Person (optional)</Label>
                <EntityCombobox<PersonRef>
                  value={form.watch("personId") ?? null}
                  onChange={(id) => form.setValue("personId", id)}
                  endpoint="/v1/crm/people?limit=200"
                  queryKey={["crm", "people", "picker"]}
                  getLabel={personLabel}
                  getSecondary={(p) => p.email ?? undefined}
                  placeholder="Search people…"
                  emptyText="No people found."
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Organization (optional)</Label>
                <EntityCombobox<OrganizationRef>
                  value={form.watch("organizationId") ?? null}
                  onChange={(id) => form.setValue("organizationId", id)}
                  endpoint="/v1/crm/organizations?limit=200"
                  queryKey={["crm", "organizations", "picker"]}
                  getLabel={(o) => o.name}
                  getSecondary={(o) => o.domain ?? undefined}
                  placeholder="Search organizations…"
                  emptyText="No organizations found."
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div className="flex flex-col gap-2">
                <Label>Subtotal (€)</Label>
                <Input {...form.register("subtotalEuros")} type="number" min="0" step="0.01" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Tax (€)</Label>
                <Input {...form.register("taxEuros")} type="number" min="0" step="0.01" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Fees (€)</Label>
                <Input {...form.register("feeEuros")} type="number" min="0" step="0.01" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Total (€)</Label>
                <Input {...form.register("totalEuros")} type="number" min="0" step="0.01" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-2">
                <Label>Ordered at</Label>
                <Input {...form.register("orderedAt")} type="date" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Confirmed at</Label>
                <Input {...form.register("confirmedAt")} type="date" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Expires at</Label>
                <Input {...form.register("expiresAt")} type="date" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Notes</Label>
              <Textarea {...form.register("notes")} />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Add Order"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
