"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantNotificationsContext } from "../provider.js"
import { getNotificationTemplateQueryOptions } from "../query-options.js"

export interface UseNotificationTemplateOptions {
  enabled?: boolean
}

export function useNotificationTemplate(id: string, options: UseNotificationTemplateOptions = {}) {
  const { baseUrl, fetcher } = useVoyantNotificationsContext()
  const { enabled = true } = options
  return useQuery({
    ...getNotificationTemplateQueryOptions({ baseUrl, fetcher }, id, options),
    enabled: enabled && Boolean(id),
  })
}
