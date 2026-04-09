import { queryOptions } from "@tanstack/react-query"

import { api } from "@/lib/api-client"

export type ListResponse<T> = {
  data: T[]
  total: number
  limit: number
  offset: number
}

export function getPricingSettingsListQueryOptions<T>(queryKey: readonly unknown[], path: string) {
  return queryOptions({
    queryKey,
    queryFn: () => api.get<ListResponse<T>>(path),
  })
}
