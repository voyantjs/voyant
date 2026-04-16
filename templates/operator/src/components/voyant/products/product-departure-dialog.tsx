import { Loader2 } from "lucide-react"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod/v4"
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Switch,
  Textarea,
} from "@/components/ui"
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { DatePicker } from "@/components/ui/date-picker"
import { api } from "@/lib/api-client"
import { getTimezoneLabel, TIMEZONE_IDS, TIMEZONE_OPTIONS } from "@/lib/timezone-options"
import { zodResolver } from "@/lib/zod-resolver"

const SLOT_STATUSES = [
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
  { value: "sold_out", label: "Sold out" },
  { value: "cancelled", label: "Cancelled" },
] as const

const departureFormSchema = z
  .object({
    startDate: z.string().min(1, "Start date is required"),
    startTime: z.string().min(1, "Start time is required"),
    endDate: z.string().optional().nullable(),
    endTime: z.string().optional().nullable(),
    timezone: z.string().min(1, "Timezone is required"),
    status: z.enum(["open", "closed", "sold_out", "cancelled"]),
    unlimited: z.boolean(),
    initialPax: z.coerce.number().int().min(0).optional().or(z.literal("")).nullable(),
    nights: z.coerce.number().int().min(0).optional().or(z.literal("")).nullable(),
    days: z.coerce.number().int().min(0).optional().or(z.literal("")).nullable(),
    notes: z.string().optional().nullable(),
  })
  .refine(
    (v) => {
      if (!v.endDate || typeof v.endDate !== "string" || v.endDate.length === 0) return true
      return v.endDate >= v.startDate
    },
    { message: "End date must be on or after start date", path: ["endDate"] },
  )
  .refine(
    (v) => {
      const endDate =
        v.endDate && typeof v.endDate === "string" && v.endDate.length > 0 ? v.endDate : v.startDate
      const endTime =
        v.endTime && typeof v.endTime === "string" && v.endTime.length > 0 ? v.endTime : null
      if (!endTime) return true
      if (endDate > v.startDate) return true
      return endTime >= v.startTime
    },
    { message: "End time must be after start time on the same day", path: ["endTime"] },
  )

type DepartureFormValues = z.input<typeof departureFormSchema>
type DepartureFormOutput = z.output<typeof departureFormSchema>

export type DepartureSlot = {
  id: string
  productId: string
  dateLocal: string
  startsAt: string
  endsAt: string | null
  timezone: string
  status: "open" | "closed" | "sold_out" | "cancelled"
  unlimited: boolean
  initialPax: number | null
  remainingPax: number | null
  nights: number | null
  days: number | null
  notes: string | null
}

type DepartureDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId: string
  slot?: DepartureSlot
  onSuccess: () => void
}

function combineLocalToIso(date: string, time: string): string {
  const iso = new Date(`${date}T${time}:00Z`).toISOString()
  return iso
}

