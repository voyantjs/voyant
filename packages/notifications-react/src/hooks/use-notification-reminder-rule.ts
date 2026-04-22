"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantNotificationsContext } from "../provider.js"
import { getNotificationReminderRuleQueryOptions } from "../query-options.js"

export interface UseNotificationReminderRuleOptions {
  enabled?: boolean
}

export function useNotificationReminderRule(
  id: string,
  options: UseNotificationReminderRuleOptions = {},
) {
  const { baseUrl, fetcher } = useVoyantNotificationsContext()
  const { enabled = true } = options
  return useQuery({
    ...getNotificationReminderRuleQueryOptions({ baseUrl, fetcher }, id),
    enabled: enabled && Boolean(id),
  })
}
