"use client"

import {
  type NotificationReminderRuleRecord,
  useNotificationReminderRules,
} from "@voyantjs/notifications-react"
import { Loader2, Pencil, Plus, Search } from "lucide-react"
import { useState } from "react"

import {
  Badge,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui"
import { NotificationReminderRuleDialog } from "./reminder-rule-dialog"

export function NotificationReminderRulesPage() {
  const [search, setSearch] = useState("")
  const [channel, setChannel] = useState<string>("all")
  const [status, setStatus] = useState<string>("all")
  const [targetType, setTargetType] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<NotificationReminderRuleRecord | undefined>()
  const { data, isPending, refetch } = useNotificationReminderRules({
    search,
    channel,
    status,
    targetType,
  })

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reminder Rules</h1>
          <p className="text-sm text-muted-foreground">
            Schedule invoice and payment reminders against templates and channel-specific providers.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(undefined)
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Rule
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search rules..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={targetType} onValueChange={setTargetType}>
          <SelectTrigger className="w-[190px]">
            <SelectValue placeholder="Target" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All targets</SelectItem>
            <SelectItem value="booking_payment_schedule">Booking payment schedule</SelectItem>
            <SelectItem value="invoice">Invoice</SelectItem>
          </SelectContent>
        </Select>
        <Select value={channel} onValueChange={setChannel}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Channel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All channels</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isPending ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : null}

      {!isPending && (!data?.data || data.data.length === 0) ? (
        <div className="rounded-md border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">No reminder rules yet.</p>
        </div>
      ) : null}

      {!isPending && data?.data && data.data.length > 0 ? (
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Rule</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Channel</th>
                <th className="px-4 py-3">Provider</th>
                <th className="px-4 py-3">Offset</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((rule) => (
                <tr key={rule.id} className="border-t">
                  <td className="px-4 py-3">
                    <div className="font-medium">{rule.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">{rule.slug}</div>
                  </td>
                  <td className="px-4 py-3">{rule.targetType}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{rule.channel}</Badge>
                  </td>
                  <td className="px-4 py-3">{rule.provider ?? "Automatic"}</td>
                  <td className="px-4 py-3">{rule.relativeDaysFromDueDate} days</td>
                  <td className="px-4 py-3">
                    <Badge variant={rule.status === "active" ? "default" : "secondary"}>
                      {rule.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditing(rule)
                        setDialogOpen(true)
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <NotificationReminderRuleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        rule={editing}
        onSuccess={() => {
          setDialogOpen(false)
          setEditing(undefined)
          void refetch()
        }}
      />
    </div>
  )
}
