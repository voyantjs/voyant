import { createFileRoute } from "@tanstack/react-router"

import { loadTemplatesPage, TemplatesPage } from "@/components/voyant/legal/templates-page"

export const Route = createFileRoute("/_workspace/legal/templates/")({
  loader: ({ context }) =>
    loadTemplatesPage((options) => context.queryClient.ensureQueryData(options)),
  component: TemplatesPage,
})
