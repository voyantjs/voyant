import { createFileRoute } from "@tanstack/react-router"
import { getMarketsQueryOptions } from "@/components/voyant/markets/market-shared"
import { MarketsPage } from "@/components/voyant/markets/markets-page"

export const Route = createFileRoute("/_workspace/markets/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(getMarketsQueryOptions({ limit: 25, offset: 0 })),
  component: MarketsPage,
})
