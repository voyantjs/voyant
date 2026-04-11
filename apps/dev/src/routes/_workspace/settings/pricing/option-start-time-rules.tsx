import { createFileRoute } from "@tanstack/react-router"
import { defaultFetcher, getOptionStartTimeRulesQueryOptions } from "@voyantjs/pricing-react"

import { OptionStartTimeRulesPage } from "@/components/voyant/pricing/option-start-time-rules-page"
import { getApiUrl } from "@/lib/env"

export const Route = createFileRoute("/_workspace/settings/pricing/option-start-time-rules")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(
      getOptionStartTimeRulesQueryOptions(
        { baseUrl: getApiUrl(), fetcher: defaultFetcher },
        { limit: 25 },
      ),
    ),
  component: OptionStartTimeRulesPage,
})
