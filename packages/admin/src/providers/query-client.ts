import { QueryClient, type QueryClientConfig } from "@tanstack/react-query"

/**
 * Builds a React Query client with Voyant's admin-dashboard defaults.
 *
 * - `refetchOnWindowFocus: false` — dashboards typically don't need to refetch
 *   on every tab-switch; revalidation is explicit via invalidateQueries.
 * - `retry: 1` on queries, `retry: 0` on mutations — avoid hammering APIs on
 *   transient failures but don't retry destructive mutations silently.
 *
 * Callers can override any of these by passing a `defaultOptions` object.
 *
 * @example
 * const client = makeQueryClient()
 * const clientWithLongStaleTime = makeQueryClient({
 *   defaultOptions: { queries: { staleTime: 60_000 } },
 * })
 */
export function makeQueryClient(config?: QueryClientConfig): QueryClient {
  return new QueryClient({
    ...config,
    defaultOptions: {
      ...config?.defaultOptions,
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
        ...config?.defaultOptions?.queries,
      },
      mutations: {
        retry: 0,
        ...config?.defaultOptions?.mutations,
      },
    },
  })
}
