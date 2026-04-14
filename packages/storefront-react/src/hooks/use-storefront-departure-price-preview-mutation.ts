"use client"

import { useMutation } from "@tanstack/react-query"

import { previewStorefrontDeparturePrice } from "../operations.js"
import { useVoyantStorefrontContext } from "../provider.js"
import type { StorefrontDeparturePricePreviewInput } from "../schemas.js"

export function useStorefrontDeparturePricePreviewMutation(departureId: string | null | undefined) {
  const { baseUrl, fetcher } = useVoyantStorefrontContext()

  return useMutation({
    mutationFn: async (input: StorefrontDeparturePricePreviewInput) => {
      if (!departureId) {
        throw new Error("useStorefrontDeparturePricePreviewMutation requires a departureId")
      }

      return previewStorefrontDeparturePrice({ baseUrl, fetcher }, departureId, input)
    },
  })
}
