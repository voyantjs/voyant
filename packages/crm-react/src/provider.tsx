"use client"

import { createContext, type ReactNode, useContext, useMemo } from "react"

import { defaultFetcher, type VoyantFetcher } from "./client.js"

export interface VoyantContextValue {
  baseUrl: string
  fetcher: VoyantFetcher
}

const VoyantContext = createContext<VoyantContextValue | null>(null)

export interface VoyantProviderProps {
  /**
   * Base URL prepended to every CRM API call. For same-origin deployments this
   * is usually `/api`; cross-origin consumers pass the full origin, e.g.
   * `https://api.example.com`.
   */
  baseUrl: string
  /**
   * Optional fetcher override. Defaults to `window.fetch` with
   * `credentials: "include"` so session cookies are sent automatically.
   */
  fetcher?: VoyantFetcher
  children: ReactNode
}

/**
 * Wraps the CRM UI hooks in a configured context. Must be mounted above any
 * component that calls `usePeople`, `usePerson`, etc.
 *
 * ```tsx
 * <VoyantProvider baseUrl="/api">
 *   <App />
 * </VoyantProvider>
 * ```
 *
 * This component assumes a `<QueryClientProvider>` already exists higher in
 * the tree — it does not instantiate its own React Query client.
 */
export function VoyantProvider({ baseUrl, fetcher, children }: VoyantProviderProps) {
  const value = useMemo<VoyantContextValue>(
    () => ({ baseUrl, fetcher: fetcher ?? defaultFetcher }),
    [baseUrl, fetcher],
  )
  return <VoyantContext.Provider value={value}>{children}</VoyantContext.Provider>
}

/**
 * Reads the current Voyant context. Throws if used outside `<VoyantProvider>`.
 */
export function useVoyantContext(): VoyantContextValue {
  const context = useContext(VoyantContext)
  if (!context) {
    throw new Error(
      'useVoyantContext must be used inside <VoyantProvider>. Wrap your app with <VoyantProvider baseUrl="/api" />.',
    )
  }
  return context
}
