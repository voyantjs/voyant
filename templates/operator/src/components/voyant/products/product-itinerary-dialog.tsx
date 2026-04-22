import { Loader2 } from "lucide-react"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod/v4"
import {
  Button,
  Checkbox,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@/components/ui"
import { useAdminMessages } from "@/lib/admin-i18n"
import { zodResolver } from "@/lib/zod-resolver"

type ItineraryMessages = ReturnType<
  typeof useAdminMessages
>["products"]["operations"]["itineraries"]

const buildItineraryFormSchema = (messages: ItineraryMessages) =>
  z.object({
    name: z.string().min(1, messages.validationNameRequired).max(255),
    isDefault: z.boolean(),
  })

type ItineraryFormSchema = ReturnType<typeof buildItineraryFormSchema>
type ItineraryFormValues = z.input<ItineraryFormSchema>
type ItineraryFormOutput = z.output<ItineraryFormSchema>

type ItineraryData = {
  id: string
  name: string
  isDefault: boolean
}

export type ProductItineraryDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  itinerary?: ItineraryData
  isFirstItinerary?: boolean
  onSubmit: (values: { name: string; isDefault: boolean }) => Promise<void> | void
}

export function ProductItineraryDialog({
  open,
  onOpenChange,
  itinerary,
  isFirstItinerary = false,
  onSubmit,
}: ProductItineraryDialogProps) {
  const messages = useAdminMessages()
  const itineraryMessages = messages.products.operations.itineraries
  const isEditing = !!itinerary
  const schema = buildItineraryFormSchema(itineraryMessages)

  const form = useForm<ItineraryFormValues, unknown, ItineraryFormOutput>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", isDefault: false },
  })

  useEffect(() => {
    if (!open) return
    if (itinerary) {
      form.reset({ name: itinerary.name, isDefault: itinerary.isDefault })
    } else {
      form.reset({ name: "", isDefault: isFirstItinerary })
    }
  }, [open, itinerary, isFirstItinerary, form])

  const isDefault = form.watch("isDefault")
  const defaultLocked = isEditing && itinerary?.isDefault === true

  const handleSubmit = async (values: ItineraryFormOutput) => {
    await onSubmit(values)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? itineraryMessages.editTitle : itineraryMessages.newTitle}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <DialogBody className="grid gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="product-itinerary-name">{itineraryMessages.nameLabel}</Label>
              <Input
                id="product-itinerary-name"
                autoFocus
                placeholder={itineraryMessages.namePlaceholder}
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="flex items-start gap-2">
              <Checkbox
                id="product-itinerary-default"
                checked={isDefault}
                disabled={defaultLocked || isFirstItinerary}
                onCheckedChange={(checked) =>
                  form.setValue("isDefault", checked === true, { shouldDirty: true })
                }
              />
              <div className="flex flex-col gap-1">
                <Label htmlFor="product-itinerary-default" className="text-sm font-normal">
                  {itineraryMessages.setDefaultLabel}
                </Label>
                {defaultLocked ? (
                  <p className="text-xs text-muted-foreground">
                    {itineraryMessages.defaultLockHint}
                  </p>
                ) : isFirstItinerary ? (
                  <p className="text-xs text-muted-foreground">
                    {itineraryMessages.firstDefaultHint}
                  </p>
                ) : null}
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {itineraryMessages.cancel}
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? itineraryMessages.save : itineraryMessages.create}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
