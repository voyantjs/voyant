import { useMutation, useQueryClient } from "@tanstack/react-query"
import { z } from "zod"

import { fetchWithValidation } from "../client.js"
import { useVoyantCruisesContext } from "../provider.js"
import { cruisesQueryKeys } from "../query-keys.js"
import { cruiseRecordSchema, singleEnvelope } from "../schemas.js"

const refreshResponseSchema = singleEnvelope(
  z.object({
    source: z.literal("external"),
    sourceProvider: z.string(),
    sourceRef: z.record(z.string(), z.unknown()),
    cruise: z.unknown(),
    refreshedAt: z.string(),
  }),
)

const detachResponseSchema = singleEnvelope(cruiseRecordSchema)

/**
 * External-source admin actions: refresh re-fetches the cruise from the
 * adapter; detach takes a one-way snapshot, creating a local cruise (with
 * ship + categories + sailings + day overrides) and severing the link.
 */
export function useExternalCruiseActions() {
  const { baseUrl, fetcher } = useVoyantCruisesContext()
  const client = { baseUrl, fetcher }
  const queryClient = useQueryClient()

  const refresh = useMutation({
    mutationFn: async (key: string) => {
      const result = await fetchWithValidation(
        `/v1/admin/cruises/${encodeURIComponent(key)}/refresh`,
        refreshResponseSchema,
        client,
        { method: "POST" },
      )
      return result.data
    },
    onSuccess: (_data, key) => {
      void queryClient.invalidateQueries({ queryKey: cruisesQueryKeys.cruise(key) })
    },
  })

  const detach = useMutation({
    mutationFn: async (key: string) => {
      const result = await fetchWithValidation(
        `/v1/admin/cruises/${encodeURIComponent(key)}/detach`,
        detachResponseSchema,
        client,
        { method: "POST" },
      )
      return result.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: cruisesQueryKeys.cruises() })
      void queryClient.invalidateQueries({ queryKey: cruisesQueryKeys.ships() })
      void queryClient.invalidateQueries({ queryKey: cruisesQueryKeys.sailings() })
    },
  })

  return { refresh, detach }
}
