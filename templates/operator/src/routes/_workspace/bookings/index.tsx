import { createFileRoute } from "@tanstack/react-router"
import { defaultFetcher, getBookingsQueryOptions } from "@voyantjs/bookings-react"

import { BookingsPage } from "@/components/voyant/bookings/bookings-page"
import { getApiUrl } from "@/lib/env"

export const Route = createFileRoute("/_workspace/bookings/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(
      getBookingsQueryOptions({ baseUrl: getApiUrl(), fetcher: defaultFetcher }),
    ),
  component: BookingsPage,
})
