"use client"

import { type BookingPassengerRecord, usePassengerMutation } from "@voyantjs/bookings-react"
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
  Textarea,
} from "@/components/ui"
import { zodResolver } from "@/lib/zod-resolver"

const passengerFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  phone: z.string().optional().nullable(),
  specialRequests: z.string().optional().nullable(),
})

type PassengerFormValues = z.input<typeof passengerFormSchema>
type PassengerFormOutput = z.output<typeof passengerFormSchema>

export interface PassengerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookingId: string
  passenger?: BookingPassengerRecord
  onSuccess?: () => void
}

export function PassengerDialog({
  open,
  onOpenChange,
  bookingId,
  passenger,
  onSuccess,
}: PassengerDialogProps) {
  const isEditing = Boolean(passenger)
  const { create, update } = usePassengerMutation(bookingId)

  const form = useForm<PassengerFormValues, unknown, PassengerFormOutput>({
    resolver: zodResolver(passengerFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      specialRequests: "",
    },
  })

  useEffect(() => {
    if (open && passenger) {
      form.reset({
        firstName: passenger.firstName,
        lastName: passenger.lastName,
        email: passenger.email ?? "",
        phone: passenger.phone ?? "",
        specialRequests: passenger.specialRequests ?? "",
      })
    } else if (open) {
      form.reset()
    }
  }, [form, open, passenger])

  const onSubmit = async (values: PassengerFormOutput) => {
    const payload = {
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email || null,
      phone: values.phone || null,
      specialRequests: values.specialRequests || null,
    }

    if (isEditing) {
      await update.mutateAsync({ id: passenger!.id, input: payload })
    } else {
      await create.mutateAsync(payload)
    }

    onOpenChange(false)
    onSuccess?.()
  }

  const isSubmitting = create.isPending || update.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Passenger" : "Add Passenger"}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <DialogBody className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>First Name</Label>
                <Input {...form.register("firstName")} placeholder="John" />
                {form.formState.errors.firstName && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.firstName.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label>Last Name</Label>
                <Input {...form.register("lastName")} placeholder="Smith" />
                {form.formState.errors.lastName && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Email</Label>
                <Input {...form.register("email")} type="email" placeholder="john@example.com" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Phone</Label>
                <Input {...form.register("phone")} placeholder="+44 7911 123456" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Special Requests</Label>
              <Textarea
                {...form.register("specialRequests")}
                placeholder="Any special requests..."
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Add Passenger"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
