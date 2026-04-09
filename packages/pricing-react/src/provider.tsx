"use client"

import { createContext, type ReactNode, useContext, useMemo } from "react"

import { defaultFetcher, type VoyantFetcher } from "./client.js"

export interface VoyantPricingContextValue {
  baseUrl: string
  fetcher: VoyantFetcher
}

const VoyantPricingContext = createContext<VoyantPricingContextValue | null>(null)

export interface VoyantPricingProviderProps {
  baseUrl: string
  fetcher?: VoyantFetcher
  children: ReactNode
}

export function VoyantPricingProvider({ baseUrl, fetcher, children }: VoyantPricingProviderProps) {
  const value = useMemo<VoyantPricingContextValue>(
    () => ({ baseUrl, fetcher: fetcher ?? defaultFetcher }),
    [baseUrl, fetcher],
  )

  return <VoyantPricingContext.Provider value={value}>{children}</VoyantPricingContext.Provider>
}

export function useVoyantPricingContext(): VoyantPricingContextValue {
  const context = useContext(VoyantPricingContext)
  if (!context) {
    throw new Error(
      'useVoyantPricingContext must be used inside <VoyantPricingProvider>. Wrap your app with <VoyantPricingProvider baseUrl="/api" />.',
    )
  }
  return context
}
