import { createFileRoute } from "@tanstack/react-router"
import {
  defaultFetcher,
  getInvoicesQueryOptions,
  getSupplierPaymentsQueryOptions,
} from "@voyantjs/finance-react"

import { FinancePage } from "@/components/voyant/finance/finance-page"
import { FinancePageSkeleton } from "@/components/voyant/finance/finance-page-skeleton"
import { getApiUrl } from "@/lib/env"

export const Route = createFileRoute("/_workspace/finance/")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(
        getInvoicesQueryOptions({ baseUrl: getApiUrl(), fetcher: defaultFetcher }),
      ),
      context.queryClient.ensureQueryData(
        getSupplierPaymentsQueryOptions({ baseUrl: getApiUrl(), fetcher: defaultFetcher }),
      ),
    ]),
  pendingComponent: FinancePageSkeleton,
  component: FinancePage,
})
