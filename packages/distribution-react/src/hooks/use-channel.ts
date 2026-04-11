"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantDistributionContext } from "../provider.js"
import { getChannelQueryOptions } from "../query-options.js"

export interface UseChannelOptions {
  enabled?: boolean
}

export function useChannel(id: string | null | undefined, options: UseChannelOptions = {}) {
  const client = useVoyantDistributionContext()
  const { enabled = true } = options

  return useQuery({
    ...getChannelQueryOptions(client, id ?? "__missing__"),
    select: (result) => result.data,
    enabled: enabled && Boolean(id),
  })
}
