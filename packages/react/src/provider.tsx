"use client"

import { createContext, type ReactNode, useContext, useMemo } from "react"

export type VoyantFetcher = (url: string, init?: RequestInit) => Promise<Response>

export const defaultFetcher: VoyantFetcher = (url, init) =>
  fetch(url, {
    credentials: "include",
    ...init,
  })

export interface VoyantReactContextValue {
  baseUrl: string
  fetcher: VoyantFetcher
}

const VoyantReactContext = createContext<VoyantReactContextValue | null>(null)

export interface VoyantReactProviderProps {
  baseUrl: string
  fetcher?: VoyantFetcher
  children: ReactNode
}

export function VoyantReactProvider({ baseUrl, fetcher, children }: VoyantReactProviderProps) {
  const value = useMemo<VoyantReactContextValue>(
    () => ({ baseUrl, fetcher: fetcher ?? defaultFetcher }),
    [baseUrl, fetcher],
  )

  return <VoyantReactContext.Provider value={value}>{children}</VoyantReactContext.Provider>
}

export function useVoyantReactContext(): VoyantReactContextValue {
  const context = useContext(VoyantReactContext)
  if (!context) {
    throw new Error(
      'useVoyantReactContext must be used inside <VoyantReactProvider>. Wrap your app with <VoyantReactProvider baseUrl="/api" />.',
    )
  }

  return context
}
