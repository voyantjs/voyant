import { Link } from "@tanstack/react-router"
import { describeRRule } from "@voyantjs/availability/rrule"
import { MoreHorizontal, Pencil, Plus, Star, Trash2, Upload } from "lucide-react"
import type { ReactNode } from "react"
import { useRef } from "react"
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui"
import { Separator } from "@/components/ui/separator"
import type { DepartureSlot } from "./product-departure-dialog"

import {
  type AvailabilityRule,
  type ChannelInfo,
  type ChannelProductMapping,
  formatAmount,
  formatCapacity,
  formatDuration,
  formatMargin,
  formatSlotDate,
  formatSlotTime,
  type ProductMediaItem,
  type ProductRecord,
  slotStatusVariant,
} from "./product-detail-shared"

export function Section({
  title,
  actions,
  children,
  contentClassName,
}: {
  title: string
  actions?: ReactNode
  children: ReactNode
  contentClassName?: string
}) {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="flex items-center justify-between px-6 py-4">
        <h2 className="font-semibold leading-none tracking-tight">{title}</h2>
        {actions}
      </div>
      <Separator />
      <div className={contentClassName ?? "px-6 py-4"}>{children}</div>
    </div>
  )
}

export function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 text-sm [&:not(:last-child)]:border-b">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  )
}

export function ActionMenu({ children }: { children: ReactNode }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">{children}</DropdownMenuContent>
    </DropdownMenu>
  )
}

export function EmptyState({ message }: { message: string }) {
  return <p className="py-6 text-center text-sm text-muted-foreground">{message}</p>
}

export function ProductDetailsSection({
  product,
  onEdit,
}: {
  product: ProductRecord
  onEdit: () => void
}) {
  return (
    <Section
      title="Product Details"
      actions={
        <ActionMenu>
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="h-4 w-4" />
            Edit
          </DropdownMenuItem>
        </ActionMenu>
      }
    >
      {product.description ? (
        <div className="border-b pb-3 text-sm whitespace-pre-line text-muted-foreground">
          {product.description}
        </div>
      ) : null}
      {product.sellAmountCents != null ? (
        <DetailRow
          label="Sell"
          value={
            <span className="font-mono">
              {formatAmount(product.sellAmountCents, product.sellCurrency)}
            </span>
          }
        />
      ) : null}
      {product.costAmountCents != null ? (
        <DetailRow
          label="Cost"
          value={
            <span className="font-mono">
              {formatAmount(product.costAmountCents, product.sellCurrency)}
            </span>
          }
        />
      ) : null}
      {product.marginPercent != null ? (
        <DetailRow
          label="Margin"
          value={<span className="font-mono">{formatMargin(product.marginPercent)}</span>}
        />
      ) : null}
      <DetailRow
        label="Currency"
        value={<span className="font-mono">{product.sellCurrency}</span>}
      />
    </Section>
  )
}

