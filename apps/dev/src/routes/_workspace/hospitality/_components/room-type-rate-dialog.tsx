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

type ListResponse<T> = { data: T[]; total: number; limit: number; offset: number }
type NamedEntity = { id: string; name: string; code?: string }
type RatePlanEntity = NamedEntity & { priceCatalogId: string | null }

const formSchema = z.object({
  ratePlanId: z.string().min(1, "Rate plan is required"),
  roomTypeId: z.string().min(1, "Room type is required"),
  priceScheduleId: z.string().optional().nullable(),
  currencyCode: z.string().length(3, "Currency must be 3 chars"),
  baseAmountCents: z.coerce.number().nullable().optional(),
  extraAdultAmountCents: z.coerce.number().nullable().optional(),
  extraChildAmountCents: z.coerce.number().nullable().optional(),
  extraInfantAmountCents: z.coerce.number().nullable().optional(),
  active: z.boolean(),
  notes: z.string().optional().nullable(),
})

type FormValues = z.input<typeof formSchema>
type FormOutput = z.output<typeof formSchema>

export type RoomTypeRateData = {
  id: string
  ratePlanId: string
  roomTypeId: string
  priceScheduleId: string | null
  currencyCode: string
  baseAmountCents: number | null
  extraAdultAmountCents: number | null
  extraChildAmountCents: number | null
  extraInfantAmountCents: number | null
  active: boolean
  notes: string | null
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  propertyId: string
  roomTypeRate?: RoomTypeRateData
  onSuccess: () => void
}

function majorToCents(value: number | null | undefined): number | null {
  if (value == null || Number.isNaN(value)) return null
  return Math.round(value * 100)
}

