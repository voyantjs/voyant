import { type QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { VoyantReactProvider } from "@voyantjs/react"
import type * as React from "react"

import { TooltipProvider } from "@/components/ui/tooltip"
import { getApiUrl } from "@/lib/env"

import { ThemeProvider } from "./providers/theme-provider"
import { UserProvider } from "./providers/user-provider"

export function Providers({
  children,
  queryClient,
}: {
  children: React.ReactNode
  queryClient: QueryClient
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <VoyantReactProvider baseUrl={getApiUrl()}>
        <UserProvider>
          <ThemeProvider>
            <TooltipProvider>{children}</TooltipProvider>
          </ThemeProvider>
        </UserProvider>
      </VoyantReactProvider>
    </QueryClientProvider>
  )
}
