"use client"

import { type BookingRecord, useBookingConvertMutation } from "@voyantjs/bookings-react"
import { useOrganizations, usePeople, usePersonMutation } from "@voyantjs/crm-react"
import { useProductOptions, useProducts } from "@voyantjs/products-react"
import { Loader2, UserPlus } from "lucide-react"
import * as React from "react"

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

function generateBookingNumber(): string {
  const now = new Date()
  const y = now.getFullYear().toString().slice(-2)
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const seq = String(Math.floor(Math.random() * 9000) + 1000)
  return `BK-${y}${m}-${seq}`
}

const NONE = "__none__"

export interface QuickBookDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (booking: BookingRecord) => void
}

type PersonMode = "existing" | "new"

export function QuickBookDialog({ open, onOpenChange, onCreated }: QuickBookDialogProps) {
  const [productId, setProductId] = React.useState("")
  const [productSearch, setProductSearch] = React.useState("")
  const [optionId, setOptionId] = React.useState<string>(NONE)
  const [organizationId, setOrganizationId] = React.useState<string>(NONE)
  const [orgSearch, setOrgSearch] = React.useState("")
  const [notes, setNotes] = React.useState("")

  const [personMode, setPersonMode] = React.useState<PersonMode>("existing")
  const [personId, setPersonId] = React.useState("")
  const [personSearch, setPersonSearch] = React.useState("")
  const [newPerson, setNewPerson] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  })

  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) {
      setProductId("")
      setProductSearch("")
      setOptionId(NONE)
      setOrganizationId(NONE)
      setOrgSearch("")
      setNotes("")
      setPersonMode("existing")
      setPersonId("")
      setPersonSearch("")
      setNewPerson({ firstName: "", lastName: "", email: "", phone: "" })
      setError(null)
    }
  }, [open])

  const { data: productsData } = useProducts({
    search: productSearch || undefined,
    limit: 20,
    enabled: open,
  })
  const products = productsData?.data ?? []

  const { data: optionsData } = useProductOptions({
    productId: productId || undefined,
    limit: 50,
    enabled: open && Boolean(productId),
  })
  const options = optionsData?.data ?? []

  const { data: peopleData } = usePeople({
    search: personSearch || undefined,
    limit: 20,
    enabled: open && personMode === "existing",
  })
  const people = peopleData?.data ?? []

  const { data: orgsData } = useOrganizations({
    search: orgSearch || undefined,
    limit: 20,
    enabled: open,
  })
  const orgs = orgsData?.data ?? []

  const { create: createPerson } = usePersonMutation()
  const convertMutation = useBookingConvertMutation()

  const handleSubmit = async () => {
    setError(null)

    if (!productId) {
      setError("Select a product")
      return
    }

    let resolvedPersonId: string | null = null
    try {
      if (personMode === "existing") {
        if (!personId) {
          setError("Select a person or switch to create mode")
          return
        }
        resolvedPersonId = personId
      } else {
        if (!newPerson.firstName.trim() || !newPerson.lastName.trim()) {
          setError("First and last name are required")
          return
        }
        const person = await createPerson.mutateAsync({
          firstName: newPerson.firstName.trim(),
          lastName: newPerson.lastName.trim(),
          email: newPerson.email.trim() || null,
          phone: newPerson.phone.trim() || null,
        })
        resolvedPersonId = person.id
      }

      const booking = await convertMutation.mutateAsync({
        productId,
        bookingNumber: generateBookingNumber(),
        optionId: optionId === NONE ? null : optionId,
        personId: resolvedPersonId,
        organizationId: organizationId === NONE ? null : organizationId,
        internalNotes: notes.trim() || null,
      })

      onOpenChange(false)
      onCreated?.(booking)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create booking")
    }
  }

  const isSubmitting = convertMutation.isPending || createPerson.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Quick Book</DialogTitle>
        </DialogHeader>
        <DialogBody className="grid gap-4">
          {/* Product */}
          <div className="flex flex-col gap-2">
            <Label>
              Product <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="Search products..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
            />
            <Select
              value={productId}
              onValueChange={(v) => {
                setProductId(v ?? "")
                setOptionId(NONE)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a product..." />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Option (if product has options) */}
          {productId && options.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label>Option</Label>
              <Select value={optionId} onValueChange={(v) => setOptionId(v ?? NONE)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>No specific option</SelectItem>
                  {options.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Person */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label>
                Person <span className="text-destructive">*</span>
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7"
                onClick={() => setPersonMode(personMode === "existing" ? "new" : "existing")}
              >
                {personMode === "existing" ? (
                  <>
                    <UserPlus className="mr-1 h-3.5 w-3.5" />
                    Create new
                  </>
                ) : (
                  "Select existing"
                )}
              </Button>
            </div>

            {personMode === "existing" ? (
              <>
                <Input
                  placeholder="Search people by name or email..."
                  value={personSearch}
                  onChange={(e) => setPersonSearch(e.target.value)}
                />
                <Select value={personId} onValueChange={(v) => setPersonId(v ?? "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a person..." />
                  </SelectTrigger>
                  <SelectContent>
                    {people.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.firstName} {p.lastName}
                        {p.email ? ` · ${p.email}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 rounded-md border p-3">
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">First Name</Label>
                  <Input
                    value={newPerson.firstName}
                    onChange={(e) => setNewPerson({ ...newPerson, firstName: e.target.value })}
                    placeholder="John"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">Last Name</Label>
                  <Input
                    value={newPerson.lastName}
                    onChange={(e) => setNewPerson({ ...newPerson, lastName: e.target.value })}
                    placeholder="Smith"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">Email</Label>
                  <Input
                    type="email"
                    value={newPerson.email}
                    onChange={(e) => setNewPerson({ ...newPerson, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">Phone</Label>
                  <Input
                    value={newPerson.phone}
                    onChange={(e) => setNewPerson({ ...newPerson, phone: e.target.value })}
                    placeholder="+44 7911 123456"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Organization (optional) */}
          <div className="flex flex-col gap-2">
            <Label>Organization (optional)</Label>
            <Input
              placeholder="Search organizations..."
              value={orgSearch}
              onChange={(e) => setOrgSearch(e.target.value)}
            />
            <Select value={organizationId} onValueChange={(v) => setOrganizationId(v ?? NONE)}>
              <SelectTrigger>
                <SelectValue placeholder="No organization" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>No organization</SelectItem>
                {orgs.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
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
            disabled={isSubmitting || !productId}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Draft Booking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
