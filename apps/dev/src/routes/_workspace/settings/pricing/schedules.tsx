import { createFileRoute } from "@tanstack/react-router"
import { defaultFetcher, getPriceSchedulesQueryOptions } from "@voyantjs/pricing-react"

import { PriceSchedulesPage } from "@/components/voyant/pricing/price-schedules-page"
import { getApiUrl } from "@/lib/env"

export const Route = createFileRoute("/_workspace/settings/pricing/schedules")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(
      getPriceSchedulesQueryOptions(
        { baseUrl: getApiUrl(), fetcher: defaultFetcher },
        { limit: 25 },
      ),
    ),
  component: PriceSchedulesPage,
})
