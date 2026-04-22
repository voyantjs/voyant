"use client"

import type { Editor } from "@tiptap/core"
import {
  type NotificationTemplateRecord,
  useNotificationTemplateAuthoring,
  useNotificationTemplateMutation,
  useNotificationTemplateTools,
} from "@voyantjs/notifications-react"
import { Loader2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod/v4"

import { zodResolver } from "../lib/zod-resolver"
import { Button } from "./button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./index"
import { Input } from "./input"
import { Label } from "./label"
import { NotificationTemplateAuthoringHelp } from "./notification-template-authoring-help"
import { RichTextEditor } from "./rich-text-editor"
import { insertPlainText, insertVariableToken } from "./rich-text-variable-extension"
import { ScrollArea } from "./scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"
import { Switch } from "./switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs"
import { Textarea } from "./textarea"

const CHANNEL_ITEMS = [
  { label: "Email", value: "email" },
  { label: "SMS", value: "sms" },
] as const

const STATUS_ITEMS = [
  { label: "Draft", value: "draft" },
  { label: "Active", value: "active" },
  { label: "Archived", value: "archived" },
] as const

const templateFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Must be kebab-case"),
  channel: z.enum(["email", "sms"]),
  status: z.enum(["draft", "active", "archived"]).default("draft"),
  subjectTemplate: z.string().optional(),
  htmlTemplate: z.string().optional(),
  textTemplate: z.string().optional(),
  fromAddress: z.string().optional(),
  active: z.boolean(),
})

type FormValues = z.input<typeof templateFormSchema>
type FormOutput = z.output<typeof templateFormSchema>

type NotificationTemplateDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  template?: NotificationTemplateRecord
  onSuccess: () => void
}

type InsertionTarget = "subject" | "body" | "text"

function parsePath(path: string) {
  return path
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .filter(Boolean)
}

function setDeepValue(target: Record<string, unknown>, path: string, value: unknown) {
  const segments = parsePath(path)
  let current: unknown = target

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index]!
    const isLast = index === segments.length - 1
    const nextSegment = segments[index + 1]
    const nextIsIndex = nextSegment ? /^\d+$/.test(nextSegment) : false

    if (Array.isArray(current)) {
      const arrayIndex = Number(segment)
      if (Number.isNaN(arrayIndex)) return
      if (isLast) {
        current[arrayIndex] = value
        return
      }
      if (current[arrayIndex] == null) {
        current[arrayIndex] = nextIsIndex ? [] : {}
      }
      current = current[arrayIndex] as Record<string, unknown> | unknown[]
      continue
    }

    if (typeof current !== "object" || current == null) return
    const record = current as Record<string, unknown>
    if (isLast) {
      record[segment] = value
      return
    }
    if (record[segment] == null) {
      record[segment] = nextIsIndex ? [] : {}
    }
    current = record[segment] as Record<string, unknown> | unknown[]
  }
}

function buildSamplePayload(
  variableGroups: Array<{
    variables: Array<{ key: string; example: string }>
  }>,
) {
  const sample: Record<string, unknown> = {}
  for (const group of variableGroups) {
    for (const variable of group.variables) {
      setDeepValue(sample, variable.key, variable.example)
    }
  }
  return sample
}

function appendTemplateValue(current: string | undefined, addition: string) {
  if (!current?.trim()) return addition
  return `${current}${current.endsWith("\n") ? "" : "\n"}${addition}`
}

function variableReference(key: string) {
  return `{{ ${key} }}`
}

