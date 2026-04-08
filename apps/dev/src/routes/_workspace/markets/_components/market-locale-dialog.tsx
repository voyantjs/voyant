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
  Switch,
} from "@/components/ui"
import { api } from "@/lib/api-client"
import { zodResolver } from "@/lib/zod-resolver"

const formSchema = z.object({
  languageTag: z.string().min(2, "Language tag is required").max(35),
  isDefault: z.boolean(),
  sortOrder: z.coerce.number().int().min(0),
  active: z.boolean(),
})

type FormValues = z.input<typeof formSchema>
type FormOutput = z.output<typeof formSchema>

export type MarketLocaleData = {
  id: string
  marketId: string
  languageTag: string
  isDefault: boolean
  sortOrder: number
  active: boolean
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  marketId: string
  locale?: MarketLocaleData
  onSuccess: () => void
}

export function MarketLocaleDialog({ open, onOpenChange, marketId, locale, onSuccess }: Props) {
  const isEditing = !!locale

  const form = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      languageTag: "en",
      isDefault: false,
      sortOrder: 0,
      active: true,
    },
  })

  useEffect(() => {
    if (open && locale) {
      form.reset({
        languageTag: locale.languageTag,
        isDefault: locale.isDefault,
        sortOrder: locale.sortOrder,
        active: locale.active,
      })
    } else if (open) {
      form.reset({
        languageTag: "en",
        isDefault: false,
        sortOrder: 0,
        active: true,
      })
    }
  }, [open, locale, form])

  const onSubmit = async (values: FormOutput) => {
    const payload = {
      languageTag: values.languageTag,
      isDefault: values.isDefault,
      sortOrder: values.sortOrder,
      active: values.active,
    }
    if (isEditing) {
      await api.patch(`/v1/markets/market-locales/${locale.id}`, payload)
    } else {
      await api.post(`/v1/markets/markets/${marketId}/locales`, payload)
    }
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Locale" : "Add Locale"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogBody className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Language tag</Label>
                <Input {...form.register("languageTag")} placeholder="en-GB, de-DE…" />
                {form.formState.errors.languageTag && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.languageTag.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label>Sort order</Label>
                <Input {...form.register("sortOrder")} type="number" min="0" />
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.watch("isDefault")}
                  onCheckedChange={(v) => form.setValue("isDefault", v)}
                />
                <Label>Default</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.watch("active")}
                  onCheckedChange={(v) => form.setValue("active", v)}
                />
                <Label>Active</Label>
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Add Locale"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
