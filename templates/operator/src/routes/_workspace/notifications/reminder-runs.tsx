import { createFileRoute } from "@tanstack/react-router"
import { NotificationReminderRunsPage } from "@voyantjs/voyant-ui/components"

export const Route = createFileRoute("/_workspace/notifications/reminder-runs")({
  component: NotificationReminderRunsPage,
})
