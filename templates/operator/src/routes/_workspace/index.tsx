import { createFileRoute } from "@tanstack/react-router"
import { DashboardPage } from "@/components/voyant/dashboard/dashboard-page"
import {
  getDashboardBookingsQueryOptions,
  getDashboardInvoicesQueryOptions,
  getDashboardProductsQueryOptions,
  getDashboardSuppliersQueryOptions,
} from "@/components/voyant/dashboard/dashboard-shared"
import { DashboardSkeleton } from "@/components/voyant/dashboard/dashboard-skeleton"

export const Route = createFileRoute("/_workspace/")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(getDashboardBookingsQueryOptions()),
      context.queryClient.ensureQueryData(getDashboardProductsQueryOptions()),
      context.queryClient.ensureQueryData(getDashboardSuppliersQueryOptions()),
      context.queryClient.ensureQueryData(getDashboardInvoicesQueryOptions()),
    ]),
  pendingComponent: DashboardSkeleton,
  component: DashboardPage,
})
