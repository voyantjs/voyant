import { type StayRuleRecord, useStayRuleMutation } from "@voyantjs/hospitality-react"
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
import { zodResolver } from "@/lib/zod-resolver"
import { RatePlanCombobox } from "./rate-plan-combobox"
import { RoomTypeCombobox } from "./room-type-combobox"

const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const
type Weekday = (typeof WEEKDAYS)[number]

const intOrEmpty = z.coerce.number().int().optional().or(z.literal("")).nullable()

const formSchema = z.object({
  ratePlanId: z.string().optional().nullable(),
  roomTypeId: z.string().optional().nullable(),
  validFrom: z.string().optional().nullable(),
  validTo: z.string().optional().nullable(),
  minNights: intOrEmpty,
  maxNights: intOrEmpty,
  minAdvanceDays: intOrEmpty,
  maxAdvanceDays: intOrEmpty,
  releaseDays: intOrEmpty,
  closedToArrival: z.boolean(),
  closedToDeparture: z.boolean(),
  arrivalWeekdays: z.array(z.string()),
  departureWeekdays: z.array(z.string()),
  active: z.boolean(),
  priority: z.coerce.number().int(),
  notes: z.string().optional().nullable(),
})

type FormValues = z.input<typeof formSchema>
type FormOutput = z.output<typeof formSchema>

export type StayRuleData = StayRuleRecord

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  propertyId: string
  rule?: StayRuleData
  onSuccess: () => void
}

