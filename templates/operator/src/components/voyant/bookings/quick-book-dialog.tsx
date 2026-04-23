"use client"

import { useSlots } from "@voyantjs/availability-react"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@/components/ui"
import { useAdminMessages } from "@/lib/admin-i18n"

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
  /** When provided, pre-selects this product and hides the product picker. */
  defaultProductId?: string
}

export function QuickBookDialog({
  open,
  onOpenChange,
  onCreated,
  defaultProductId,
}: QuickBookDialogProps) {
  const messages = useAdminMessages().bookings.quickBook
  const [product, setProduct] = React.useState<ProductPickerValue>({
    productId: defaultProductId ?? "",
    optionId: null,
  })
  const [slotId, setSlotId] = React.useState<string | null>(null)
  const [person, setPerson] = React.useState<PersonPickerValue>(emptyPersonPickerValue)
  const [sharedRoom, setSharedRoom] = React.useState<SharedRoomValue>(emptySharedRoomValue)
  const [notes, setNotes] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) {
      setProduct({ productId: defaultProductId ?? "", optionId: null })
      setSlotId(null)
      setPerson(emptyPersonPickerValue)
      setSharedRoom(emptySharedRoomValue)
      setNotes("")
      setError(null)
    } else if (defaultProductId) {
      setProduct((prev) =>
        prev.productId === defaultProductId
          ? prev
          : { productId: defaultProductId, optionId: null },
      )
    }
  }, [open, defaultProductId])

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally only resets when product/option changes
  React.useEffect(() => {
    setSlotId(null)
  }, [product.productId, product.optionId])

  const { data: slotsData } = useSlots({
    productId: product.productId || undefined,
    status: "open",
    limit: 100,
    enabled: open && Boolean(product.productId),
  })
  const slots = React.useMemo(() => {
    const nowIso = new Date().toISOString()
    return (slotsData?.data ?? [])
      .filter((slot) => slot.startsAt >= nowIso)
      .filter((slot) => {
        if (!product.optionId) return true
        return slot.optionId === null || slot.optionId === product.optionId
      })
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
  }, [slotsData, product.optionId])

  const formatSlotLabel = React.useCallback((slot: (typeof slots)[number]) => {
    const date = new Date(slot.startsAt).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
    const remaining =
      !slot.unlimited && typeof slot.remainingPax === "number" ? ` · ${slot.remainingPax} left` : ""
    return `${date}${remaining}`
  }, [])

  const { create: createPerson } = usePersonMutation()
  const convertMutation = useBookingConvertMutation()
  const { create: createGroup } = useBookingGroupMutation()
  const { add: addGroupMember } = useBookingGroupMemberMutation()

  const productLabels = {
    product: messages.productLabel,
    productSearchPlaceholder: messages.productSearchPlaceholder,
    productSelectPlaceholder: messages.productSelectPlaceholder,
    option: messages.optionLabel,
    optionNone: messages.optionNone,
  }

  const personLabels = {
    person: messages.personLabel,
    createNewPerson: messages.createNewPerson,
    selectExistingPerson: messages.selectExistingPerson,
    personSearchPlaceholder: messages.personSearchPlaceholder,
    personSelectPlaceholder: messages.personSelectPlaceholder,
    firstName: messages.firstNameLabel,
    firstNamePlaceholder: messages.firstNamePlaceholder,
    lastName: messages.lastNameLabel,
    lastNamePlaceholder: messages.lastNamePlaceholder,
    email: messages.emailLabel,
    emailPlaceholder: messages.emailPlaceholder,
    phone: messages.phoneLabel,
    phonePlaceholder: messages.phonePlaceholder,
    organization: messages.organizationLabel,
    organizationSearchPlaceholder: messages.organizationSearchPlaceholder,
    organizationNone: messages.organizationNone,
  }

  const sharedRoomLabels = {
    toggle: messages.sharedRoomLabel,
    createMode: messages.sharedRoomCreate,
    joinMode: messages.sharedRoomJoin,
    selectPlaceholder: messages.sharedRoomSelectPlaceholder,
    noGroups: messages.sharedRoomNoGroups,
    createHint: messages.sharedRoomCreateHint,
  }

  const handleSubmit = async () => {
    setError(null)

    if (!product.productId) {
      setError(messages.errorSelectProduct)
      return
    }

    let resolvedPersonId: string | null = null
    try {
      if (person.mode === "existing") {
        if (!person.personId) {
          setError(messages.errorSelectPerson)
          return
        }
        resolvedPersonId = person.personId
      } else {
        if (!person.newPerson.firstName.trim() || !person.newPerson.lastName.trim()) {
          setError(messages.errorNameRequired)
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
        setError(messages.errorSelectSharedRoom)
        return
      }

      const booking = await convertMutation.mutateAsync({
        productId: product.productId,
        bookingNumber: generateBookingNumber(),
        optionId: product.optionId,
        slotId,
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
      setError(err instanceof Error ? err.message : messages.errorCreateFailed)
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
          <DialogTitle>{messages.title}</DialogTitle>
        </DialogHeader>
        <DialogBody className="grid gap-4">
          <ProductPickerSection
            value={product}
            onChange={setProduct}
            enabled={open}
            lockProduct={Boolean(defaultProductId)}
            labels={productLabels}
          />

          {product.productId ? (
            <div className="flex flex-col gap-1">
              <Label>{messages.departureLabel}</Label>
              <Select
                value={slotId ?? "__none__"}
                onValueChange={(v) => setSlotId(v === "__none__" ? null : (v ?? null))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={messages.departureSelectPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{messages.departureNone}</SelectItem>
                  {slots.length === 0 ? (
                    <SelectItem value="__empty__" disabled>
                      {messages.departureEmpty}
                    </SelectItem>
                  ) : (
                    slots.map((slot) => (
                      <SelectItem key={slot.id} value={slot.id}>
                        {formatSlotLabel(slot)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <PersonPickerSection
            value={person}
            onChange={setPerson}
            enabled={open}
            labels={personLabels}
          />

          <SharedRoomSection
            value={sharedRoom}
            onChange={setSharedRoom}
            productId={product.productId || undefined}
            enabled={open}
            labels={sharedRoomLabels}
          />

          <div className="flex flex-col gap-2">
            <Label>{messages.notesLabel}</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={messages.notesPlaceholder}
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
            {messages.cancel}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting || !product.productId}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {messages.create}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
