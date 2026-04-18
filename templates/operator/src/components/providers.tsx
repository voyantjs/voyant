import type { QueryClient } from "@tanstack/react-query"
import { AdminProvider } from "@voyantjs/voyant-admin"
import type * as React from "react"

import { TooltipProvider } from "@/components/ui/tooltip"

export function Providers({
  children,
  queryClient,
}: {
  children: React.ReactNode
  queryClient: QueryClient
}) {
  return (
    <AdminProvider queryClient={queryClient}>
      <TooltipProvider>{children}</TooltipProvider>
    </AdminProvider>
  )
}
