import { useQuery } from "@tanstack/react-query"
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
  Switch,
  Textarea,
} from "@/components/ui"
import { api } from "@/lib/api-client"
import { zodResolver } from "@/lib/zod-resolver"

const CHARGE_FREQUENCIES = ["per_night", "per_stay", "per_person"] as const
const GUARANTEE_MODES = ["none", "credit_card", "deposit", "full_prepayment", "other"] as const

type ChargeFrequency = (typeof CHARGE_FREQUENCIES)[number]
type GuaranteeMode = (typeof GUARANTEE_MODES)[number]

const formSchema = z.object({
  code: z.string().min(1, "Code is required").max(50),
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().optional().nullable(),
  mealPlanId: z.string().optional().nullable(),
  priceCatalogId: z.string().optional().nullable(),
  cancellationPolicyId: z.string().optional().nullable(),
  currencyCode: z.string().length(3, "Currency must be 3 chars"),
  chargeFrequency: z.enum(CHARGE_FREQUENCIES),
  guaranteeMode: z.enum(GUARANTEE_MODES),
  commissionable: z.boolean(),
  refundable: z.boolean(),
  active: z.boolean(),
  sortOrder: z.coerce.number().int(),
})

type FormValues = z.input<typeof formSchema>
type FormOutput = z.output<typeof formSchema>

export type RatePlanData = {
  id: string
  propertyId: string
  code: string
  name: string
  description: string | null
  mealPlanId: string | null
  priceCatalogId: string | null
  cancellationPolicyId: string | null
  currencyCode: string
  chargeFrequency: ChargeFrequency
  guaranteeMode: GuaranteeMode
  commissionable: boolean
  refundable: boolean
  active: boolean
  sortOrder: number
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  propertyId: string
  ratePlan?: RatePlanData
  onSuccess: () => void
}

type ListResponse<T> = { data: T[]; total: number; limit: number; offset: number }
type NamedEntity = { id: string; name: string; code?: string }

