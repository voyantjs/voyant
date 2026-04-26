import { useMutation, useQuery } from "@tanstack/react-query"

import { fetchWithValidation } from "../client.js"
import { useVoyantCruisesContext } from "../provider.js"
import type { PricesListFilters } from "../query-keys.js"
import { getPricesQueryOptions } from "../query-options.js"
import { type Quote, quoteResponse } from "../schemas.js"

export interface UsePricesOptions extends PricesListFilters {
  enabled?: boolean
}

export function usePrices(options: UsePricesOptions = {}) {
  const { baseUrl, fetcher } = useVoyantCruisesContext()
  const { enabled = true, ...filters } = options
  return useQuery({
    ...getPricesQueryOptions({ baseUrl, fetcher }, filters),
    enabled,
  })
}

export interface QuoteRequestInput {
  cabinCategoryId: string
  occupancy: number
  guestCount: number
  fareCode?: string | null
}

/**
 * Quote a cabin against a sailing. Mutation rather than query because the
 * server validates inputs and runs the composeQuote pipeline — caching by
 * input is the caller's choice (template's React Query config).
 */
export function useQuote() {
  const { baseUrl, fetcher } = useVoyantCruisesContext()
  const client = { baseUrl, fetcher }
  return useMutation({
    mutationFn: async ({
      sailingKey,
      input,
    }: {
      sailingKey: string
      input: QuoteRequestInput
    }): Promise<Quote> => {
      const result = await fetchWithValidation(
        `/v1/admin/cruises/sailings/${encodeURIComponent(sailingKey)}/quote`,
        quoteResponse,
        client,
        { method: "POST", body: JSON.stringify(input) },
      )
      return result.data
    },
  })
}