export function NotificationTemplateDialog({
  open,
  onOpenChange,
  template,
  onSuccess,
}: NotificationTemplateDialogProps) {
  const isEditing = Boolean(template)
  const { create, update } = useNotificationTemplateMutation()
  const { preview, testSend } = useNotificationTemplateTools()
  const { variableCatalog, liquidSnippets } = useNotificationTemplateAuthoring()
  const [editorInstance, setEditorInstance] = useState<Editor | null>(null)
  const [insertionTarget, setInsertionTarget] = useState<InsertionTarget>("body")
  const [previewDataInput, setPreviewDataInput] = useState("{}")
  const [testRecipient, setTestRecipient] = useState("")
  const variableGroups = useMemo(
    () =>
      variableCatalog.map((group) => ({
        ...group,
        variables: group.variables.map((variable) => ({
          ...variable,
          example: String(variable.example),
        })),
      })),
    [variableCatalog],
  )
  const defaultPreviewData = useMemo(
    () => JSON.stringify(buildSamplePayload(variableGroups), null, 2),
    [variableGroups],
  )

  const form = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      channel: "email",
      status: "draft",
      subjectTemplate: "",
      htmlTemplate: "",
      textTemplate: "",
      fromAddress: "",
      active: true,
    },
  })

  const channel = form.watch("channel")

  useEffect(() => {
    if (open && template) {
      form.reset({
        name: template.name,
        slug: template.slug,
        channel: template.channel,
        status: template.status,
        subjectTemplate: template.subjectTemplate ?? "",
        htmlTemplate: template.htmlTemplate ?? "",
        textTemplate: template.textTemplate ?? "",
        fromAddress: template.fromAddress ?? "",
        active: template.status === "active",
      })
      return
    }

    if (open) {
      form.reset()
    }
  }, [open, template, form])

  useEffect(() => {
    if (!open) return
    setInsertionTarget((current) =>
      channel === "sms" ? "text" : current === "text" ? "body" : current,
    )
  }, [channel, open])

  useEffect(() => {
    if (!open) return
    setPreviewDataInput(defaultPreviewData)
    setTestRecipient("")
    preview.reset()
    testSend.reset()
  }, [defaultPreviewData, open, preview, testSend])

  const onSubmit = async (values: FormOutput) => {
    const payload = {
      name: values.name,
      slug: values.slug,
      channel: values.channel,
      provider: null,
      status: values.active ? (values.status === "archived" ? "active" : values.status) : "draft",
      subjectTemplate: values.channel === "email" ? values.subjectTemplate || null : null,
      htmlTemplate: values.channel === "email" ? values.htmlTemplate || null : null,
      textTemplate: values.textTemplate || null,
      fromAddress: values.channel === "email" ? values.fromAddress || null : null,
      isSystem: template?.isSystem ?? false,
      metadata: template?.metadata ?? null,
    }

    if (isEditing && template) {
      await update.mutateAsync({ id: template.id, input: payload })
    } else {
      await create.mutateAsync(payload)
    }

    onSuccess()
  }

  const isPending = create.isPending || update.isPending

  const parsePreviewData = () => {
    try {
      const parsed = previewDataInput.trim() ? JSON.parse(previewDataInput) : {}
      if (typeof parsed !== "object" || parsed == null || Array.isArray(parsed)) {
        throw new Error("Preview data must be a JSON object.")
      }
      return parsed as Record<string, unknown>
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Preview data is invalid JSON.")
    }
  }

  const insertIntoTarget = (content: string, kind: "variable" | "snippet") => {
    if (insertionTarget === "body" && channel === "email" && editorInstance) {
      if (kind === "variable") {
        insertVariableToken(editorInstance, content)
      } else {
        insertPlainText(editorInstance, content)
      }
      return
    }

    const fieldName = insertionTarget === "subject" ? "subjectTemplate" : "textTemplate"
    const current = form.getValues(fieldName) ?? ""
    const nextValue =
      kind === "variable"
        ? `${current}${current ? " " : ""}${variableReference(content)}`
        : appendTemplateValue(current, content)
    form.setValue(fieldName, nextValue, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })
  }

  const handlePreview = async () => {
    try {
      const data = parsePreviewData()
      await preview.mutateAsync({
        channel,
        provider: null,
        fromAddress: channel === "email" ? form.getValues("fromAddress") || null : null,
        subjectTemplate: channel === "email" ? form.getValues("subjectTemplate") || null : null,
        htmlTemplate: channel === "email" ? form.getValues("htmlTemplate") || null : null,
        textTemplate: form.getValues("textTemplate") || null,
        data,
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Preview failed")
    }
  }

  const handleTestSend = async () => {
    if (!testRecipient.trim()) {
      toast.error(
        channel === "email" ? "Recipient email is required." : "Recipient phone is required.",
      )
      return
    }

    try {
      const data = parsePreviewData()
      await testSend.mutateAsync({
        to: testRecipient.trim(),
        channel,
        provider: null,
        from: channel === "email" ? form.getValues("fromAddress") || null : null,
        subject: channel === "email" ? form.getValues("subjectTemplate") || null : null,
        html: channel === "email" ? form.getValues("htmlTemplate") || null : null,
        text: form.getValues("textTemplate") || null,
        data,
        targetType: "other",
      })
      toast.success(`Test ${channel === "email" ? "email" : "SMS"} queued successfully.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Test send failed")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl" className="h-[calc(100vh-2rem)]">
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden"
        >
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Notification Template" : "New Notification Template"}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="min-h-0 flex-1">
            <div className="grid gap-4 py-4 pr-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Name</Label>
                  <Input {...form.register("name")} placeholder="Booking confirmation" />
                  {form.formState.errors.name ? (
                    <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                  ) : null}
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Slug</Label>
                  <Input {...form.register("slug")} placeholder="booking-confirmation" />
                  {form.formState.errors.slug ? (
                    <p className="text-xs text-destructive">{form.formState.errors.slug.message}</p>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Channel</Label>
                  <Select
                    items={CHANNEL_ITEMS}
                    value={form.watch("channel")}
                    onValueChange={(value) => {
                      if (!value) return
                      form.setValue("channel", value as FormValues["channel"])
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CHANNEL_ITEMS.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Status</Label>
                  <Select
                    items={STATUS_ITEMS}
                    value={form.watch("status")}
                    onValueChange={(value) => {
                      if (!value) return
                      form.setValue("status", value as FormValues["status"])
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_ITEMS.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {channel === "email" ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label>From address</Label>
                      <Input
                        {...form.register("fromAddress")}
                        placeholder="reservations@example.com"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>Subject</Label>
                      <Input
                        {...form.register("subjectTemplate")}
                        placeholder="Your booking {{ booking.reference }}"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label>HTML body</Label>
                    <RichTextEditor
                      value={form.watch("htmlTemplate") ?? ""}
                      onChange={(value) =>
                        form.setValue("htmlTemplate", value, {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true,
                        })
                      }
                      placeholder="Compose the email body using Liquid variables..."
                      enableVariables
                      onEditorReady={setEditorInstance}
                    />
                  </div>
                </>
              ) : null}

              <div className="flex flex-col gap-2">
                <Label>{channel === "sms" ? "SMS body" : "Plain-text fallback"}</Label>
                <Textarea
                  {...form.register("textTemplate")}
                  placeholder={
                    channel === "sms"
                      ? 'Hi {{ traveler.firstName | default: "traveler" }}, your booking is confirmed.'
                      : "Optional plain-text version for email clients."
                  }
                  rows={6}
                  className="font-mono text-xs"
                />
              </div>

              <Tabs defaultValue="authoring">
                <TabsList className="w-full">
                  <TabsTrigger value="authoring">Authoring</TabsTrigger>
                  <TabsTrigger value="preview">Preview & Test</TabsTrigger>
                </TabsList>

                <TabsContent value="authoring" className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[180px_1fr] sm:items-center">
                    <div className="flex flex-col gap-1.5">
                      <Label>Insert into</Label>
                      <Select
                        items={[
                          ...(channel === "email"
                            ? [
                                { label: "Subject", value: "subject" },
                                { label: "HTML body", value: "body" },
                              ]
                            : []),
                          {
                            label: channel === "sms" ? "SMS body" : "Plain-text fallback",
                            value: "text",
                          },
                        ]}
                        value={insertionTarget}
                        onValueChange={(value) => {
                          if (!value) return
                          setInsertionTarget(value as InsertionTarget)
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {channel === "email" ? (
                            <SelectItem value="subject">Subject</SelectItem>
                          ) : null}
                          {channel === "email" ? (
                            <SelectItem value="body">HTML body</SelectItem>
                          ) : null}
                          <SelectItem value="text">
                            {channel === "sms" ? "SMS body" : "Plain-text fallback"}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Variables insert as Liquid tags in text fields and as inline chips in the
                      rich-text HTML body.
                    </p>
                  </div>

                  <NotificationTemplateAuthoringHelp
                    variableGroups={variableGroups}
                    snippets={liquidSnippets}
                    onInsertVariable={(variable) => insertIntoTarget(variable.key, "variable")}
                    onInsertSnippet={(snippet) => insertIntoTarget(snippet.code, "snippet")}
                  />
                </TabsContent>

                <TabsContent value="preview" className="mt-4 space-y-4">
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="space-y-4">
                      <div className="flex flex-col gap-2">
                        <Label>Preview data (JSON)</Label>
                        <Textarea
                          value={previewDataInput}
                          onChange={(event) => setPreviewDataInput(event.target.value)}
                          rows={14}
                          className="font-mono text-xs"
                          placeholder='{"booking":{"reference":"BKG-2026-00125"}}'
                        />
                        <p className="text-xs text-muted-foreground">
                          Use sample JSON to preview Liquid rendering and send a safe test message.
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handlePreview}
                          disabled={preview.isPending}
                        >
                          {preview.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          Refresh Preview
                        </Button>
                      </div>

                      <div className="space-y-3 rounded-md border p-4">
                        <div className="text-sm font-medium">Rendered preview</div>

                        {channel === "email" ? (
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                Subject
                              </div>
                              <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm">
                                {preview.data?.subject || "No subject rendered yet."}
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                HTML body
                              </div>
                              <div className="rounded-md border bg-background">
                                {preview.data?.html ? (
                                  <div
                                    className="prose prose-sm max-w-none px-3 py-3 dark:prose-invert"
                                    // biome-ignore lint/security/noDangerouslySetInnerHtml: Preview HTML is generated server-side for template preview.
                                    dangerouslySetInnerHTML={{ __html: preview.data.html }}
                                  />
                                ) : (
                                  <div className="px-3 py-3 text-sm text-muted-foreground">
                                    No HTML content rendered yet.
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                Plain-text fallback
                              </div>
                              <pre className="whitespace-pre-wrap rounded-md border bg-muted/20 px-3 py-3 text-xs">
                                {preview.data?.text || "No plain-text content rendered yet."}
                              </pre>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="text-xs uppercase tracking-wide text-muted-foreground">
                              SMS body
                            </div>
                            <pre className="whitespace-pre-wrap rounded-md border bg-muted/20 px-3 py-3 text-xs">
                              {preview.data?.text || "No SMS content rendered yet."}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4 rounded-md border p-4">
                      <div className="space-y-1">
                        <div className="text-sm font-medium">Test send</div>
                        <p className="text-xs text-muted-foreground">
                          Sends the current unsaved content through the configured provider path.
                        </p>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label>{channel === "email" ? "Recipient email" : "Recipient phone"}</Label>
                        <Input
                          value={testRecipient}
                          onChange={(event) => setTestRecipient(event.target.value)}
                          placeholder={channel === "email" ? "qa@example.com" : "+40 721 111 222"}
                        />
                      </div>

                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div>Provider is selected automatically by the app runtime.</div>
                        {channel === "email" ? (
                          <div>From: {form.watch("fromAddress") || "Default sender"}</div>
                        ) : null}
                      </div>

                      <Button
                        type="button"
                        className="w-full"
                        onClick={handleTestSend}
                        disabled={testSend.isPending}
                      >
                        {testSend.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Send Test {channel === "email" ? "Email" : "SMS"}
                      </Button>

                      {testSend.data ? (
                        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                          Delivery queued with status <strong>{testSend.data.status}</strong>
                          {testSend.data.provider ? ` via ${testSend.data.provider}` : ""}.
                        </div>
                      ) : null}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex items-center gap-3">
                <Switch
                  checked={form.watch("active")}
                  onCheckedChange={(checked) => form.setValue("active", checked)}
                />
                <Label className="cursor-pointer">Mark template active after saving</Label>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="mt-0">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isEditing ? "Save Changes" : "Create Template"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