export function RatePlanDialog({ open, onOpenChange, propertyId, ratePlan, onSuccess }: Props) {
  const isEditing = !!ratePlan

  const { data: catalogsData } = useQuery({
    queryKey: ["pricing", "price-catalogs"],
    queryFn: () => api.get<ListResponse<NamedEntity>>("/v1/pricing/price-catalogs?limit=200"),
    enabled: open,
  })
  const { data: cancelData } = useQuery({
    queryKey: ["pricing", "cancellation-policies"],
    queryFn: () =>
      api.get<ListResponse<NamedEntity>>("/v1/pricing/cancellation-policies?limit=200"),
    enabled: open,
  })
  const { data: mealData } = useQuery({
    queryKey: ["hospitality", "meal-plans", propertyId],
    queryFn: () =>
      api.get<ListResponse<NamedEntity>>(
        `/v1/hospitality/meal-plans?propertyId=${propertyId}&limit=200`,
      ),
    enabled: open && !!propertyId,
  })

  const catalogs = catalogsData?.data ?? []
  const cancellationPolicies = cancelData?.data ?? []
  const mealPlans = mealData?.data ?? []

  const form = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
      mealPlanId: "",
      priceCatalogId: "",
      cancellationPolicyId: "",
      currencyCode: "EUR",
      chargeFrequency: "per_night",
      guaranteeMode: "none",
      commissionable: true,
      refundable: true,
      active: true,
      sortOrder: 0,
    },
  })

  useEffect(() => {
    if (open && ratePlan) {
      form.reset({
        code: ratePlan.code,
        name: ratePlan.name,
        description: ratePlan.description ?? "",
        mealPlanId: ratePlan.mealPlanId ?? "",
        priceCatalogId: ratePlan.priceCatalogId ?? "",
        cancellationPolicyId: ratePlan.cancellationPolicyId ?? "",
        currencyCode: ratePlan.currencyCode,
        chargeFrequency: ratePlan.chargeFrequency,
        guaranteeMode: ratePlan.guaranteeMode,
        commissionable: ratePlan.commissionable,
        refundable: ratePlan.refundable,
        active: ratePlan.active,
        sortOrder: ratePlan.sortOrder,
      })
    } else if (open) {
      form.reset({
        code: "",
        name: "",
        description: "",
        mealPlanId: "",
        priceCatalogId: "",
        cancellationPolicyId: "",
        currencyCode: "EUR",
        chargeFrequency: "per_night",
        guaranteeMode: "none",
        commissionable: true,
        refundable: true,
        active: true,
        sortOrder: 0,
      })
    }
  }, [open, ratePlan, form])

  const onSubmit = async (values: FormOutput) => {
    const payload = {
      propertyId,
      code: values.code,
      name: values.name,
      description: values.description || null,
      mealPlanId: values.mealPlanId || null,
      priceCatalogId: values.priceCatalogId || null,
      cancellationPolicyId: values.cancellationPolicyId || null,
      currencyCode: values.currencyCode.toUpperCase(),
      chargeFrequency: values.chargeFrequency,
      guaranteeMode: values.guaranteeMode,
      commissionable: values.commissionable,
      refundable: values.refundable,
      active: values.active,
      sortOrder: values.sortOrder,
    }
    if (isEditing) {
      await api.patch(`/v1/hospitality/rate-plans/${ratePlan.id}`, payload)
    } else {
      await api.post("/v1/hospitality/rate-plans", payload)
    }
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Rate Plan" : "Add Rate Plan"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogBody className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Code</Label>
                <Input {...form.register("code")} placeholder="FLEX" />
                {form.formState.errors.code && (
                  <p className="text-xs text-destructive">{form.formState.errors.code.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label>Name</Label>
                <Input {...form.register("name")} placeholder="Flexible Rate" />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Description</Label>
              <Textarea {...form.register("description")} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Currency</Label>
                <Input {...form.register("currencyCode")} placeholder="EUR" maxLength={3} />
                {form.formState.errors.currencyCode && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.currencyCode.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label>Charge frequency</Label>
                <Select
                  value={form.watch("chargeFrequency")}
                  onValueChange={(v) => form.setValue("chargeFrequency", v as ChargeFrequency)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHARGE_FREQUENCIES.map((f) => (
                      <SelectItem key={f} value={f} className="capitalize">
                        {f.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Guarantee</Label>
                <Select
                  value={form.watch("guaranteeMode")}
                  onValueChange={(v) => form.setValue("guaranteeMode", v as GuaranteeMode)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GUARANTEE_MODES.map((g) => (
                      <SelectItem key={g} value={g} className="capitalize">
                        {g.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Meal plan</Label>
                <Select
                  value={form.watch("mealPlanId") ?? ""}
                  onValueChange={(v) => form.setValue("mealPlanId", v === "__none__" ? "" : v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {mealPlans.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Price catalog</Label>
                <Select
                  value={form.watch("priceCatalogId") ?? ""}
                  onValueChange={(v) => form.setValue("priceCatalogId", v === "__none__" ? "" : v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {catalogs.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Cancellation policy</Label>
                <Select
                  value={form.watch("cancellationPolicyId") ?? ""}
                  onValueChange={(v) =>
                    form.setValue("cancellationPolicyId", v === "__none__" ? "" : v)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {cancellationPolicies.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Sort order</Label>
                <Input {...form.register("sortOrder")} type="number" />
              </div>
            </div>

            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.watch("refundable")}
                  onCheckedChange={(v) => form.setValue("refundable", v)}
                />
                <Label>Refundable</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.watch("commissionable")}
                  onCheckedChange={(v) => form.setValue("commissionable", v)}
                />
                <Label>Commissionable</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.watch("active")}
                  onCheckedChange={(v) => form.setValue("active", v)}
                />
                <Label>Active</Label>
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Add Rate Plan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