export function RoomTypeRateDialog({
  open,
  onOpenChange,
  propertyId,
  roomTypeRate,
  onSuccess,
}: Props) {
  const isEditing = !!roomTypeRate

  const { data: ratePlansData } = useQuery({
    queryKey: ["hospitality", "rate-plans", propertyId],
    queryFn: () =>
      api.get<ListResponse<RatePlanEntity>>(
        `/v1/hospitality/rate-plans?propertyId=${propertyId}&limit=200`,
      ),
    enabled: open && !!propertyId,
  })

  const { data: roomTypesData } = useQuery({
    queryKey: ["hospitality", "room-types", propertyId],
    queryFn: () =>
      api.get<ListResponse<NamedEntity>>(
        `/v1/hospitality/room-types?propertyId=${propertyId}&limit=200`,
      ),
    enabled: open && !!propertyId,
  })

  const ratePlans = ratePlansData?.data ?? []
  const roomTypes = roomTypesData?.data ?? []

  const form = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ratePlanId: "",
      roomTypeId: "",
      priceScheduleId: "",
      currencyCode: "EUR",
      baseAmountCents: null,
      extraAdultAmountCents: null,
      extraChildAmountCents: null,
      extraInfantAmountCents: null,
      active: true,
      notes: "",
    },
  })

  const watchedRatePlanId = form.watch("ratePlanId")
  const selectedRatePlan = ratePlans.find((rp) => rp.id === watchedRatePlanId)

  const { data: schedulesData } = useQuery({
    queryKey: ["pricing", "price-schedules", selectedRatePlan?.priceCatalogId],
    queryFn: () =>
      api.get<ListResponse<NamedEntity>>(
        `/v1/pricing/price-schedules?priceCatalogId=${selectedRatePlan?.priceCatalogId}&limit=200`,
      ),
    enabled: open && !!selectedRatePlan?.priceCatalogId,
  })

  const priceSchedules = schedulesData?.data ?? []

  useEffect(() => {
    if (open && roomTypeRate) {
      form.reset({
        ratePlanId: roomTypeRate.ratePlanId,
        roomTypeId: roomTypeRate.roomTypeId,
        priceScheduleId: roomTypeRate.priceScheduleId ?? "",
        currencyCode: roomTypeRate.currencyCode,
        baseAmountCents: roomTypeRate.baseAmountCents != null ? roomTypeRate.baseAmountCents / 100 : null,
        extraAdultAmountCents: roomTypeRate.extraAdultAmountCents != null ? roomTypeRate.extraAdultAmountCents / 100 : null,
        extraChildAmountCents: roomTypeRate.extraChildAmountCents != null ? roomTypeRate.extraChildAmountCents / 100 : null,
        extraInfantAmountCents: roomTypeRate.extraInfantAmountCents != null ? roomTypeRate.extraInfantAmountCents / 100 : null,
        active: roomTypeRate.active,
        notes: roomTypeRate.notes ?? "",
      })
    } else if (open) {
      form.reset({
        ratePlanId: "",
        roomTypeId: "",
        priceScheduleId: "",
        currencyCode: "EUR",
        baseAmountCents: null,
        extraAdultAmountCents: null,
        extraChildAmountCents: null,
        extraInfantAmountCents: null,
        active: true,
        notes: "",
      })
    }
  }, [open, roomTypeRate, form])

  const onSubmit = async (values: FormOutput) => {
    const payload = {
      ratePlanId: values.ratePlanId,
      roomTypeId: values.roomTypeId,
      priceScheduleId: values.priceScheduleId || null,
      currencyCode: values.currencyCode.toUpperCase(),
      baseAmountCents: majorToCents(values.baseAmountCents),
      extraAdultAmountCents: majorToCents(values.extraAdultAmountCents),
      extraChildAmountCents: majorToCents(values.extraChildAmountCents),
      extraInfantAmountCents: majorToCents(values.extraInfantAmountCents),
      active: values.active,
      notes: values.notes || null,
    }
    if (isEditing) {
      await api.patch(`/v1/hospitality/room-type-rates/${roomTypeRate.id}`, payload)
    } else {
      await api.post("/v1/hospitality/room-type-rates", payload)
    }
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Room Type Rate" : "Add Room Type Rate"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogBody className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Rate Plan</Label>
                <Select
                  key={`rp-${ratePlans.length}`}
                  value={form.watch("ratePlanId")}
                  onValueChange={(v) => form.setValue("ratePlanId", v ?? "")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select rate plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {ratePlans.map((rp) => (
                      <SelectItem key={rp.id} value={rp.id}>
                        {rp.name} ({rp.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.ratePlanId && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.ratePlanId.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label>Room Type</Label>
                <Select
                  key={`rt-${roomTypes.length}`}
                  value={form.watch("roomTypeId")}
                  onValueChange={(v) => form.setValue("roomTypeId", v ?? "")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select room type" />
                  </SelectTrigger>
                  <SelectContent>
                    {roomTypes.map((rt) => (
                      <SelectItem key={rt.id} value={rt.id}>
                        {rt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.roomTypeId && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.roomTypeId.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Season (Price Schedule)</Label>
                <Select
                  key={`ps-${priceSchedules.length}`}
                  value={form.watch("priceScheduleId") ?? ""}
                  onValueChange={(v) =>
                    form.setValue("priceScheduleId", v === "__none__" ? "" : v)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Base / Default" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Base / Default</SelectItem>
                    {priceSchedules.map((ps) => (
                      <SelectItem key={ps.id} value={ps.id}>
                        {ps.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Currency</Label>
                <Input {...form.register("currencyCode")} placeholder="EUR" maxLength={3} />
                {form.formState.errors.currencyCode && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.currencyCode.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Base rate per night</Label>
              <p className="text-xs text-muted-foreground">
                Covers up to the room type's standard occupancy
              </p>
              <Input
                {...form.register("baseAmountCents", { valueAsNumber: true })}
                type="number"
                step="0.01"
                placeholder="0.00"
              />
            </div>

            <p className="text-xs font-medium text-muted-foreground">Supplements per extra guest</p>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Extra Adult</Label>
                <Input
                  {...form.register("extraAdultAmountCents", { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Extra Child</Label>
                <Input
                  {...form.register("extraChildAmountCents", { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Extra Infant</Label>
                <Input
                  {...form.register("extraInfantAmountCents", { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Notes</Label>
              <Textarea {...form.register("notes")} />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={form.watch("active")}
                onCheckedChange={(v) => form.setValue("active", v)}
              />
              <Label>Active</Label>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Add Rate"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
