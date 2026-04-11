import { createFileRoute } from "@tanstack/react-router"
import { defaultFetcher, getPriceCatalogsQueryOptions } from "@voyantjs/pricing-react"

import { PriceCatalogsPage } from "@/components/voyant/settings/price-catalogs-page"
import { getApiUrl } from "@/lib/env"

export const Route = createFileRoute("/_workspace/settings/price-catalogs")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(
      getPriceCatalogsQueryOptions(
        { baseUrl: getApiUrl(), fetcher: defaultFetcher },
        { limit: 25, offset: 0 },
      ),
    ),
  component: PriceCatalogsPage,
})
