import { createFileRoute } from "@tanstack/react-router"
import { BookingRequirementsPage } from "@/components/voyant/booking-requirements/booking-requirements-page"
import { getBookingRequirementProductsQueryOptions } from "@/components/voyant/booking-requirements/booking-requirements-shared"

export const Route = createFileRoute("/_workspace/booking-requirements/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(getBookingRequirementProductsQueryOptions()),
  component: BookingRequirementsPage,
})
