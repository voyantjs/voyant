import { createFileRoute } from "@tanstack/react-router"
import { ContractsPage, loadContractsPage } from "@/components/voyant/legal/contracts-page"

export const Route = createFileRoute("/_workspace/legal/contracts/")({
  loader: ({ context }) =>
    loadContractsPage((options) => context.queryClient.ensureQueryData(options)),
  component: ContractsPage,
})
