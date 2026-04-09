import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { defaultFetcher, getBookingsQueryOptions } from "@voyantjs/bookings-react"

import { BookingList } from "@/components/voyant/bookings/booking-list"
import { getApiUrl } from "@/lib/env"

export const Route = createFileRoute("/_workspace/bookings/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(
      getBookingsQueryOptions({ baseUrl: getApiUrl(), fetcher: defaultFetcher }),
    ),
  component: BookingsPage,
})

function BookingsPage() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bookings</h1>
        <p className="text-sm text-muted-foreground">
          Manage bookings, confirmations, and travelers.
        </p>
      </div>

      <BookingList
        onSelectBooking={(booking) => {
          void navigate({ to: "/bookings/$id", params: { id: booking.id } })
        }}
      />
    </div>
  )
}
