"use client"

import {
  type UseNotificationDeliveriesOptions,
  useNotificationDeliveries,
} from "@voyantjs/notifications-react"
import { Loader2 } from "lucide-react"
import { useState } from "react"

import { Badge } from "./badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"

export function NotificationDeliveriesPage() {
  const [channel, setChannel] = useState<UseNotificationDeliveriesOptions["channel"] | "all">("all")
  const [status, setStatus] = useState<UseNotificationDeliveriesOptions["status"] | "all">("all")
  const { data, isPending } = useNotificationDeliveries({
    channel: channel === "all" ? undefined : channel,
    status: status === "all" ? undefined : status,
    limit: 50,
    offset: 0,
  })

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Deliveries</h1>
        <p className="text-sm text-muted-foreground">
          Review notification delivery attempts, rendered payloads, and provider-level outcomes.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Select value={channel} onValueChange={(value) => setChannel(value ?? "all")}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Channel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All channels</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(value) => setStatus(value ?? "all")}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
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
          <p className="text-sm text-muted-foreground">No deliveries yet.</p>
        </div>
      ) : null}

      {!isPending && data?.data && data.data.length > 0 ? (
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">To</th>
                <th className="px-4 py-3">Template</th>
                <th className="px-4 py-3">Channel</th>
                <th className="px-4 py-3">Provider</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((delivery) => (
                <tr key={delivery.id} className="border-t">
                  <td className="px-4 py-3">
                    <div>{delivery.toAddress}</div>
                    {delivery.subject ? (
                      <div className="text-xs text-muted-foreground">{delivery.subject}</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {delivery.templateSlug ?? "direct"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{delivery.channel}</Badge>
                  </td>
                  <td className="px-4 py-3">{delivery.provider}</td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        delivery.status === "sent"
                          ? "default"
                          : delivery.status === "failed"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {delivery.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{new Date(delivery.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  )
}