export function ProductDeparturesSection({
  slots,
  onCreate,
  onEdit,
  onDelete,
}: {
  slots: DepartureSlot[]
  onCreate: () => void
  onEdit: (slot: DepartureSlot) => void
  onDelete: (slotId: string) => void
}) {
  return (
    <Section
      title="Departures"
      actions={
        <ActionMenu>
          <DropdownMenuItem onClick={onCreate}>
            <Plus className="h-4 w-4" />
            New Departure
          </DropdownMenuItem>
        </ActionMenu>
      }
      contentClassName=""
    >
      {slots.length === 0 ? (
        <EmptyState message="No departures yet. Add a departure or create a recurring schedule." />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th className="py-2.5 pl-6 pr-3 text-left font-medium">Start</th>
              <th className="px-3 py-2.5 text-left font-medium">End</th>
              <th className="px-3 py-2.5 text-left font-medium">Duration</th>
              <th className="px-3 py-2.5 text-left font-medium">Status</th>
              <th className="px-3 py-2.5 text-left font-medium">Capacity</th>
              <th className="w-10 px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {slots.map((slot) => (
              <tr key={slot.id} className="border-b last:border-b-0">
                <td className="py-2.5 pl-6 pr-3">
                  <div className="font-mono text-xs">{slot.dateLocal}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatSlotTime(slot.startsAt)}
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  {slot.endsAt ? (
                    <>
                      <div className="font-mono text-xs">{formatSlotDate(slot.endsAt)}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatSlotTime(slot.endsAt)}
                      </div>
                    </>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-xs">{formatDuration(slot)}</td>
                <td className="px-3 py-2.5">
                  <Badge variant={slotStatusVariant[slot.status]} className="text-xs capitalize">
                    {slot.status.replace("_", " ")}
                  </Badge>
                </td>
                <td className="px-3 py-2.5 font-mono text-xs">{formatCapacity(slot)}</td>
                <td className="px-3 py-2.5">
                  <ActionMenu>
                    <DropdownMenuItem onClick={() => onEdit(slot)}>
                      <Pencil className="h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onClick={() => onDelete(slot.id)}>
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </ActionMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Section>
  )
}

export function ProductSchedulesSection({
  rules,
  onCreate,
  onEdit,
  onDelete,
}: {
  rules: AvailabilityRule[]
  onCreate: () => void
  onEdit: (rule: AvailabilityRule) => void
  onDelete: (ruleId: string) => void
}) {
  return (
    <Section
      title="Recurring Schedules"
      actions={
        <ActionMenu>
          <DropdownMenuItem onClick={onCreate}>
            <Plus className="h-4 w-4" />
            New Schedule
          </DropdownMenuItem>
        </ActionMenu>
      }
    >
      {rules.length === 0 ? (
        <EmptyState message="No recurring schedules. Define a rule to auto-generate departures." />
      ) : (
        <div className="flex flex-col divide-y">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{describeRRule(rule.recurrenceRule)}</span>
                  {!rule.active ? (
                    <Badge variant="outline" className="text-xs">
                      inactive
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Max {rule.maxCapacity} pax · {rule.timezone}
                  {rule.cutoffMinutes != null ? ` · cutoff ${rule.cutoffMinutes}m` : ""}
                </p>
              </div>
              <ActionMenu>
                <DropdownMenuItem onClick={() => onEdit(rule)}>
                  <Pencil className="h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => onDelete(rule.id)}>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </ActionMenu>
            </div>
          ))}
        </div>
      )}
    </Section>
  )
}

export function ProductChannelsSection({
  allChannels,
  mappings,
  onAddChannel,
  onRemoveChannel,
}: {
  allChannels: ChannelInfo[]
  mappings: ChannelProductMapping[]
  onAddChannel: (channelId: string) => void
  onRemoveChannel: (mappingId: string) => void
}) {
  const assignedChannelIds = new Set(mappings.map((mapping) => mapping.channelId))
  const assignedChannels = allChannels.filter((channel) => assignedChannelIds.has(channel.id))
  const unassignedChannels = allChannels.filter(
    (channel) => !assignedChannelIds.has(channel.id) && channel.status === "active",
  )

  return (
    <Section title="Channels">
      <div className="flex flex-col gap-3">
        {assignedChannels.length === 0 ? (
          <p className="text-sm text-muted-foreground">Not assigned to any channels yet.</p>
        ) : (
          <div className="flex flex-col divide-y">
            {assignedChannels.map((channel) => {
              const mapping = mappings.find((entry) => entry.channelId === channel.id)
              return (
                <div
                  key={channel.id}
                  className="flex items-center justify-between py-2 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{channel.name}</span>
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {channel.kind.replace("_", " ")}
                    </Badge>
                  </div>
                  {mapping ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => onRemoveChannel(mapping.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  ) : null}
                </div>
              )
            })}
          </div>
        )}
        {unassignedChannels.length > 0 ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add Channel
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {unassignedChannels.map((channel) => (
                <DropdownMenuItem key={channel.id} onClick={() => onAddChannel(channel.id)}>
                  {channel.name}
                  <span className="ml-auto text-xs capitalize text-muted-foreground">
                    {channel.kind.replace("_", " ")}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
        {allChannels.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No channels defined yet.{" "}
            <Link to="/settings/channels" className="underline">
              Create channels in Settings
            </Link>
          </p>
        ) : null}
      </div>
    </Section>
  )
}

export function ProductOrganizeSection({
  product,
  onEdit,
}: {
  product: ProductRecord
  onEdit: () => void
}) {
  return (
    <Section
      title="Organize"
      actions={
        <ActionMenu>
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="h-4 w-4" />
            Edit
          </DropdownMenuItem>
        </ActionMenu>
      }
    >
      <DetailRow
        label="Tags"
        value={
          product.tags.length > 0 ? (
            <div className="flex flex-wrap justify-end gap-1">
              {product.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          )
        }
      />
      <DetailRow
        label="Type"
        value={<span className="capitalize">{product.bookingMode.replace("_", " ")}</span>}
      />
    </Section>
  )
}

export function ProductMediaSection({
  media,
  isUploading,
  onUpload,
  onSetCover,
  onDelete,
}: {
  media: ProductMediaItem[]
  isUploading: boolean
  onUpload: (file: File) => void
  onSetCover: (mediaId: string) => void
  onDelete: (mediaId: string) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <Section
      title="Media"
      actions={
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mr-1.5 h-3.5 w-3.5" />
          Upload
        </Button>
      }
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) {
            onUpload(file)
            event.target.value = ""
          }
        }}
      />
      {media.length === 0 ? (
        <EmptyState message="No media yet. Upload images or videos." />
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {media.map((item) => (
            <div
              key={item.id}
              className="group relative aspect-square overflow-hidden rounded-md border"
            >
              {item.mediaType === "image" ? (
                <img
                  src={item.url}
                  alt={item.altText ?? item.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted text-xs text-muted-foreground">
                  {item.mediaType}
                </div>
              )}
              {item.isCover ? (
                <div className="absolute left-1 top-1">
                  <Badge variant="secondary" className="px-1 py-0 text-[10px]">
                    <Star className="mr-0.5 h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                    Cover
                  </Badge>
                </div>
              ) : null}
              <div className="absolute inset-0 flex items-end justify-center gap-1 bg-black/0 pb-1.5 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
                {!item.isCover ? (
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => onSetCover(item.id)}
                    title="Set as cover"
                  >
                    <Star className="h-3 w-3" />
                  </Button>
                ) : null}
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onDelete(item.id)}
                  title="Delete"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Section>
  )
}
