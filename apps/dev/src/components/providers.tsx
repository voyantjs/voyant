import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { VoyantBookingsProvider } from "@voyantjs/bookings-react"
import { VoyantProvider } from "@voyantjs/crm-react"
import { VoyantPricingProvider } from "@voyantjs/pricing-react"
import { VoyantProductsProvider } from "@voyantjs/products-react"
import type * as React from "react"

import { TooltipProvider } from "@/components/ui/tooltip"
import { getApiUrl } from "@/lib/env"

import { ThemeProvider } from "./providers/theme-provider"
import { UserProvider } from "./providers/user-provider"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
})

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <VoyantProvider baseUrl={getApiUrl()}>
        <VoyantBookingsProvider baseUrl={getApiUrl()}>
          <VoyantPricingProvider baseUrl={getApiUrl()}>
            <VoyantProductsProvider baseUrl={getApiUrl()}>
              <UserProvider>
                <ThemeProvider>
                  <TooltipProvider>{children}</TooltipProvider>
                </ThemeProvider>
              </UserProvider>
            </VoyantProductsProvider>
          </VoyantPricingProvider>
        </VoyantBookingsProvider>
      </VoyantProvider>
    </QueryClientProvider>
  )
}
