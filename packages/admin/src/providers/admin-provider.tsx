"use client"

import { type QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { type ReactNode, useState } from "react"

import type { ThemeMode } from "../types.js"
import { makeQueryClient } from "./query-client.js"
import { ThemeProvider } from "./theme.js"

export interface AdminProviderProps {
  children: ReactNode
  /**
   * Pre-built QueryClient. If not provided, one is created per render-tree
   * via `makeQueryClient()`. Pass your own for server-rendering setups where
   * the client should be created outside React.
   */
  queryClient?: QueryClient
  /** Initial theme. Defaults to "system". */
  defaultTheme?: ThemeMode
  /**
   * localStorage key for theme persistence. Pass `null` to disable.
   * Defaults to `"theme"`.
   */
  themeStorageKey?: string | null
}

/**
 * Composes the shared admin providers — QueryClient and Theme — so templates
 * don't have to wire each one individually. Note: this does NOT include
 * `<VoyantProvider>` (from `@voyantjs/crm-react`) because its API base
 * URL is template-specific. Wrap AdminProvider's children with your
 * VoyantProvider at the same level.
 *
 * @example
 * <AdminProvider>
 *   <VoyantProvider baseUrl="/api">
 *     <App />
 *   </VoyantProvider>
 * </AdminProvider>
 */
export function AdminProvider({
  children,
  queryClient,
  defaultTheme = "system",
  themeStorageKey = "theme",
}: AdminProviderProps) {
  // Keep a single QueryClient instance per mount when one isn't passed in.
  const [client] = useState(() => queryClient ?? makeQueryClient())

  return (
    <QueryClientProvider client={client}>
      <ThemeProvider defaultTheme={defaultTheme} storageKey={themeStorageKey}>
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  )
}
