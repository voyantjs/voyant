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
  Switch,
  Textarea,
} from "@/components/ui"
import { api } from "@/lib/api-client"
import { zodResolver } from "@/lib/zod-resolver"

type ListResponse<T> = { data: T[]; total: number; limit: number; offset: number }
type RoomTypeLite = { id: string; name: string }
type RatePlanLite = { id: string; name: string; code: string }

const intOrEmpty = z.coerce.number().int().optional().or(z.literal("")).nullable()

const formSchema = z.object({
  ratePlanId: z.string().min(1, "Rate plan is required"),
  roomTypeId: z.string().min(1, "Room type is required"),
  date: z.string().min(1, "Date is required"),
  stopSell: z.boolean(),
  closedToArrival: z.boolean(),
  closedToDeparture: z.boolean(),
  minNightsOverride: intOrEmpty,
  maxNightsOverride: intOrEmpty,
  notes: z.string().optional().nullable(),
})

type FormValues = z.input<typeof formSchema>
type FormOutput = z.output<typeof formSchema>

export type RatePlanInventoryOverrideData = {
  id: string
  ratePlanId: string
  roomTypeId: string
  date: string
  stopSell: boolean
  closedToArrival: boolean
  closedToDeparture: boolean
  minNightsOverride: number | null
  maxNightsOverride: number | null
  notes: string | null
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  propertyId: string
  override?: RatePlanInventoryOverrideData
  onSuccess: () => void
}

export function RatePlanInventoryOverrideDialog({
  open,
  onOpenChange,
  propertyId,
  override,
  onSuccess,
}: Props) {
  const isEditing = !!override

  const roomTypesQuery = useQuery({
    queryKey: ["hospitality", "rp-override", "room-types-pick", propertyId],
    queryFn: () =>
      api.get<ListResponse<RoomTypeLite>>(
        `/v1/hospitality/room-types?propertyId=${propertyId}&limit=200`,
      ),
    enabled: open && !!propertyId,
  })
  const ratePlansQuery = useQuery({
    queryKey: ["hospitality", "rp-override", "rate-plans-pick", propertyId],
    queryFn: () =>
      api.get<ListResponse<RatePlanLite>>(
        `/v1/hospitality/rate-plans?propertyId=${propertyId}&limit=200`,
      ),
    enabled: open && !!propertyId,
  })
  const roomTypes = roomTypesQuery.data?.data ?? []
  const ratePlans = ratePlansQuery.data?.data ?? []

  const form = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ratePlanId: "",
      roomTypeId: "",
      date: "",
      stopSell: false,
      closedToArrival: false,
      closedToDeparture: false,
      minNightsOverride: "",
      maxNightsOverride: "",
      notes: "",
    },
  })

  useEffect(() => {
    if (open && override) {
      form.reset({
        ratePlanId: override.ratePlanId,
        roomTypeId: override.roomTypeId,
        date: override.date,
        stopSell: override.stopSell,
        closedToArrival: override.closedToArrival,
        closedToDeparture: override.closedToDeparture,
        minNightsOverride: override.minNightsOverride ?? "",
        maxNightsOverride: override.maxNightsOverride ?? "",
        notes: override.notes ?? "",
      })
    } else if (open) {
      form.reset({
        ratePlanId: "",
        roomTypeId: "",
        date: "",
        stopSell: false,
        closedToArrival: false,
        closedToDeparture: false,
        minNightsOverride: "",
        maxNightsOverride: "",
        notes: "",
      })
    }
  }, [open, override, form])

  const onSubmit = async (values: FormOutput) => {
    const toInt = (v: number | string | null | undefined) => (typeof v === "number" ? v : null)
    const payload = {
      ratePlanId: values.ratePlanId,
      roomTypeId: values.roomTypeId,
      date: values.date,
      stopSell: values.stopSell,
      closedToArrival: values.closedToArrival,
      closedToDeparture: values.closedToDeparture,
      minNightsOverride: toInt(values.minNightsOverride),
      maxNightsOverride: toInt(values.maxNightsOverride),
      notes: values.notes || null,
    }
    if (isEditing) {
      await api.patch(`/v1/hospitality/rate-plan-inventory-overrides/${override.id}`, payload)
    } else {
      await api.post("/v1/hospitality/rate-plan-inventory-overrides", payload)
    }
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Override" : "Add Override"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogBody className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Rate plan</Label>
                <select
                  {...form.register("ratePlanId")}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  disabled={isEditing}
                >
                  <option value="">Select…</option>
                  {ratePlans.map((rp) => (
                    <option key={rp.id} value={rp.id}>
                      {rp.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Room type</Label>
                <select
                  {...form.register("roomTypeId")}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  disabled={isEditing}
                >
                  <option value="">Select…</option>
                  {roomTypes.map((rt) => (
                    <option key={rt.id} value={rt.id}>
                      {rt.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Date</Label>
              <Input {...form.register("date")} type="date" disabled={isEditing} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Min nights override</Label>
                <Input {...form.register("minNightsOverride")} type="number" min="0" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Max nights override</Label>
                <Input {...form.register("maxNightsOverride")} type="number" min="0" />
              </div>
            </div>

            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.watch("stopSell")}
                  onCheckedChange={(v) => form.setValue("stopSell", v)}
                />
                <Label>Stop sell</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.watch("closedToArrival")}
                  onCheckedChange={(v) => form.setValue("closedToArrival", v)}
                />
                <Label>CTA</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.watch("closedToDeparture")}
                  onCheckedChange={(v) => form.setValue("closedToDeparture", v)}
                />
                <Label>CTD</Label>
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
              {isEditing ? "Save Changes" : "Add Override"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
