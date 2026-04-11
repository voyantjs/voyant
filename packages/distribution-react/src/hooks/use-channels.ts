"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantDistributionContext } from "../provider.js"
import type { ChannelsListFilters } from "../query-keys.js"
import { getChannelsQueryOptions } from "../query-options.js"

export interface UseChannelsOptions extends ChannelsListFilters {
  enabled?: boolean
}

export function useChannels(options: UseChannelsOptions = {}) {
  const client = useVoyantDistributionContext()
  const { enabled = true } = options
  return useQuery({ ...getChannelsQueryOptions(client, options), enabled })
}
