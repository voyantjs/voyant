"use client"

import { createContext, type ReactNode, useContext, useMemo } from "react"

import { defaultFetcher, type VoyantFetcher } from "./client.js"

export interface VoyantBookingsContextValue {
  baseUrl: string
  fetcher: VoyantFetcher
}

const VoyantBookingsContext = createContext<VoyantBookingsContextValue | null>(null)

export interface VoyantBookingsProviderProps {
  baseUrl: string
  fetcher?: VoyantFetcher
  children: ReactNode
}

export function VoyantBookingsProvider({
  baseUrl,
  fetcher,
  children,
}: VoyantBookingsProviderProps) {
  const value = useMemo<VoyantBookingsContextValue>(
    () => ({ baseUrl, fetcher: fetcher ?? defaultFetcher }),
    [baseUrl, fetcher],
  )

  return <VoyantBookingsContext.Provider value={value}>{children}</VoyantBookingsContext.Provider>
}

export function useVoyantBookingsContext(): VoyantBookingsContextValue {
  const context = useContext(VoyantBookingsContext)
  if (!context) {
    throw new Error(
      'useVoyantBookingsContext must be used inside <VoyantBookingsProvider>. Wrap your app with <VoyantBookingsProvider baseUrl="/api" />.',
    )
  }
  return context
}
