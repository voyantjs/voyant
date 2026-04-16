"use client"

import { useBookingDocumentMutation, usePassengers } from "@voyantjs/bookings-react"
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
import { zodResolver } from "@/lib/zod-resolver"

import { FileDropzone } from "./file-dropzone"

const documentTypes = ["visa", "insurance", "health", "passport_copy", "other"] as const

const UNASSIGNED = "__unassigned__"

const documentFormSchema = z.object({
  type: z.enum(documentTypes).default("other"),
  fileName: z.string().min(1, "File name is required").max(500),
  fileUrl: z.string().url("Must be a valid URL"),
  participantId: z.string().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

type DocumentFormValues = z.input<typeof documentFormSchema>
type DocumentFormOutput = z.output<typeof documentFormSchema>

export interface BookingDocumentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookingId: string
  onSuccess?: () => void
}

export function BookingDocumentDialog({
  open,
  onOpenChange,
  bookingId,
  onSuccess,
}: BookingDocumentDialogProps) {
  const { create } = useBookingDocumentMutation(bookingId)
  const { data: passengersData } = usePassengers(bookingId)
  const passengers = passengersData?.data ?? []

  const form = useForm<DocumentFormValues, unknown, DocumentFormOutput>({
    resolver: zodResolver(documentFormSchema),
    defaultValues: {
      type: "other",
      fileName: "",
      fileUrl: "",
      participantId: UNASSIGNED,
      expiresAt: "",
      notes: "",
    },
  })

  useEffect(() => {
    if (open) {
      form.reset()
    }
  }, [form, open])

  const onSubmit = async (values: DocumentFormOutput) => {
    await create.mutateAsync({
      type: values.type,
      fileName: values.fileName,
      fileUrl: values.fileUrl,
      participantId:
        values.participantId && values.participantId !== UNASSIGNED ? values.participantId : null,
      expiresAt: values.expiresAt || null,
      notes: values.notes || null,
    })

    onOpenChange(false)
    onSuccess?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Add Document</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <DialogBody className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Type</Label>
                <Select
                  value={form.watch("type")}
                  onValueChange={(v) =>
                    form.setValue("type", (v ?? "other") as (typeof documentTypes)[number])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Passenger (optional)</Label>
                <Select
                  value={form.watch("participantId") ?? UNASSIGNED}
                  onValueChange={(v) => form.setValue("participantId", v ?? UNASSIGNED)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UNASSIGNED}>Booking-wide</SelectItem>
                    {passengers.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.firstName} {p.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>File</Label>
              <FileDropzone
                accept="application/pdf,image/*"
                maxSize={10 * 1024 * 1024}
                onUploaded={(upload) => {
                  form.setValue("fileUrl", upload.url, { shouldValidate: true })
                  form.setValue("fileName", upload.name, { shouldValidate: true })
                }}
                helperText="Drop passport, visa, or insurance document (PDF or image)"
              />
              {form.formState.errors.fileUrl && (
                <p className="text-xs text-destructive">{form.formState.errors.fileUrl.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label>Expires At (optional)</Label>
              <Input {...form.register("expiresAt")} type="date" />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Notes</Label>
              <Textarea {...form.register("notes")} placeholder="Additional notes..." />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={create.isPending}>
              {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Document
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
