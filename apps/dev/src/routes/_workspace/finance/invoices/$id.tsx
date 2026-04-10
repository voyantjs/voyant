import { createFileRoute } from "@tanstack/react-router"
import { InvoiceDetailPage } from "./$id-page"
import {
  getInvoiceCreditNotesQueryOptions,
  getInvoiceLineItemsQueryOptions,
  getInvoiceNotesQueryOptions,
  getInvoicePaymentsQueryOptions,
  getInvoiceQueryOptions,
} from "./$id-shared"

export const Route = createFileRoute("/_workspace/finance/invoices/$id")({
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(getInvoiceQueryOptions(params.id)),
      context.queryClient.ensureQueryData(getInvoiceLineItemsQueryOptions(params.id)),
      context.queryClient.ensureQueryData(getInvoicePaymentsQueryOptions(params.id)),
      context.queryClient.ensureQueryData(getInvoiceCreditNotesQueryOptions(params.id)),
      context.queryClient.ensureQueryData(getInvoiceNotesQueryOptions(params.id)),
    ]),
  component: InvoiceDetailRoute,
})

function InvoiceDetailRoute() {
  const { id } = Route.useParams()
  return <InvoiceDetailPage id={id} />
}
