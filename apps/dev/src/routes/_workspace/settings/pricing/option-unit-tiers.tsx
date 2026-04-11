import { createFileRoute } from "@tanstack/react-router"
import { defaultFetcher, getOptionUnitTiersQueryOptions } from "@voyantjs/pricing-react"

import { OptionUnitTiersPage } from "@/components/voyant/pricing/option-unit-tiers-page"
import { getApiUrl } from "@/lib/env"

export const Route = createFileRoute("/_workspace/settings/pricing/option-unit-tiers")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(
      getOptionUnitTiersQueryOptions(
        { baseUrl: getApiUrl(), fetcher: defaultFetcher },
        { limit: 25 },
      ),
    ),
  component: OptionUnitTiersPage,
})
