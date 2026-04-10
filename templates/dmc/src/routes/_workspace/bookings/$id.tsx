import { createFileRoute } from "@tanstack/react-router"
import { BookingDetailPage } from "./$id-page"
import {
  getBookingActivityQueryOptions,
  getBookingNotesQueryOptions,
  getBookingPassengersQueryOptions,
  getBookingQueryOptions,
  getBookingSupplierStatusesQueryOptions,
} from "./$id-shared"

export const Route = createFileRoute("/_workspace/bookings/$id")({
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(getBookingQueryOptions(params.id)),
      context.queryClient.ensureQueryData(getBookingPassengersQueryOptions(params.id)),
      context.queryClient.ensureQueryData(getBookingSupplierStatusesQueryOptions(params.id)),
      context.queryClient.ensureQueryData(getBookingActivityQueryOptions(params.id)),
      context.queryClient.ensureQueryData(getBookingNotesQueryOptions(params.id)),
    ])
  },
  component: BookingDetailRoute,
})

function BookingDetailRoute() {
  const { id } = Route.useParams()
  return <BookingDetailPage id={id} />
}