export function StayRuleDialog({ open, onOpenChange, propertyId, rule, onSuccess }: Props) {
  const isEditing = !!rule
  const { create, update } = useStayRuleMutation()

  const form = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ratePlanId: "",
      roomTypeId: "",
      validFrom: "",
      validTo: "",
      minNights: "",
      maxNights: "",
      minAdvanceDays: "",
      maxAdvanceDays: "",
      releaseDays: "",
      closedToArrival: false,
      closedToDeparture: false,
      arrivalWeekdays: [],
      departureWeekdays: [],
      active: true,
      priority: 0,
      notes: "",
    },
  })

  useEffect(() => {
    if (open && rule) {
      form.reset({
        ratePlanId: rule.ratePlanId ?? "",
        roomTypeId: rule.roomTypeId ?? "",
        validFrom: rule.validFrom ?? "",
        validTo: rule.validTo ?? "",
        minNights: rule.minNights ?? "",
        maxNights: rule.maxNights ?? "",
        minAdvanceDays: rule.minAdvanceDays ?? "",
        maxAdvanceDays: rule.maxAdvanceDays ?? "",
        releaseDays: rule.releaseDays ?? "",
        closedToArrival: rule.closedToArrival,
        closedToDeparture: rule.closedToDeparture,
        arrivalWeekdays: rule.arrivalWeekdays ?? [],
        departureWeekdays: rule.departureWeekdays ?? [],
        active: rule.active,
        priority: rule.priority,
        notes: rule.notes ?? "",
      })
    } else if (open) {
      form.reset({
        ratePlanId: "",
        roomTypeId: "",
        validFrom: "",
        validTo: "",
        minNights: "",
        maxNights: "",
        minAdvanceDays: "",
        maxAdvanceDays: "",
        releaseDays: "",
        closedToArrival: false,
        closedToDeparture: false,
        arrivalWeekdays: [],
        departureWeekdays: [],
        active: true,
        priority: 0,
        notes: "",
      })
    }
  }, [open, rule, form])

  const toggleWeekday = (
    field: "arrivalWeekdays" | "departureWeekdays",
    day: Weekday,
    checked: boolean,
  ) => {
    const current = form.watch(field) ?? []
    const next = checked ? [...current, day] : current.filter((d) => d !== day)
    form.setValue(field, next)
  }

  const onSubmit = async (values: FormOutput) => {
    const toInt = (v: number | string | null | undefined) => (typeof v === "number" ? v : null)
    const payload = {
      propertyId,
      ratePlanId: values.ratePlanId || null,
      roomTypeId: values.roomTypeId || null,
      validFrom: values.validFrom || null,
      validTo: values.validTo || null,
      minNights: toInt(values.minNights),
      maxNights: toInt(values.maxNights),
      minAdvanceDays: toInt(values.minAdvanceDays),
      maxAdvanceDays: toInt(values.maxAdvanceDays),
      releaseDays: toInt(values.releaseDays),
      closedToArrival: values.closedToArrival,
      closedToDeparture: values.closedToDeparture,
      arrivalWeekdays: values.arrivalWeekdays.length > 0 ? values.arrivalWeekdays : null,
      departureWeekdays: values.departureWeekdays.length > 0 ? values.departureWeekdays : null,
      active: values.active,
      priority: values.priority,
      notes: values.notes || null,
    }
    if (isEditing) {
      await update.mutateAsync({ id: rule.id, input: payload })
    } else {
      await create.mutateAsync(payload)
    }
    onSuccess()
  }

  const arrivalWeekdays = form.watch("arrivalWeekdays") ?? []
  const departureWeekdays = form.watch("departureWeekdays") ?? []
  const isSubmitting = form.formState.isSubmitting || create.isPending || update.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Stay Rule" : "Add Stay Rule"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogBody className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Rate plan (optional)</Label>
                <RatePlanCombobox
                  propertyId={propertyId}
                  value={form.watch("ratePlanId")}
                  onChange={(value) => form.setValue("ratePlanId", value ?? "")}
                  placeholder="All rate plans"
                  disabled={!open}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Room type (optional)</Label>
                <RoomTypeCombobox
                  propertyId={propertyId}
                  value={form.watch("roomTypeId")}
                  onChange={(value) => form.setValue("roomTypeId", value ?? "")}
                  placeholder="All room types"
                  disabled={!open}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Valid from</Label>
                <Input {...form.register("validFrom")} type="date" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Valid to</Label>
                <Input {...form.register("validTo")} type="date" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-2">
                <Label>Min nights</Label>
                <Input {...form.register("minNights")} type="number" min="0" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Max nights</Label>
                <Input {...form.register("maxNights")} type="number" min="0" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Release days</Label>
                <Input {...form.register("releaseDays")} type="number" min="0" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-2">
                <Label>Min advance days</Label>
                <Input {...form.register("minAdvanceDays")} type="number" min="0" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Max advance days</Label>
                <Input {...form.register("maxAdvanceDays")} type="number" min="0" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Priority</Label>
                <Input {...form.register("priority")} type="number" />
              </div>
            </div>

            <div>
              <Label>Arrival weekdays</Label>
              <div className="mt-2 flex flex-wrap gap-3">
                {WEEKDAYS.map((day) => (
                  <label key={day} className="flex items-center gap-1.5 text-sm capitalize">
                    <input
                      type="checkbox"
                      checked={arrivalWeekdays.includes(day)}
                      onChange={(e) => toggleWeekday("arrivalWeekdays", day, e.target.checked)}
                    />
                    {day}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label>Departure weekdays</Label>
              <div className="mt-2 flex flex-wrap gap-3">
                {WEEKDAYS.map((day) => (
                  <label key={day} className="flex items-center gap-1.5 text-sm capitalize">
                    <input
                      type="checkbox"
                      checked={departureWeekdays.includes(day)}
                      onChange={(e) => toggleWeekday("departureWeekdays", day, e.target.checked)}
                    />
                    {day}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.watch("closedToArrival")}
                  onCheckedChange={(v) => form.setValue("closedToArrival", v)}
                />
                <Label>Closed to arrival</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.watch("closedToDeparture")}
                  onCheckedChange={(v) => form.setValue("closedToDeparture", v)}
                />
                <Label>Closed to departure</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.watch("active")}
                  onCheckedChange={(v) => form.setValue("active", v)}
                />
                <Label>Active</Label>
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
              {isEditing ? "Save Changes" : "Add Stay Rule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
