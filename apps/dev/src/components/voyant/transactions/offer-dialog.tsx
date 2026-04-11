import {
  type CreateOfferInput,
  type UpdateOfferInput,
  useOfferMutation,
} from "@voyantjs/transactions-react"
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
import { zodResolver } from "@/lib/zod-resolver"
import type { OfferData } from "./transactions-shared"

type PersonRef = {
  id: string
  displayName?: string | null
  firstName?: string | null
  lastName?: string | null
  email?: string | null
}
type OrganizationRef = { id: string; name: string; domain?: string | null }
type MarketRef = { id: string; name: string; code?: string | null; defaultCurrency?: string | null }

function personLabel(person: PersonRef): string {
  if (person.displayName) return person.displayName
  const full = [person.firstName, person.lastName].filter(Boolean).join(" ")
  return full || person.email || person.id
}

const OFFER_STATUSES = [
  "draft",
  "published",
  "sent",
  "accepted",
  "expired",
  "withdrawn",
  "converted",
] as const

type OfferStatus = (typeof OFFER_STATUSES)[number]

const moneyEuros = z.coerce.number().min(0)

const formSchema = z.object({
  offerNumber: z.string().min(1, "Offer number is required").max(50),
  title: z.string().min(1, "Title is required").max(255),
  status: z.enum(OFFER_STATUSES),
  currency: z.string().length(3, "Currency must be 3 chars"),
  personId: z.string().optional().nullable(),
  organizationId: z.string().optional().nullable(),
  marketId: z.string().optional().nullable(),
  subtotalEuros: moneyEuros,
  taxEuros: moneyEuros,
  feeEuros: moneyEuros,
  totalEuros: moneyEuros,
  validFrom: z.string().optional().nullable(),
  validUntil: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

type FormValues = z.input<typeof formSchema>
type FormOutput = z.output<typeof formSchema>

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  offer?: OfferData
  onSuccess: () => void
}

export function OfferDialog({ open, onOpenChange, offer, onSuccess }: Props) {
  const isEditing = Boolean(offer)
  const { create, update } = useOfferMutation()

  const form = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      offerNumber: "",
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
      validFrom: "",
      validUntil: "",
      notes: "",
    },
  })

  useEffect(() => {
    if (open && offer) {
      form.reset({
        offerNumber: offer.offerNumber,
        title: offer.title,
        status: offer.status as OfferStatus,
        currency: offer.currency,
        personId: offer.personId ?? "",
        organizationId: offer.organizationId ?? "",
        marketId: offer.marketId ?? "",
        subtotalEuros: offer.subtotalAmountCents / 100,
        taxEuros: offer.taxAmountCents / 100,
        feeEuros: offer.feeAmountCents / 100,
        totalEuros: offer.totalAmountCents / 100,
        validFrom: offer.validFrom ? offer.validFrom.slice(0, 10) : "",
        validUntil: offer.validUntil ? offer.validUntil.slice(0, 10) : "",
        notes: offer.notes ?? "",
      })
      return
    }
    if (open) {
      form.reset({
        offerNumber: "",
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
        validFrom: "",
        validUntil: "",
        notes: "",
      })
    }
  }, [form, offer, open])

  const onSubmit = async (values: FormOutput) => {
    const payload: CreateOfferInput | UpdateOfferInput = {
      offerNumber: values.offerNumber,
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
      validFrom: values.validFrom || null,
      validUntil: values.validUntil || null,
      notes: values.notes || null,
    }

    if (isEditing) {
      await update.mutateAsync({ id: offer!.id, input: payload })
    } else {
      await create.mutateAsync(payload as CreateOfferInput)
    }
    onSuccess()
  }

  const isSubmitting = form.formState.isSubmitting || create.isPending || update.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Offer" : "Add Offer"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogBody className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Offer number</Label>
                <Input {...form.register("offerNumber")} placeholder="OFF-2026-0001" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Title</Label>
                <Input {...form.register("title")} placeholder="Istanbul 5-day tour" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-2">
                <Label>Status</Label>
                <Select
                  value={form.watch("status")}
                  onValueChange={(value) => form.setValue("status", value as OfferStatus)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OFFER_STATUSES.map((status) => (
                      <SelectItem key={status} value={status} className="capitalize">
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Currency</Label>
                <Input {...form.register("currency")} placeholder="EUR" maxLength={3} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Market</Label>
                <EntityCombobox<MarketRef>
                  value={form.watch("marketId") ?? null}
                  onChange={(id) => form.setValue("marketId", id)}
                  endpoint="/v1/markets/markets"
                  detailEndpoint="/v1/markets/markets/:id"
                  queryKey={["markets", "picker"]}
                  getLabel={(market) => market.name}
                  getSecondary={(market) =>
                    [market.code, market.defaultCurrency].filter(Boolean).join(" · ") || undefined
                  }
                  placeholder="Search markets..."
                  emptyText="No markets found."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Person</Label>
                <EntityCombobox<PersonRef>
                  value={form.watch("personId") ?? null}
                  onChange={(id) => form.setValue("personId", id)}
                  endpoint="/v1/crm/people"
                  detailEndpoint="/v1/crm/people/:id"
                  queryKey={["crm", "people", "picker"]}
                  getLabel={personLabel}
                  getSecondary={(person) => person.email ?? undefined}
                  placeholder="Search people..."
                  emptyText="No people found."
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Organization</Label>
                <EntityCombobox<OrganizationRef>
                  value={form.watch("organizationId") ?? null}
                  onChange={(id) => form.setValue("organizationId", id)}
                  endpoint="/v1/crm/organizations"
                  detailEndpoint="/v1/crm/organizations/:id"
                  queryKey={["crm", "organizations", "picker"]}
                  getLabel={(organization) => organization.name}
                  getSecondary={(organization) => organization.domain ?? undefined}
                  placeholder="Search organizations..."
                  emptyText="No organizations found."
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Subtotal</Label>
                <Input {...form.register("subtotalEuros")} type="number" min="0" step="0.01" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Tax</Label>
                <Input {...form.register("taxEuros")} type="number" min="0" step="0.01" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Fee</Label>
                <Input {...form.register("feeEuros")} type="number" min="0" step="0.01" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Total</Label>
                <Input {...form.register("totalEuros")} type="number" min="0" step="0.01" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Valid from</Label>
                <Input {...form.register("validFrom")} type="date" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Valid until</Label>
                <Input {...form.register("validUntil")} type="date" />
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Add Offer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
