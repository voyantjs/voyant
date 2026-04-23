"use client"

import {
  type BookingRecord,
  useBookingConvertMutation,
  useBookingGroupMemberMutation,
  useBookingGroupMutation,
} from "@voyantjs/bookings-react"
import { usePersonMutation } from "@voyantjs/crm-react"
import { Loader2 } from "lucide-react"
import * as React from "react"

import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Textarea,
} from "@/components/ui"

import {
  emptyPersonPickerValue,
  PersonPickerSection,
  type PersonPickerValue,
} from "./person-picker-section"
import { ProductPickerSection, type ProductPickerValue } from "./product-picker-section"
import {
  emptySharedRoomValue,
  SharedRoomSection,
  type SharedRoomValue,
} from "./shared-room-section"

function generateBookingNumber(): string {
  const now = new Date()
  const y = now.getFullYear().toString().slice(-2)
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const seq = String(Math.floor(Math.random() * 9000) + 1000)
  return `BK-${y}${m}-${seq}`
}

export interface QuickBookDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (booking: BookingRecord) => void
}

/**
 * Default operator quick-book dialog. Composes three registry sections —
 * product picker, person picker, shared-room — into the standard create flow
 * (product → option → person + organization → shared-room → notes → create).
 *
 * Apps that need a custom flow can install the sections individually
 * (`voyant-bookings-product-picker-section`, `…-person-picker-section`,
 * `…-shared-room-section`) and assemble their own dialog, instead of forking
 * this file.
 */
export function QuickBookDialog({ open, onOpenChange, onCreated }: QuickBookDialogProps) {
  const [product, setProduct] = React.useState<ProductPickerValue>({
    productId: "",
    optionId: null,
  })
  const [person, setPerson] = React.useState<PersonPickerValue>(emptyPersonPickerValue)
  const [sharedRoom, setSharedRoom] = React.useState<SharedRoomValue>(emptySharedRoomValue)
  const [notes, setNotes] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) {
      setProduct({ productId: "", optionId: null })
      setPerson(emptyPersonPickerValue)
      setSharedRoom(emptySharedRoomValue)
      setNotes("")
      setError(null)
    }
  }, [open])

  const { create: createPerson } = usePersonMutation()
  const convertMutation = useBookingConvertMutation()
  const { create: createGroup } = useBookingGroupMutation()
  const { add: addGroupMember } = useBookingGroupMemberMutation()

  const handleSubmit = async () => {
    setError(null)

    if (!product.productId) {
      setError("Select a product")
      return
    }

    let resolvedPersonId: string | null = null
    try {
      if (person.mode === "existing") {
        if (!person.personId) {
          setError("Select a person or switch to create mode")
          return
        }
        resolvedPersonId = person.personId
      } else {
        if (!person.newPerson.firstName.trim() || !person.newPerson.lastName.trim()) {
          setError("First and last name are required")
          return
        }
        const created = await createPerson.mutateAsync({
          firstName: person.newPerson.firstName.trim(),
          lastName: person.newPerson.lastName.trim(),
          email: person.newPerson.email.trim() || null,
          phone: person.newPerson.phone.trim() || null,
        })
        resolvedPersonId = created.id
      }

      // Validate shared-room selection before creating the booking so we don't
      // leave an orphan booking if the user picked "join" without a group.
      if (sharedRoom.enabled && sharedRoom.mode === "join" && !sharedRoom.groupId) {
        setError("Select a shared-room group to join")
        return
      }

      const booking = await convertMutation.mutateAsync({
        productId: product.productId,
        bookingNumber: generateBookingNumber(),
        optionId: product.optionId,
        personId: resolvedPersonId,
        organizationId: person.organizationId,
        internalNotes: notes.trim() || null,
      })

      if (sharedRoom.enabled) {
        let targetGroupId = sharedRoom.groupId
        let role: "primary" | "shared" = "shared"

        if (sharedRoom.mode === "create") {
          const group = await createGroup.mutateAsync({
            kind: "shared_room",
            label: `Shared room — ${booking.bookingNumber}`,
            productId: product.productId || null,
            optionUnitId: product.optionId,
            primaryBookingId: booking.id,
          })
          targetGroupId = group.id
          role = "primary"
        }

        await addGroupMember.mutateAsync({
          groupId: targetGroupId,
          bookingId: booking.id,
          role,
        })
      }

      onOpenChange(false)
      onCreated?.(booking)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create booking")
    }
  }

  const isSubmitting =
    convertMutation.isPending ||
    createPerson.isPending ||
    createGroup.isPending ||
    addGroupMember.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Quick Book</DialogTitle>
        </DialogHeader>
        <DialogBody className="grid gap-4">
          <ProductPickerSection value={product} onChange={setProduct} enabled={open} />
          <PersonPickerSection value={person} onChange={setPerson} enabled={open} />
          <SharedRoomSection
            value={sharedRoom}
            onChange={setSharedRoom}
            productId={product.productId || undefined}
            enabled={open}
          />

          <div className="flex flex-col gap-2">
            <Label>Internal Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Quick context for this booking..."
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}
        </DialogBody>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting || !product.productId}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Draft Booking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
