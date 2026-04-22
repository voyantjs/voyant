import { createFileRoute } from "@tanstack/react-router"

import { TeamSettingsPage } from "@/components/voyant/settings/team-settings-page"

export const Route = createFileRoute("/_workspace/team")({
  component: TeamSettingsPage,
})
