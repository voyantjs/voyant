"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantNotificationsContext } from "../provider.js"
import type { NotificationReminderRulesListFilters } from "../query-keys.js"
import { getNotificationReminderRulesQueryOptions } from "../query-options.js"

export interface UseNotificationReminderRulesOptions extends NotificationReminderRulesListFilters {
  enabled?: boolean
}

export function useNotificationReminderRules(options: UseNotificationReminderRulesOptions = {}) {
  const { baseUrl, fetcher } = useVoyantNotificationsContext()
  const { enabled = true, ...filters } = options
  return useQuery({
    ...getNotificationReminderRulesQueryOptions({ baseUrl, fetcher }, filters),
    enabled,
  })
}
