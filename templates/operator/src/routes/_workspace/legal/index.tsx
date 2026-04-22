import { createFileRoute, Navigate } from "@tanstack/react-router"

export const Route = createFileRoute("/_workspace/legal/")({
  component: () => <Navigate to="/legal/contracts" replace />,
})
