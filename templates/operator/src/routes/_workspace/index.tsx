import { createFileRoute } from "@tanstack/react-router"
import { DashboardPage } from "./index-page"
import {
  getDashboardBookingsQueryOptions,
  getDashboardInvoicesQueryOptions,
  getDashboardProductsQueryOptions,
  getDashboardSuppliersQueryOptions,
} from "./index-shared"

export const Route = createFileRoute("/_workspace/")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(getDashboardBookingsQueryOptions()),
      context.queryClient.ensureQueryData(getDashboardProductsQueryOptions()),
      context.queryClient.ensureQueryData(getDashboardSuppliersQueryOptions()),
      context.queryClient.ensureQueryData(getDashboardInvoicesQueryOptions()),
    ]),
  component: DashboardPage,
})
