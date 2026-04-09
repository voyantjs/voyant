import { type QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { VoyantReactProvider } from "@voyantjs/react"
import type * as React from "react"

import { TooltipProvider } from "@/components/ui/tooltip"
import { getApiUrl } from "@/lib/env"

import { ThemeProvider } from "./providers/theme-provider"

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
        <ThemeProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
      </VoyantReactProvider>
    </QueryClientProvider>
  )
}
