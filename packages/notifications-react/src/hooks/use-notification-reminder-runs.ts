"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantNotificationsContext } from "../provider.js"
import type { NotificationReminderRunsListFilters } from "../query-keys.js"
import { getNotificationReminderRunsQueryOptions } from "../query-options.js"

export interface UseNotificationReminderRunsOptions extends NotificationReminderRunsListFilters {
  enabled?: boolean
}

export function useNotificationReminderRuns(options: UseNotificationReminderRunsOptions = {}) {
  const { baseUrl, fetcher } = useVoyantNotificationsContext()
  const { enabled = true, ...filters } = options
  return useQuery({
    ...getNotificationReminderRunsQueryOptions({ baseUrl, fetcher }, filters),
    enabled,
  })
}
