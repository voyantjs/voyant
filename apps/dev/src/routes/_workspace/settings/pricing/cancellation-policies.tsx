import { createFileRoute } from "@tanstack/react-router"
import { defaultFetcher, getCancellationPoliciesQueryOptions } from "@voyantjs/pricing-react"

import { CancellationPoliciesPage } from "@/components/voyant/pricing/cancellation-policies-page"
import { getApiUrl } from "@/lib/env"

export const Route = createFileRoute("/_workspace/settings/pricing/cancellation-policies")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(
      getCancellationPoliciesQueryOptions(
        { baseUrl: getApiUrl(), fetcher: defaultFetcher },
        { limit: 25 },
      ),
    ),
  component: CancellationPoliciesPage,
})
