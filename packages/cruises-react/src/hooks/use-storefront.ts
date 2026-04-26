import { useQuery } from "@tanstack/react-query"
import { z } from "zod"

import { fetchWithValidation } from "../client.js"
import { useVoyantCruisesContext } from "../provider.js"
import { cruisesQueryKeys, type StorefrontListFilters } from "../query-keys.js"
import { getStorefrontCruisesQueryOptions } from "../query-options.js"
import {
  cruiseSourceSchema,
  effectiveItineraryDaySchema,
  priceRecordSchema,
  searchIndexEntrySchema,
  singleEnvelope,
} from "../schemas.js"

export interface UseStorefrontCruisesOptions extends StorefrontListFilters {
  enabled?: boolean
}

/**
 * Storefront catalog browse — paginated, filterable, reads from
 * cruise_search_index on the server. Mixes local and external entries
 * with provenance markers so the UI can render an "External" badge.
 */
export function useStorefrontCruises(options: UseStorefrontCruisesOptions = {}) {
  const { baseUrl, fetcher } = useVoyantCruisesContext()
  const { enabled = true, ...filters } = options
  return useQuery({
    ...getStorefrontCruisesQueryOptions({ baseUrl, fetcher }, filters),
    enabled,
  })
}

// Cruise detail — wraps the rich storefront detail payload that includes
// the index summary plus the source-resolved cruise + sailings.
const storefrontCruiseDetailSchema = singleEnvelope(
  z.object({
    source: cruiseSourceSchema,
    sourceProvider: z.string().nullable(),
    sourceRef: z.record(z.string(), z.unknown()).nullable(),
    summary: searchIndexEntrySchema,
    cruise: z.unknown(),
    sailings: z.array(z.unknown()).optional(),
  }),
)

export type StorefrontCruiseDetail = z.infer<typeof storefrontCruiseDetailSchema>["data"]

export interface UseStorefrontCruiseOptions {
  enabled?: boolean
}

export function useStorefrontCruise(
  slug: string | null | undefined,
  options: UseStorefrontCruiseOptions = {},
) {
  const { baseUrl, fetcher } = useVoyantCruisesContext()
  const { enabled = true } = options
  return useQuery({
    queryKey: cruisesQueryKeys.storefrontCruise(slug ?? ""),
    queryFn: async (): Promise<StorefrontCruiseDetail> => {
      const result = await fetchWithValidation(
        `/v1/public/cruises/${encodeURIComponent(slug ?? "")}`,
        storefrontCruiseDetailSchema,
        { baseUrl, fetcher },
      )
      return result.data
    },
    enabled: enabled && !!slug,
  })
}

// Sailing detail — accepts both local TypeIDs and `<provider>:<ref>` keys.
const storefrontSailingSchema = singleEnvelope(
  z.object({
    source: z.union([z.literal("local"), z.literal("external")]),
    sourceProvider: z.string().optional(),
    sailing: z.unknown(),
    pricing: z.array(priceRecordSchema).optional(),
    itinerary: z.array(effectiveItineraryDaySchema).optional(),
  }),
)

export type StorefrontSailingDetail = z.infer<typeof storefrontSailingSchema>["data"]

export function useStorefrontSailing(
  key: string | null | undefined,
  options: UseStorefrontCruiseOptions = {},
) {
  const { baseUrl, fetcher } = useVoyantCruisesContext()
  const { enabled = true } = options
  return useQuery({
    queryKey: cruisesQueryKeys.storefrontSailing(key ?? ""),
    queryFn: async (): Promise<StorefrontSailingDetail> => {
      const result = await fetchWithValidation(
        `/v1/public/cruises/sailings/${encodeURIComponent(key ?? "")}`,
        storefrontSailingSchema,
        { baseUrl, fetcher },
      )
      return result.data
    },
    enabled: enabled && !!key,
  })
}
