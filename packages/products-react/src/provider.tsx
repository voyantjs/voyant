"use client"

import { createContext, type ReactNode, useContext, useMemo } from "react"

import { defaultFetcher, type VoyantFetcher } from "./client.js"

export interface VoyantProductsContextValue {
  baseUrl: string
  fetcher: VoyantFetcher
}

const VoyantProductsContext = createContext<VoyantProductsContextValue | null>(null)

export interface VoyantProductsProviderProps {
  baseUrl: string
  fetcher?: VoyantFetcher
  children: ReactNode
}

export function VoyantProductsProvider({
  baseUrl,
  fetcher,
  children,
}: VoyantProductsProviderProps) {
  const value = useMemo<VoyantProductsContextValue>(
    () => ({ baseUrl, fetcher: fetcher ?? defaultFetcher }),
    [baseUrl, fetcher],
  )
  return <VoyantProductsContext.Provider value={value}>{children}</VoyantProductsContext.Provider>
}

export function useVoyantProductsContext(): VoyantProductsContextValue {
  const context = useContext(VoyantProductsContext)
  if (!context) {
    throw new Error(
      'useVoyantProductsContext must be used inside <VoyantProductsProvider>. Wrap your app with <VoyantProductsProvider baseUrl="/api" />.',
    )
  }
  return context
}
