"use client"

import { useBookingGroupMutation, useBookingGroups } from "@voyantjs/bookings-react"
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
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui"

export interface BookingGroupLinkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookingId: string
  productId?: string | null
  optionUnitId?: string | null
  onLinked?: (groupId: string) => void
}

type Mode = "join" | "create"

export function BookingGroupLinkDialog({
  open,
  onOpenChange,
  bookingId,
  productId,
  optionUnitId,
  onLinked,
}: BookingGroupLinkDialogProps) {
  const [mode, setMode] = React.useState<Mode>("join")
  const [selectedGroupId, setSelectedGroupId] = React.useState("")
  const [newGroupLabel, setNewGroupLabel] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) {
      setMode("join")
      setSelectedGroupId("")
      setNewGroupLabel("")
      setError(null)
    }
  }, [open])

  // List existing groups scoped by productId/optionUnitId if provided
  const { data } = useBookingGroups({
    productId: productId ?? undefined,
    optionUnitId: optionUnitId ?? undefined,
    limit: 50,
    enabled: open,
  })
  const groups = data?.data ?? []

  const { create: createGroup } = useBookingGroupMutation()
  // Member mutation needs a groupId up front; we'll construct it per-action below.

  const handleSubmit = async () => {
    setError(null)
    try {
      let targetGroupId = selectedGroupId

      if (mode === "create") {
        const label = newGroupLabel.trim() || `Shared room — ${new Date().toLocaleDateString()}`
        const group = await createGroup.mutateAsync({
          kind: "shared_room",
          label,
          productId: productId ?? null,
          optionUnitId: optionUnitId ?? null,
          primaryBookingId: bookingId,
        })
        targetGroupId = group.id
      }

      if (!targetGroupId) {
        setError("Select a group to join")
        return
      }

      // Add this booking as a member
      const res = await fetch(`/api/v1/bookings/groups/${targetGroupId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ bookingId, role: mode === "create" ? "primary" : "shared" }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null
        setError(body?.error ?? "Failed to add booking to group")
        return
      }

      onOpenChange(false)
      onLinked?.(targetGroupId)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to link booking")
    }
  }

  const isSubmitting = createGroup.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Link Booking to Shared Room</DialogTitle>
        </DialogHeader>
        <DialogBody className="grid gap-4">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={mode === "join" ? "default" : "ghost"}
              onClick={() => setMode("join")}
            >
              Join existing
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === "create" ? "default" : "ghost"}
              onClick={() => setMode("create")}
            >
              Create new
            </Button>
          </div>

          {mode === "join" ? (
            <div className="flex flex-col gap-2">
              <Label>Existing groups</Label>
              <Select value={selectedGroupId} onValueChange={(v) => setSelectedGroupId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a group..." />
                </SelectTrigger>
                <SelectContent>
                  {groups.length === 0 ? (
                    <SelectItem value="__none__" disabled>
                      No existing groups
                    </SelectItem>
                  ) : (
                    groups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.label}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Label>Group label</Label>
              <Input
                value={newGroupLabel}
                onChange={(e) => setNewGroupLabel(e.target.value)}
                placeholder="e.g. Smith + Jones, Room 204"
              />
              <p className="text-xs text-muted-foreground">
                This booking will be marked as the primary member.
              </p>
            </div>
          )}

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
            disabled={isSubmitting || (mode === "join" && !selectedGroupId)}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "create" ? "Create & Link" : "Link to Group"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
