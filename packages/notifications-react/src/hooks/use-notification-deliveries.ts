"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantNotificationsContext } from "../provider.js"
import type { NotificationDeliveriesListFilters } from "../query-keys.js"
import { getNotificationDeliveriesQueryOptions } from "../query-options.js"

export interface UseNotificationDeliveriesOptions extends NotificationDeliveriesListFilters {
  enabled?: boolean
}

export function useNotificationDeliveries(options: UseNotificationDeliveriesOptions = {}) {
  const { baseUrl, fetcher } = useVoyantNotificationsContext()
  const { enabled = true, ...filters } = options
  return useQuery({
    ...getNotificationDeliveriesQueryOptions({ baseUrl, fetcher }, filters),
    enabled,
  })
}
