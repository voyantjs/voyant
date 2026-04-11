import { createFileRoute } from "@tanstack/react-router"
import {
  getSupplierNotesQueryOptions,
  getSupplierQueryOptions,
  getSupplierServiceRatesQueryOptions,
  getSupplierServicesQueryOptions,
} from "@/components/voyant/suppliers/shared"
import { SupplierDetailPage } from "@/components/voyant/suppliers/supplier-detail-page"

export const Route = createFileRoute("/_workspace/suppliers/$id")({
  loader: async ({ context, params }) => {
    const servicesData = await context.queryClient.ensureQueryData(
      getSupplierServicesQueryOptions(params.id),
    )

    await Promise.all([
      context.queryClient.ensureQueryData(getSupplierQueryOptions(params.id)),
      context.queryClient.ensureQueryData(getSupplierNotesQueryOptions(params.id)),
      ...servicesData.data.map((service) =>
        context.queryClient.ensureQueryData(
          getSupplierServiceRatesQueryOptions(params.id, service.id),
        ),
      ),
    ])
  },
  component: SupplierDetailRoute,
})

function SupplierDetailRoute() {
  const { id } = Route.useParams()
  return <SupplierDetailPage id={id} />
}