function isoToLocalDate(iso: string): string {
  const d = new Date(iso)
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, "0")
  const day = String(d.getUTCDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function isoToLocalTime(iso: string): string {
  const d = new Date(iso)
  const hh = String(d.getUTCHours()).padStart(2, "0")
  const mm = String(d.getUTCMinutes()).padStart(2, "0")
  return `${hh}:${mm}`
}

export function DepartureDialog({
  open,
  onOpenChange,
  productId,
  slot,
  onSuccess,
}: DepartureDialogProps) {
  const isEditing = !!slot

  const defaultTz =
    typeof Intl !== "undefined"
      ? (Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC")
      : "UTC"

  const form = useForm<DepartureFormValues, unknown, DepartureFormOutput>({
    resolver: zodResolver(departureFormSchema),
    defaultValues: {
      startDate: "",
      startTime: "09:00",
      endDate: "",
      endTime: "",
      timezone: defaultTz,
      status: "open",
      unlimited: false,
      initialPax: "",
      nights: "",
      days: "",
      notes: "",
    },
  })

  const unlimited = form.watch("unlimited")
  const startDate = form.watch("startDate")
  const endDate = form.watch("endDate")
  const timezone = form.watch("timezone")

  const nights = (() => {
    if (!startDate || !endDate || typeof endDate !== "string" || endDate.length === 0) return 0
    const start = new Date(`${startDate}T00:00:00Z`).getTime()
    const end = new Date(`${endDate}T00:00:00Z`).getTime()
    const diffDays = Math.round((end - start) / 86_400_000)
    return diffDays > 0 ? diffDays : 0
  })()

  useEffect(() => {
    if (open && slot) {
      form.reset({
        startDate: slot.dateLocal,
        startTime: isoToLocalTime(slot.startsAt),
        endDate: slot.endsAt ? isoToLocalDate(slot.endsAt) : "",
        endTime: slot.endsAt ? isoToLocalTime(slot.endsAt) : "",
        timezone: slot.timezone,
        status: slot.status,
        unlimited: slot.unlimited,
        initialPax: slot.initialPax != null ? slot.initialPax : "",
        nights: slot.nights != null ? slot.nights : "",
        days: slot.days != null ? slot.days : "",
        notes: slot.notes ?? "",
      })
    } else if (open) {
      form.reset({
        startDate: "",
        startTime: "09:00",
        endDate: "",
        endTime: "",
        timezone: defaultTz,
        status: "open",
        unlimited: false,
        initialPax: "",
        notes: "",
      })
    }
  }, [open, slot, form, defaultTz])

  const onSubmit = async (values: DepartureFormOutput) => {
    const startsAt = combineLocalToIso(values.startDate, values.startTime)

    const effectiveEndDate =
      values.endDate && typeof values.endDate === "string" && values.endDate.length > 0
        ? values.endDate
        : values.startDate
    const hasEndTime =
      values.endTime && typeof values.endTime === "string" && values.endTime.length > 0
    const hasExplicitEndDate =
      values.endDate && typeof values.endDate === "string" && values.endDate.length > 0

    const endsAt =
      hasEndTime || hasExplicitEndDate
        ? combineLocalToIso(effectiveEndDate, hasEndTime ? (values.endTime as string) : "18:00")
        : null

    const initialPax =
      !values.unlimited && typeof values.initialPax === "number" ? values.initialPax : null

    const nightsOverride = typeof values.nights === "number" ? values.nights : null
    const daysOverride = typeof values.days === "number" ? values.days : null

    const payload = {
      productId,
      dateLocal: values.startDate,
      startsAt,
      endsAt,
      timezone: values.timezone,
      status: values.status,
      unlimited: values.unlimited,
      initialPax,
      remainingPax: initialPax,
      nights: nightsOverride,
      days: daysOverride,
      notes: values.notes || null,
    }

    if (isEditing) {
      await api.patch(`/v1/availability/slots/${slot.id}`, payload)
    } else {
      await api.post("/v1/availability/slots", payload)
    }
    onSuccess()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" size="lg">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Edit Departure" : "New Departure"}</SheetTitle>
        </SheetHeader>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <SheetBody className="grid gap-6">
            {/* ── Schedule ── */}
            <fieldset className="grid gap-3">
              <legend className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Schedule
              </legend>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>Start date</Label>
                  <DatePicker
                    value={startDate || null}
                    onChange={(v) =>
                      form.setValue("startDate", v ?? "", {
                        shouldValidate: true,
                        shouldDirty: true,
                      })
                    }
                    placeholder="Pick a date"
                  />
                  {form.formState.errors.startDate && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.startDate.message}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Start time</Label>
                  <Input {...form.register("startTime")} type="time" />
                  {form.formState.errors.startTime && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.startTime.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>
                    End date <span className="text-muted-foreground font-normal">(optional)</span>
                  </Label>
                  <DatePicker
                    value={typeof endDate === "string" && endDate.length > 0 ? endDate : null}
                    onChange={(v) =>
                      form.setValue("endDate", v ?? "", {
                        shouldValidate: true,
                        shouldDirty: true,
                      })
                    }
                    placeholder="Pick a date"
                    clearable
                    dateDisabled={
                      startDate ? { before: new Date(`${startDate}T00:00:00`) } : undefined
                    }
                  />
                  {form.formState.errors.endDate && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.endDate.message}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>
                    End time <span className="text-muted-foreground font-normal">(optional)</span>
                  </Label>
                  <Input {...form.register("endTime")} type="time" />
                  {form.formState.errors.endTime && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.endTime.message}
                    </p>
                  )}
                </div>
              </div>
              {nights > 0 && (
                <>
                  <p className="text-xs text-muted-foreground">
                    Multi-day departure: {nights} night{nights === 1 ? "" : "s"} ({nights + 1} days)
                    by calendar. Override if needed.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <Label>Nights (override)</Label>
                      <Input
                        {...form.register("nights")}
                        type="number"
                        min="0"
                        step="1"
                        placeholder={String(nights)}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label>Days (override)</Label>
                      <Input
                        {...form.register("days")}
                        type="number"
                        min="0"
                        step="1"
                        placeholder={String(nights + 1)}
                      />
                    </div>
                  </div>
                </>
              )}
              <div className="flex flex-col gap-1.5">
                <Label>Timezone</Label>
                <Combobox
                  items={TIMEZONE_IDS}
                  value={timezone || null}
                  autoHighlight
                  itemToStringValue={(id) => getTimezoneLabel(id as string)}
                  onValueChange={(next) => {
                    if (typeof next === "string") {
                      form.setValue("timezone", next, {
                        shouldValidate: true,
                        shouldDirty: true,
                      })
                    }
                  }}
                >
                  <ComboboxInput placeholder="Search timezones…" className="w-full" />
                  <ComboboxContent>
                    <ComboboxEmpty>No timezone found.</ComboboxEmpty>
                    <ComboboxList>
                      <ComboboxCollection>
                        {(id) => {
                          const tz = TIMEZONE_OPTIONS.find((t) => t.id === (id as string))
                          return (
                            <ComboboxItem key={id as string} value={id as string}>
                              <span className="font-mono text-xs">{id as string}</span>
                              {tz ? (
                                <span className="ml-2 text-xs text-muted-foreground">
                                  {tz.label}
                                </span>
                              ) : null}
                            </ComboboxItem>
                          )
                        }}
                      </ComboboxCollection>
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
                {form.formState.errors.timezone && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.timezone.message}
                  </p>
                )}
              </div>
            </fieldset>

            {/* ── Availability ── */}
            <fieldset className="grid gap-3">
              <legend className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Availability
              </legend>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>Status</Label>
                  <Select
                    value={form.watch("status")}
                    onValueChange={(v) =>
                      form.setValue("status", v as DepartureFormValues["status"])
                    }
                    items={SLOT_STATUSES}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SLOT_STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Capacity (pax)</Label>
                  <Input
                    {...form.register("initialPax")}
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    disabled={unlimited}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="unlimited"
                  checked={unlimited}
                  onCheckedChange={(c) => form.setValue("unlimited", c)}
                />
                <Label htmlFor="unlimited" className="font-normal cursor-pointer">
                  Unlimited capacity
                </Label>
              </div>
            </fieldset>

            {/* ── Notes ── */}
            <div className="flex flex-col gap-1.5">
              <Label>Notes</Label>
              <Textarea {...form.register("notes")} placeholder="Internal notes..." />
            </div>
          </SheetBody>
          <SheetFooter>
            <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Departure"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
