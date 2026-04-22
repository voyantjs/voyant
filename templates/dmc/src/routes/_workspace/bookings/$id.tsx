import { createFileRoute } from "@tanstack/react-router"
import {
  defaultFetcher,
  getBookingActivityQueryOptions,
  getBookingNotesQueryOptions,
  getBookingQueryOptions,
  getSupplierStatusesQueryOptions,
  getTravelersQueryOptions,
} from "@voyantjs/bookings-react"

import { BookingDetailPage } from "@/components/voyant/bookings/booking-detail-page"
import { getApiUrl } from "@/lib/env"

export const Route = createFileRoute("/_workspace/bookings/$id")({
  loader: async ({ context, params }) => {
    const client = { baseUrl: getApiUrl(), fetcher: defaultFetcher }

    await Promise.all([
      context.queryClient.ensureQueryData(getBookingQueryOptions(client, params.id)),
      context.queryClient.ensureQueryData(getTravelersQueryOptions(client, params.id)),
      context.queryClient.ensureQueryData(getSupplierStatusesQueryOptions(client, params.id)),
      context.queryClient.ensureQueryData(getBookingActivityQueryOptions(client, params.id)),
      context.queryClient.ensureQueryData(getBookingNotesQueryOptions(client, params.id)),
    ])
  },
  component: BookingDetailRoute,
})

function BookingDetailRoute() {
  const { id } = Route.useParams()
  return <BookingDetailPage id={id} />
}
