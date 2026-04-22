import { createFileRoute } from "@tanstack/react-router"
import { NotificationReminderRulesPage } from "@voyantjs/voyant-ui/components"

export const Route = createFileRoute("/_workspace/notifications/reminder-rules")({
  component: NotificationReminderRulesPage,
})
