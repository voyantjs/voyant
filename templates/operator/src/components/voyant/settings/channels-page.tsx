"use client"

import { type ChannelRow, useChannelMutation, useChannels } from "@voyantjs/distribution-react"
import { Loader2, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod/v4"

import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui"
import { zodResolver } from "@/lib/zod-resolver"

const PAGE_SIZE = 25

const CHANNEL_KINDS = [
  { value: "direct", label: "Direct" },
  { value: "affiliate", label: "Affiliate" },
  { value: "ota", label: "OTA" },
  { value: "reseller", label: "Reseller" },
  { value: "marketplace", label: "Marketplace" },
  { value: "api_partner", label: "API Partner" },
] as const

const channelFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  kind: z.enum(["direct", "affiliate", "ota", "reseller", "marketplace", "api_partner"]),
  status: z.enum(["active", "inactive", "pending", "archived"]),
  website: z.string().url("Must be a valid URL").optional().nullable().or(z.literal("")),
  contactName: z.string().optional().nullable(),
  contactEmail: z.string().email("Must be a valid email").optional().nullable().or(z.literal("")),
})

type ChannelFormValues = z.input<typeof channelFormSchema>
type ChannelFormOutput = z.output<typeof channelFormSchema>

export function ChannelsPage() {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<ChannelRow | undefined>()
  const [pageIndex, setPageIndex] = useState(0)
  const { data, isPending, refetch } = useChannels({
    limit: PAGE_SIZE,
    offset: pageIndex * PAGE_SIZE,
  })
  const { remove } = useChannelMutation()

  const channels = data?.data ?? []
  const total = data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Channels</h2>
          <p className="text-sm text-muted-foreground">
            Define where your products are sold: direct, OTA, reseller, and marketplace channels.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditing(undefined)
            setSheetOpen(true)
          }}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Channel
        </Button>
      </div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        {isPending ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : channels.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No channels yet. Create channels like Website, Mobile App, or Viator to control where
            products are sold.
          </p>
        ) : (
          <div className="flex flex-col divide-y">
            {channels.map((channel) => (
              <div key={channel.id} className="flex items-center justify-between px-6 py-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{channel.name}</span>
                    <Badge variant="outline" className="text-xs capitalize">
                      {channel.kind.replace("_", " ")}
                    </Badge>
                    {channel.status !== "active" ? (
                      <Badge variant="secondary" className="text-xs capitalize">
                        {channel.status}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {channel.website ? <span>{channel.website}</span> : null}
                    {channel.contactName ? <span>{channel.contactName}</span> : null}
                    {channel.contactEmail ? <span>{channel.contactEmail}</span> : null}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setEditing(channel)
                        setSheetOpen(true)
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => {
                        if (
                          confirm("Delete this channel? Products assigned to it will be unlinked.")
                        ) {
                          remove.mutate(channel.id, { onSuccess: () => void refetch() })
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {channels.length} of {total}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pageIndex === 0}
            onClick={() => setPageIndex((current) => Math.max(0, current - 1))}
          >
            Previous
          </Button>
          <span>
            Page {pageIndex + 1} / {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={(pageIndex + 1) * PAGE_SIZE >= total}
            onClick={() => setPageIndex((current) => current + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      <ChannelSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        channel={editing}
        onSuccess={() => {
          setSheetOpen(false)
          setEditing(undefined)
          void refetch()
        }}
      />
    </div>
  )
}

function ChannelSheet({
  open,
  onOpenChange,
  channel,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  channel?: ChannelRow
  onSuccess: () => void
}) {
  const isEditing = !!channel
  const { create, update } = useChannelMutation()

  const form = useForm<ChannelFormValues, unknown, ChannelFormOutput>({
    resolver: zodResolver(channelFormSchema),
    defaultValues: {
      name: "",
      kind: "direct",
      status: "active",
      website: "",
      contactName: "",
      contactEmail: "",
    },
  })

  useEffect(() => {
    if (open && channel) {
      form.reset({
        name: channel.name,
        kind: channel.kind,
        status: channel.status,
        website: channel.website ?? "",
        contactName: channel.contactName ?? "",
        contactEmail: channel.contactEmail ?? "",
      })
    } else if (open) {
      form.reset()
    }
  }, [open, channel, form])

  const isSubmitting = create.isPending || update.isPending

  const onSubmit = async (values: ChannelFormOutput) => {
    const payload = {
      name: values.name,
      kind: values.kind,
      status: values.status,
      website: values.website || null,
      contactName: values.contactName || null,
      contactEmail: values.contactEmail || null,
    }

    if (isEditing) {
      await update.mutateAsync({ id: channel.id, input: payload })
    } else {
      await create.mutateAsync(payload)
    }
    onSuccess()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" size="lg">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Edit Channel" : "New Channel"}</SheetTitle>
        </SheetHeader>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <SheetBody className="grid gap-4">
            <div className="flex flex-col gap-2">
              <Label>Name</Label>
              <Input {...form.register("name")} placeholder="Website" autoFocus />
              {form.formState.errors.name ? (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Kind</Label>
                <Select
                  value={form.watch("kind")}
                  onValueChange={(value) =>
                    form.setValue("kind", value as ChannelFormValues["kind"])
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHANNEL_KINDS.map((kind) => (
                      <SelectItem key={kind.value} value={kind.value}>
                        {kind.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Status</Label>
                <Select
                  value={form.watch("status")}
                  onValueChange={(value) =>
                    form.setValue("status", value as ChannelFormValues["status"])
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Website</Label>
              <Input {...form.register("website")} placeholder="https://partner.example.com" />
              {form.formState.errors.website ? (
                <p className="text-xs text-destructive">{form.formState.errors.website.message}</p>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Primary Contact</Label>
                <Input {...form.register("contactName")} placeholder="Jane Doe" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Contact Email</Label>
                <Input {...form.register("contactEmail")} placeholder="partner@example.com" />
                {form.formState.errors.contactEmail ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.contactEmail.message}
                  </p>
                ) : null}
              </div>
            </div>
          </SheetBody>
          <SheetFooter>
            <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isEditing ? "Save Changes" : "Create Channel"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
