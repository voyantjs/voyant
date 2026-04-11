import { createFileRoute } from "@tanstack/react-router"
import { getPeopleQueryOptions } from "@/components/voyant/crm/crm-query-options"
import { PeoplePage } from "@/components/voyant/crm/people-page"

export const Route = createFileRoute("/_workspace/people/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(getPeopleQueryOptions({ limit: 25, offset: 0 })),
  component: PeoplePage,
})
