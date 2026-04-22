import { createFileRoute, Navigate } from "@tanstack/react-router"

export const Route = createFileRoute("/_workspace/notifications/")({
  component: () => <Navigate to="/notifications/templates" replace />,
})
