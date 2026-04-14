"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantStorefrontContext } from "../provider.js"
import { getStorefrontSettingsQueryOptions } from "../query-options.js"

export interface UseStorefrontSettingsOptions {
  enabled?: boolean
}

export function useStorefrontSettings(options: UseStorefrontSettingsOptions = {}) {
  const { baseUrl, fetcher } = useVoyantStorefrontContext()
  const { enabled = true } = options

  return useQuery({
    ...getStorefrontSettingsQueryOptions({ baseUrl, fetcher }),
    enabled,
  })
}
