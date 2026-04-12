"use client"

import {
  type AvailabilitySlotRecord,
  useAvailabilitySlotMutation,
} from "@voyantjs/availability-react"
import { Loader2 } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

import {
  combineLocalToIso,
  computeNights,
  getDefaultTimezone,
  getTimezoneOptions,
  isoToLocalDate,
  isoToLocalTime,
  SLOT_STATUSES,
  toNullableNumber,
} from "./product-availability-shared"

type Mode = { kind: "create"; productId: string } | { kind: "edit"; slot: AvailabilitySlotRecord }

export interface ProductDepartureFormProps {
  mode: Mode
  onSuccess?: (slot: AvailabilitySlotRecord) => void
  onCancel?: () => void
}

interface FormState {
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  timezone: string
  status: AvailabilitySlotRecord["status"]
  unlimited: boolean
  initialPax: string
  nights: string
  days: string
  notes: string
}

function initialState(mode: Mode): FormState {
  if (mode.kind === "edit") {
    return {
      startDate: mode.slot.dateLocal,
      startTime: isoToLocalTime(mode.slot.startsAt),
      endDate: mode.slot.endsAt ? isoToLocalDate(mode.slot.endsAt) : "",
      endTime: mode.slot.endsAt ? isoToLocalTime(mode.slot.endsAt) : "",
      timezone: mode.slot.timezone,
      status: mode.slot.status,
      unlimited: mode.slot.unlimited,
      initialPax: mode.slot.initialPax == null ? "" : String(mode.slot.initialPax),
      nights: mode.slot.nights == null ? "" : String(mode.slot.nights),
      days: mode.slot.days == null ? "" : String(mode.slot.days),
      notes: mode.slot.notes ?? "",
    }
  }

  return {
    startDate: "",
    startTime: "09:00",
    endDate: "",
    endTime: "",
    timezone: getDefaultTimezone(),
    status: "open",
    unlimited: false,
    initialPax: "",
    nights: "",
    days: "",
    notes: "",
  }
}

export function ProductDepartureForm({ mode, onSuccess, onCancel }: ProductDepartureFormProps) {
  const [state, setState] = React.useState<FormState>(() => initialState(mode))
  const [error, setError] = React.useState<string | null>(null)
  const { create, update } = useAvailabilitySlotMutation()

  React.useEffect(() => {
    setState(initialState(mode))
    setError(null)
  }, [mode])

  const isSubmitting = create.isPending || update.isPending
  const timezoneOptions = React.useMemo(() => getTimezoneOptions(state.timezone), [state.timezone])
  const derivedNights = React.useMemo(
    () => computeNights(state.startDate, state.endDate),
    [state.endDate, state.startDate],
  )

  const field =
    <K extends keyof FormState>(key: K) =>
    (value: FormState[K]) => {
      setState((previous) => ({ ...previous, [key]: value }))
    }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!state.startDate) {
      setError("Start date is required.")
      return
    }
    if (!state.startTime) {
      setError("Start time is required.")
      return
    }
    if (!state.timezone) {
      setError("Timezone is required.")
      return
    }

    const effectiveEndDate = state.endDate || state.startDate
    if (state.endDate && state.endDate < state.startDate) {
      setError("End date must be on or after the start date.")
      return
    }
    if (state.endTime && effectiveEndDate === state.startDate && state.endTime < state.startTime) {
      setError("End time must be after the start time on the same day.")
      return
    }

    const startsAt = combineLocalToIso(state.startDate, state.startTime)
    const hasEnd = Boolean(state.endDate || state.endTime)
    const endsAt = hasEnd ? combineLocalToIso(effectiveEndDate, state.endTime || "18:00") : null

    const initialPax = state.unlimited ? null : toNullableNumber(state.initialPax)
    const payload = {
      productId: mode.kind === "create" ? mode.productId : mode.slot.productId,
      optionId: mode.kind === "edit" ? mode.slot.optionId : undefined,
      facilityId: mode.kind === "edit" ? mode.slot.facilityId : undefined,
      availabilityRuleId: mode.kind === "edit" ? mode.slot.availabilityRuleId : undefined,
      startTimeId: mode.kind === "edit" ? mode.slot.startTimeId : undefined,
      dateLocal: state.startDate,
      startsAt,
      endsAt,
      timezone: state.timezone,
      status: state.status,
      unlimited: state.unlimited,
      initialPax,
      remainingPax: mode.kind === "create" ? initialPax : state.unlimited ? null : undefined,
      nights: toNullableNumber(state.nights),
      days: toNullableNumber(state.days),
      notes: state.notes.trim() ? state.notes.trim() : null,
    }

    try {
      const slot =
        mode.kind === "create"
          ? await create.mutateAsync(payload)
          : await update.mutateAsync({ id: mode.slot.id, input: payload })
      onSuccess?.(slot)
    } catch (submissionError) {
      setError(
        submissionError instanceof Error ? submissionError.message : "Failed to save departure.",
      )
    }
  }

  return (
    <form
      data-slot="product-departure-form"
      onSubmit={handleSubmit}
      className="flex flex-col gap-4"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product-departure-start-date">Start date</Label>
          <Input
            id="product-departure-start-date"
            type="date"
            required
            autoFocus
            value={state.startDate}
            onChange={(event) => field("startDate")(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product-departure-start-time">Start time</Label>
          <Input
            id="product-departure-start-time"
            type="time"
            required
            value={state.startTime}
            onChange={(event) => field("startTime")(event.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product-departure-end-date">End date</Label>
          <Input
            id="product-departure-end-date"
            type="date"
            value={state.endDate}
            onChange={(event) => field("endDate")(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product-departure-end-time">End time</Label>
          <Input
            id="product-departure-end-time"
            type="time"
            value={state.endTime}
            onChange={(event) => field("endTime")(event.target.value)}
          />
        </div>
      </div>

      {derivedNights > 0 ? (
        <p className="text-sm text-muted-foreground">
          Multi-day departure: {derivedNights} night{derivedNights === 1 ? "" : "s"} (
          {derivedNights + 1} days)
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>Timezone</Label>
          <Select value={state.timezone} onValueChange={(value) => field("timezone")(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-80">
              {timezoneOptions.map((timezone) => (
                <SelectItem key={timezone} value={timezone}>
                  {timezone}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Status</Label>
          <Select
            value={state.status}
            onValueChange={(value) => field("status")(value as AvailabilitySlotRecord["status"])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SLOT_STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Switch
          checked={state.unlimited}
          onCheckedChange={(checked) => field("unlimited")(checked)}
        />
        <Label>Unlimited capacity</Label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product-departure-initial-pax">Initial capacity</Label>
          <Input
            id="product-departure-initial-pax"
            type="number"
            min="0"
            disabled={state.unlimited}
            value={state.initialPax}
            onChange={(event) => field("initialPax")(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product-departure-days">Days</Label>
          <Input
            id="product-departure-days"
            type="number"
            min="0"
            value={state.days}
            onChange={(event) => field("days")(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product-departure-nights">Nights</Label>
          <Input
            id="product-departure-nights"
            type="number"
            min="0"
            value={state.nights}
            onChange={(event) => field("nights")(event.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="product-departure-notes">Notes</Label>
        <Textarea
          id="product-departure-notes"
          value={state.notes}
          onChange={(event) => field("notes")(event.target.value)}
          placeholder="Optional internal notes for this departure"
        />
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex items-center justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
          ) : null}
          {mode.kind === "create" ? "Create departure" : "Save departure"}
        </Button>
      </div>
    </form>
  )
}
