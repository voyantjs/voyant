"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantNotificationsContext } from "../provider.js"
import { getNotificationDeliveryQueryOptions } from "../query-options.js"

export function useNotificationDelivery(id: string, options?: { enabled?: boolean }) {
  const { baseUrl, fetcher } = useVoyantNotificationsContext()
  const enabled = options?.enabled ?? true

  return useQuery({
    ...getNotificationDeliveryQueryOptions({ baseUrl, fetcher }, id),
    enabled: enabled && Boolean(id),
  })
}
