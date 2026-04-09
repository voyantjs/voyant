"use client"

import { type BookingActivityRecord, useBookingActivity } from "@voyantjs/bookings-react"
import { Activity, Clock, Pencil, Plus, RefreshCw, UserPlus } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui"

export interface BookingActivityTimelineProps {
  bookingId: string
}

const activityIcons: Record<string, typeof Activity> = {
  booking_created: Plus,
  booking_converted: RefreshCw,
  status_change: Clock,
  supplier_update: RefreshCw,
  passenger_update: UserPlus,
  note_added: Pencil,
}

export function BookingActivityTimeline({ bookingId }: BookingActivityTimelineProps) {
  const { data } = useBookingActivity(bookingId)
  const entries = data?.data ?? []

  return (
    <Card data-slot="booking-activity-timeline">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Activity Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No activity yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {entries.map((entry) => {
              const Icon = activityIcons[entry.activityType] ?? Activity
              return <ActivityTimelineItem key={entry.id} entry={entry} Icon={Icon} />
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ActivityTimelineItem({
  entry,
  Icon,
}: {
  entry: BookingActivityRecord
  Icon: typeof Activity
}) {
  return (
    <div className="flex items-start gap-3 rounded-md border p-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-sm">{entry.description}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {entry.actorId && entry.actorId !== "system" ? `By ${entry.actorId} - ` : ""}
          {new Date(entry.createdAt).toLocaleString()}
        </p>
      </div>
    </div>
  )
}
