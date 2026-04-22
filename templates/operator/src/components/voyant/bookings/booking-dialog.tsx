"use client"

import { type BookingRecord, useBookingMutation } from "@voyantjs/bookings-react"
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
import { CurrencyCombobox } from "@/components/ui/currency-combobox"
import { DateRangePicker } from "@/components/ui/date-picker"
import { useAdminMessages } from "@/lib/admin-i18n"
import { zodResolver } from "@/lib/zod-resolver"

type BookingDialogMessages = ReturnType<typeof useAdminMessages>["bookings"]["dialog"]

const buildBookingFormSchema = (messages: BookingDialogMessages) =>
  z.object({
    bookingNumber: z.string().min(1, messages.validationBookingNumberRequired),
    status: z.enum(["draft", "confirmed", "in_progress", "completed", "cancelled"]),
    sellCurrency: z.string().min(3).max(3, messages.validationIsoCurrency),
    sellAmountCents: z.coerce.number().int().min(0).optional().or(z.literal("")).nullable(),
    costAmountCents: z.coerce.number().int().min(0).optional().or(z.literal("")).nullable(),
    startDate: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),
    pax: z.coerce.number().int().positive().optional().or(z.literal("")).nullable(),
    internalNotes: z.string().optional().nullable(),
  })

type BookingFormSchema = ReturnType<typeof buildBookingFormSchema>
type BookingFormValues = z.input<BookingFormSchema>
type BookingFormOutput = z.output<BookingFormSchema>

export interface BookingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  booking?: BookingRecord
  onSuccess?: (booking: BookingRecord) => void
}

function generateBookingNumber(): string {
  const now = new Date()
  const y = now.getFullYear().toString().slice(-2)
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const seq = String(Math.floor(Math.random() * 9000) + 1000)
  return `BK-${y}${m}-${seq}`
}

export function BookingDialog({ open, onOpenChange, booking, onSuccess }: BookingDialogProps) {
  const dialogMessages = useAdminMessages().bookings.dialog
  const isEditing = Boolean(booking)
  const { create, update } = useBookingMutation()
  const bookingFormSchema = buildBookingFormSchema(dialogMessages)
  const bookingStatuses = [
    { value: "draft", label: dialogMessages.statusDraft },
    { value: "confirmed", label: dialogMessages.statusConfirmed },
    { value: "in_progress", label: dialogMessages.statusInProgress },
    { value: "completed", label: dialogMessages.statusCompleted },
    { value: "cancelled", label: dialogMessages.statusCancelled },
  ] as const

  const form = useForm<BookingFormValues, unknown, BookingFormOutput>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      bookingNumber: "",
      status: "draft",
      sellCurrency: "EUR",
      sellAmountCents: "",
      costAmountCents: "",
      startDate: "",
      endDate: "",
      pax: "",
      internalNotes: "",
    },
  })

  useEffect(() => {
    if (open && booking) {
      form.reset({
        bookingNumber: booking.bookingNumber,
        status:
          booking.status === "on_hold" || booking.status === "expired" ? "draft" : booking.status,
        sellCurrency: booking.sellCurrency,
        sellAmountCents: booking.sellAmountCents ?? "",
        costAmountCents: booking.costAmountCents ?? "",
        startDate: booking.startDate ?? "",
        endDate: booking.endDate ?? "",
        pax: booking.pax ?? "",
        internalNotes: booking.internalNotes ?? "",
      })
    } else if (open) {
      form.reset({
        bookingNumber: generateBookingNumber(),
        status: "draft",
        sellCurrency: "EUR",
        sellAmountCents: "",
        costAmountCents: "",
        startDate: "",
        endDate: "",
        pax: "",
        internalNotes: "",
      })
    }
  }, [booking, form, open])

  const onSubmit = async (values: BookingFormOutput) => {
    const payload = {
      bookingNumber: values.bookingNumber,
      status: values.status,
      sellCurrency: values.sellCurrency,
      sellAmountCents:
        values.sellAmountCents && typeof values.sellAmountCents === "number"
          ? values.sellAmountCents
          : null,
      costAmountCents:
        values.costAmountCents && typeof values.costAmountCents === "number"
          ? values.costAmountCents
          : null,
      startDate: values.startDate || null,
      endDate: values.endDate || null,
      pax: values.pax && typeof values.pax === "number" ? values.pax : null,
      internalNotes: values.internalNotes || null,
    }

    const saved = isEditing
      ? await update.mutateAsync({ id: booking!.id, input: payload })
      : await create.mutateAsync(payload)

    onOpenChange(false)
    onSuccess?.(saved)
  }

  const isSubmitting = create.isPending || update.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? dialogMessages.editTitle : dialogMessages.newTitle}
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <DialogBody className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>{dialogMessages.bookingNumberLabel}</Label>
                <Input
                  {...form.register("bookingNumber")}
                  placeholder={dialogMessages.bookingNumberPlaceholder}
                />
                {form.formState.errors.bookingNumber && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.bookingNumber.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label>{dialogMessages.statusLabel}</Label>
                <Select
                  value={form.watch("status")}
                  onValueChange={(value) =>
                    form.setValue("status", value as BookingFormValues["status"])
                  }
                  items={bookingStatuses}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {bookingStatuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>{dialogMessages.sellCurrencyLabel}</Label>
                <CurrencyCombobox
                  value={form.watch("sellCurrency") || null}
                  onChange={(next) =>
                    form.setValue("sellCurrency", next ?? "EUR", {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>{dialogMessages.travelDatesLabel}</Label>
                <DateRangePicker
                  value={{
                    from: form.watch("startDate") || null,
                    to: form.watch("endDate") || null,
                  }}
                  onChange={(nextValue) => {
                    form.setValue("startDate", nextValue?.from ?? "", { shouldDirty: true })
                    form.setValue("endDate", nextValue?.to ?? "", { shouldDirty: true })
                  }}
                  placeholder={dialogMessages.travelDatesPlaceholder}
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <Label>{dialogMessages.sellAmountLabel}</Label>
                <Input {...form.register("sellAmountCents")} type="number" min="0" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>{dialogMessages.costAmountLabel}</Label>
                <Input {...form.register("costAmountCents")} type="number" min="0" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>{dialogMessages.paxLabel}</Label>
                <Input
                  {...form.register("pax")}
                  type="number"
                  min="1"
                  placeholder={dialogMessages.paxPlaceholder}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>{dialogMessages.internalNotesLabel}</Label>
              <Textarea
                {...form.register("internalNotes")}
                placeholder={dialogMessages.internalNotesPlaceholder}
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              {dialogMessages.cancel}
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? dialogMessages.saveChanges : dialogMessages.create}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
