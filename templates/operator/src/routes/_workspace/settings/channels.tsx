import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
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
import { api } from "@/lib/api-client"
import { zodResolver } from "@/lib/zod-resolver"

export const Route = createFileRoute("/_workspace/settings/channels")({
  loader: ({ context }) => context.queryClient.ensureQueryData(getChannelsQueryOptions()),
  component: ChannelsPage,
})

type Channel = {
  id: string
  name: string
  description: string | null
  kind: string
  status: string
}

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
  description: z.string().optional().nullable(),
  kind: z.enum(["direct", "affiliate", "ota", "reseller", "marketplace", "api_partner"]),
  status: z.enum(["active", "inactive", "pending", "archived"]),
})

type ChannelFormValues = z.input<typeof channelFormSchema>
type ChannelFormOutput = z.output<typeof channelFormSchema>

function getChannelsQueryOptions() {
  return queryOptions({
    queryKey: ["channels"],
    queryFn: () => api.get<{ data: Channel[] }>("/v1/distribution/channels?limit=200"),
  })
}

function ChannelSheet({
  open,
  onOpenChange,
  channel,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  channel?: Channel
  onSuccess: () => void
}) {
  const isEditing = !!channel

  const form = useForm<ChannelFormValues, unknown, ChannelFormOutput>({
    resolver: zodResolver(channelFormSchema),
    defaultValues: {
      name: "",
      description: "",
      kind: "direct",
      status: "active",
    },
  })

  useEffect(() => {
    if (open && channel) {
      form.reset({
        name: channel.name,
        description: channel.description ?? "",
        kind: channel.kind as ChannelFormValues["kind"],
        status: channel.status as ChannelFormValues["status"],
      })
    } else if (open) {
      form.reset()
    }
  }, [open, channel, form])

  const onSubmit = async (values: ChannelFormOutput) => {
    const payload = {
      name: values.name,
      description: values.description || null,
      kind: values.kind,
      status: values.status,
    }

    if (isEditing) {
      await api.patch(`/v1/distribution/channels/${channel.id}`, payload)
    } else {
      await api.post("/v1/distribution/channels", payload)
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
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label>Description</Label>
              <Input {...form.register("description")} placeholder="Main company website" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Kind</Label>
                <Select
                  value={form.watch("kind")}
                  onValueChange={(v) => form.setValue("kind", v as ChannelFormValues["kind"])}
                  items={CHANNEL_KINDS}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHANNEL_KINDS.map((k) => (
                      <SelectItem key={k.value} value={k.value}>
                        {k.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Status</Label>
                <Select
                  value={form.watch("status")}
                  onValueChange={(v) => form.setValue("status", v as ChannelFormValues["status"])}
                  items={[
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                    { value: "pending", label: "Pending" },
                    { value: "archived", label: "Archived" },
                  ]}
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
          </SheetBody>
          <SheetFooter>
            <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Channel"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

function ChannelsPage() {
  const queryClient = useQueryClient()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Channel | undefined>()

  const { data, isPending } = useQuery(getChannelsQueryOptions())

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/distribution/channels/${id}`),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["channels"] }),
  })

  const channels = data?.data ?? []

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Channels</h2>
          <p className="text-sm text-muted-foreground">
            Define where your products are sold — website, mobile app, OTAs, resellers.
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
            {channels.map((ch) => (
              <div key={ch.id} className="flex items-center justify-between px-6 py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{ch.name}</span>
                    <Badge variant="outline" className="text-xs capitalize">
                      {ch.kind.replace("_", " ")}
                    </Badge>
                    {ch.status !== "active" && (
                      <Badge variant="secondary" className="text-xs capitalize">
                        {ch.status}
                      </Badge>
                    )}
                  </div>
                  {ch.description && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{ch.description}</p>
                  )}
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
                        setEditing(ch)
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
                          deleteMutation.mutate(ch.id)
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

      <ChannelSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        channel={editing}
        onSuccess={() => {
          setSheetOpen(false)
          setEditing(undefined)
          void queryClient.invalidateQueries({ queryKey: ["channels"] })
        }}
      />
    </div>
  )
}
