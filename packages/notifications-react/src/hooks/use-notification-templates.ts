"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantNotificationsContext } from "../provider.js"
import type { NotificationTemplatesListFilters } from "../query-keys.js"
import { getNotificationTemplatesQueryOptions } from "../query-options.js"

export interface UseNotificationTemplatesOptions extends NotificationTemplatesListFilters {
  enabled?: boolean
}

export function useNotificationTemplates(options: UseNotificationTemplatesOptions = {}) {
  const { baseUrl, fetcher } = useVoyantNotificationsContext()
  const { enabled = true, ...filters } = options
  return useQuery({
    ...getNotificationTemplatesQueryOptions({ baseUrl, fetcher }, filters),
    enabled,
  })
}
