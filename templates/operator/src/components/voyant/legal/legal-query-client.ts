import { defaultFetcher } from "@voyantjs/legal-react"

import { getApiUrl } from "@/lib/env"

export const legalQueryClient = {
  baseUrl: getApiUrl(),
  fetcher: defaultFetcher,
} as const
