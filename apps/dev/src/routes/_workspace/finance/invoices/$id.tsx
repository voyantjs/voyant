import { createFileRoute } from "@tanstack/react-router"
import {
  defaultFetcher,
  getInvoiceCreditNotesQueryOptions,
  getInvoiceLineItemsQueryOptions,
  getInvoiceNotesQueryOptions,
  getInvoicePaymentsQueryOptions,
  getInvoiceQueryOptions,
} from "@voyantjs/finance-react"

import { InvoiceDetailPage } from "@/components/voyant/finance/invoice-detail-page"
import { getApiUrl } from "@/lib/env"

export const Route = createFileRoute("/_workspace/finance/invoices/$id")({
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(
        getInvoiceQueryOptions({ baseUrl: getApiUrl(), fetcher: defaultFetcher }, params.id),
      ),
      context.queryClient.ensureQueryData(
        getInvoiceLineItemsQueryOptions(
          { baseUrl: getApiUrl(), fetcher: defaultFetcher },
          params.id,
        ),
      ),
      context.queryClient.ensureQueryData(
        getInvoicePaymentsQueryOptions(
          { baseUrl: getApiUrl(), fetcher: defaultFetcher },
          params.id,
        ),
      ),
      context.queryClient.ensureQueryData(
        getInvoiceCreditNotesQueryOptions(
          { baseUrl: getApiUrl(), fetcher: defaultFetcher },
          params.id,
        ),
      ),
      context.queryClient.ensureQueryData(
        getInvoiceNotesQueryOptions({ baseUrl: getApiUrl(), fetcher: defaultFetcher }, params.id),
      ),
    ]),
  component: InvoiceDetailRoute,
})

function InvoiceDetailRoute() {
  const { id } = Route.useParams()
  return <InvoiceDetailPage id={id} />
}
