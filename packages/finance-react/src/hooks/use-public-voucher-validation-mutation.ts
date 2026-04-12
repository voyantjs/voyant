"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { validatePublicVoucher } from "../operations.js"
import { useVoyantFinanceContext } from "../provider.js"
import { financeQueryKeys } from "../query-keys.js"
import type { PublicValidateVoucherInput } from "../schemas.js"

export function usePublicVoucherValidationMutation() {
  const { baseUrl, fetcher } = useVoyantFinanceContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: PublicValidateVoucherInput) =>
      validatePublicVoucher({ baseUrl, fetcher }, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: financeQueryKeys.publicVoucherValidation(),
      })
    },
  })
}
