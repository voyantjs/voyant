"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantStorefrontContext } from "../provider.js"
import { getStorefrontOfferQueryOptions } from "../query-options.js"

export interface UseStorefrontOfferOptions {
  enabled?: boolean
  locale?: string
}

export function useStorefrontOffer(
  slug: string | null | undefined,
  options: UseStorefrontOfferOptions = {},
) {
  const { baseUrl, fetcher } = useVoyantStorefrontContext()
  const { enabled = true, locale } = options

  return useQuery({
    ...getStorefrontOfferQueryOptions({ baseUrl, fetcher }, slug ?? "", locale),
    enabled: enabled && Boolean(slug),
  })
}
