import { createFileRoute } from "@tanstack/react-router"
import { TransactionsPage } from "@/components/voyant/transactions/transactions-page"
import {
  getOffersQueryOptions,
  getOrdersQueryOptions,
} from "@/components/voyant/transactions/transactions-shared"

export const Route = createFileRoute("/_workspace/transactions/")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(getOffersQueryOptions({ limit: 25, offset: 0 })),
      context.queryClient.ensureQueryData(getOrdersQueryOptions({ limit: 25, offset: 0 })),
    ]),
  component: TransactionsPage,
})
