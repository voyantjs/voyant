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
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@/components/ui"
import { api } from "@/lib/api-client"
import { zodResolver } from "@/lib/zod-resolver"

const statusChangeFormSchema = z.object({
  status: z.enum(["draft", "confirmed", "in_progress", "completed", "cancelled"]),
  note: z.string().optional().nullable(),
})

type StatusChangeFormValues = z.input<typeof statusChangeFormSchema>
type StatusChangeFormOutput = z.output<typeof statusChangeFormSchema>

type StatusChangeDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookingId: string
  currentStatus: string
  onSuccess: () => void
}

const BOOKING_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "confirmed", label: "Confirmed" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const

export function StatusChangeDialog({
  open,
  onOpenChange,
  bookingId,
  currentStatus,
  onSuccess,
}: StatusChangeDialogProps) {
  const form = useForm<StatusChangeFormValues, unknown, StatusChangeFormOutput>({
    resolver: zodResolver(statusChangeFormSchema),
    defaultValues: {
      status: "draft",
      note: "",
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        status: currentStatus as StatusChangeFormValues["status"],
        note: "",
      })
    }
  }, [open, currentStatus, form])

  const onSubmit = async (values: StatusChangeFormOutput) => {
    await api.patch(`/v1/bookings/${bookingId}/status`, {
      status: values.status,
      note: values.note || null,
    })
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Booking Status</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <DialogBody className="grid gap-4">
            <div className="flex flex-col gap-2">
              <Label>New Status</Label>
              <Select
                value={form.watch("status")}
                onValueChange={(v) =>
                  form.setValue("status", v as StatusChangeFormValues["status"])
                }
                items={BOOKING_STATUSES}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BOOKING_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Note (optional)</Label>
              <Textarea {...form.register("note")} placeholder="Reason for status change..." />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Status
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
