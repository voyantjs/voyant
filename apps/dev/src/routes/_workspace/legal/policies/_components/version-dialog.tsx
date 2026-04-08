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
import { api } from "@/lib/api-client"
import { zodResolver } from "@/lib/zod-resolver"

const versionFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  bodyFormat: z.enum(["markdown", "html", "plain"]),
  body: z.string().optional(),
})

type FormValues = z.input<typeof versionFormSchema>
type FormOutput = z.output<typeof versionFormSchema>

type VersionData = {
  id: string
  title: string
  bodyFormat: string
  body: string | null
}

type VersionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  policyId: string
  version?: VersionData
  onSuccess: () => void
}

const BODY_FORMATS = [
  { value: "markdown", label: "Markdown" },
  { value: "html", label: "HTML" },
  { value: "plain", label: "Plain Text" },
] as const

export function VersionDialog({
  open,
  onOpenChange,
  policyId,
  version,
  onSuccess,
}: VersionDialogProps) {
  const isEditing = !!version

  const form = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(versionFormSchema),
    defaultValues: {
      title: "",
      bodyFormat: "markdown",
      body: "",
    },
  })

  useEffect(() => {
    if (open && version) {
      form.reset({
        title: version.title,
        bodyFormat: version.bodyFormat as FormValues["bodyFormat"],
        body: version.body ?? "",
      })
    } else if (open) {
      form.reset()
    }
  }, [open, version, form])

  const onSubmit = async (values: FormOutput) => {
    const payload = {
      title: values.title,
      bodyFormat: values.bodyFormat,
      body: values.body || undefined,
    }

    if (isEditing) {
      await api.patch(`/v1/admin/legal/policies/versions/${version.id}`, payload)
    } else {
      await api.post(`/v1/admin/legal/policies/${policyId}/versions`, payload)
    }
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Version" : "New Version"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogBody className="grid gap-4">
            <div className="flex flex-col gap-2">
              <Label>Title</Label>
              <Input {...form.register("title")} placeholder="Version title" />
              {form.formState.errors.title && (
                <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label>Body Format</Label>
              <Select
                value={form.watch("bodyFormat")}
                onValueChange={(v) => form.setValue("bodyFormat", v as FormValues["bodyFormat"])}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BODY_FORMATS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Body</Label>
              <Textarea {...form.register("body")} placeholder="Policy content..." rows={10} />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Version"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
