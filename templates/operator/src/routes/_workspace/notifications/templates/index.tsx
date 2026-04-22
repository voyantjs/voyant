import { createFileRoute } from "@tanstack/react-router"
import { NotificationTemplatesPage } from "@voyantjs/voyant-ui/components"

export const Route = createFileRoute("/_workspace/notifications/templates/")({
  component: NotificationTemplatesPage,
})
