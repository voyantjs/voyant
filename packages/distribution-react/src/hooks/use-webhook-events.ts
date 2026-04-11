"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantDistributionContext } from "../provider.js"
import type { WebhookEventsListFilters } from "../query-keys.js"
import { getWebhookEventsQueryOptions } from "../query-options.js"

export interface UseWebhookEventsOptions extends WebhookEventsListFilters {
  enabled?: boolean
}

export function useWebhookEvents(options: UseWebhookEventsOptions = {}) {
  const client = useVoyantDistributionContext()
  const { enabled = true } = options
  return useQuery({ ...getWebhookEventsQueryOptions(client, options), enabled })
}
