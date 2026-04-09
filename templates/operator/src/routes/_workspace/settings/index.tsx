import { createFileRoute, Navigate } from "@tanstack/react-router"

export const Route = createFileRoute("/_workspace/settings/")({
  component: () => <Navigate to="/settings/channels" replace />,
})
