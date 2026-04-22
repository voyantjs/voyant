import { useNavigate } from "@tanstack/react-router"

import { useAdminMessages } from "@/lib/admin-i18n"
import { BookingList } from "./booking-list"

export function BookingsPage() {
  const bookingMessages = useAdminMessages().bookings.list
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{bookingMessages.pageTitle}</h1>
        <p className="text-sm text-muted-foreground">{bookingMessages.pageDescription}</p>
      </div>

      <BookingList
        onSelectBooking={(booking) => {
          void navigate({ to: "/bookings/$id", params: { id: booking.id } })
        }}
      />
    </div>
  )
}
