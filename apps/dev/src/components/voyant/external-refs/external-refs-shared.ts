import {
  defaultFetcher,
  type ExternalRefRecord,
  type ExternalRefsListFilters,
  getExternalRefsQueryOptions as getExternalRefsQueryOptionsBase,
} from "@voyantjs/external-refs-react"
import { getApiUrl } from "@/lib/env"

export type ExternalRefData = ExternalRefRecord

export const EXTERNAL_REF_STATUSES = ["active", "inactive", "archived"] as const

export function getExternalRefsQueryOptions(filters: ExternalRefsListFilters = {}) {
  return getExternalRefsQueryOptionsBase({ baseUrl: getApiUrl(), fetcher: defaultFetcher }, filters)
}
