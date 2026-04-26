import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { fetchWithValidation } from "../client.js"
import { useVoyantCruisesContext } from "../provider.js"
import { cruisesQueryKeys } from "../query-keys.js"
import { getEnrichmentProgramsQueryOptions } from "../query-options.js"
import {
  type EnrichmentProgramRecord,
  enrichmentListResponse,
  enrichmentSingleResponse,
} from "../schemas.js"

export interface UseEnrichmentProgramsOptions {
  enabled?: boolean
}

export function useEnrichmentPrograms(
  cruiseKey: string | null | undefined,
  options: UseEnrichmentProgramsOptions = {},
) {
  const { baseUrl, fetcher } = useVoyantCruisesContext()
  const { enabled = true } = options
  return useQuery({
    ...getEnrichmentProgramsQueryOptions({ baseUrl, fetcher }, cruiseKey ?? ""),
    enabled: enabled && !!cruiseKey,
  })
}

export interface UpsertEnrichmentProgramInput {
  kind: "naturalist" | "historian" | "photographer" | "lecturer" | "expert" | "other"
  name: string
  title?: string | null
  description?: string | null
  bioImageUrl?: string | null
  sortOrder?: number
}

export function useEnrichmentMutation() {
  const { baseUrl, fetcher } = useVoyantCruisesContext()
  const client = { baseUrl, fetcher }
  const queryClient = useQueryClient()

  const create = useMutation({
    mutationFn: async ({
      cruiseKey,
      input,
    }: {
      cruiseKey: string
      input: UpsertEnrichmentProgramInput
    }): Promise<EnrichmentProgramRecord> => {
      const result = await fetchWithValidation(
        `/v1/admin/cruises/${encodeURIComponent(cruiseKey)}/enrichment`,
        enrichmentSingleResponse,
        client,
        { method: "POST", body: JSON.stringify(input) },
      )
      return result.data
    },
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: cruisesQueryKeys.enrichment(vars.cruiseKey) })
    },
  })

  const replaceAll = useMutation({
    mutationFn: async ({
      cruiseKey,
      programs,
    }: {
      cruiseKey: string
      programs: UpsertEnrichmentProgramInput[]
    }): Promise<EnrichmentProgramRecord[]> => {
      const result = await fetchWithValidation(
        `/v1/admin/cruises/${encodeURIComponent(cruiseKey)}/enrichment/bulk`,
        enrichmentListResponse,
        client,
        { method: "PUT", body: JSON.stringify({ programs }) },
      )
      return result.data
    },
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: cruisesQueryKeys.enrichment(vars.cruiseKey) })
    },
  })

  const update = useMutation({
    mutationFn: async ({
      programId,
      input,
    }: {
      programId: string
      input: Partial<UpsertEnrichmentProgramInput>
    }): Promise<EnrichmentProgramRecord> => {
      const result = await fetchWithValidation(
        `/v1/admin/cruises/enrichment/${encodeURIComponent(programId)}`,
        enrichmentSingleResponse,
        client,
        { method: "PUT", body: JSON.stringify(input) },
      )
      return result.data
    },
    onSuccess: (data) => {
      // We don't know the parent cruise key from the server response alone;
      // invalidate broadly. Templates with hot lists can pass cruiseKey via
      // mutation context if they want a tighter invalidation.
      void queryClient.invalidateQueries({ queryKey: cruisesQueryKeys.cruises() })
      void queryClient.invalidateQueries({
        queryKey: cruisesQueryKeys.enrichment(data.cruiseId),
      })
    },
  })

  const remove = useMutation({
    mutationFn: async (programId: string): Promise<boolean> => {
      const headers = new Headers()
      const url = `${baseUrl.replace(/\/$/, "")}/v1/admin/cruises/enrichment/${encodeURIComponent(programId)}`
      const res = await fetcher(url, { method: "DELETE", headers })
      return res.ok
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: cruisesQueryKeys.cruises() })
    },
  })

  return { create, replaceAll, update, remove }
}
